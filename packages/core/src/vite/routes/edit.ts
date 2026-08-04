import fs from 'node:fs/promises';
import type { ViteDevServer } from 'vite';
import { applyEdit, type EditOp } from '../../editing/edit-ops.ts';
import { applyRevertAsset } from '../../editing/revert-asset.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import { type ApiContext, json, readBody, resolveSlideSourcePath } from './context.ts';

// POST /__edit                applyEdit({ slideId, file?, line, column, ops })
// POST /__edit/revert-asset   applyRevertAsset({ slideId, file?, assetPath })
// POST /__edit/batch          applyEdit × N — grouped by file

type EditBody = {
  slideId?: string;
  file?: string;
  line?: number;
  column?: number;
  ops?: EditOp[];
};

type EditBatchBody = {
  slideId?: string;
  edits?: Array<{ file?: string; line?: number; column?: number; ops?: EditOp[] }>;
};

export function registerEditRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__edit', async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';
    if (method !== 'POST') return next();
    const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
    if (!requestCheck.ok) return json(res, requestCheck.status, { error: requestCheck.error });

    try {
      if (url.pathname === '/') {
        const body = (await readBody(req)) as EditBody;
        const slideId = body.slideId ?? '';
        const file = resolveSlideSourcePath(ctx, slideId, body.file);
        if (!file) return json(res, 400, { error: 'invalid slideId or file' });
        if (!body.line || body.line < 1) return json(res, 400, { error: 'invalid line' });
        if (!Array.isArray(body.ops)) return json(res, 400, { error: 'missing ops' });

        let source: string;
        try {
          source = await fs.readFile(file, 'utf8');
        } catch {
          return json(res, 404, { error: 'slide not found' });
        }

        const result = applyEdit(source, body.line, body.column ?? 0, body.ops);
        if (!result.ok) return json(res, result.status, { error: result.error });
        const changed = result.source !== source;
        if (changed) await fs.writeFile(file, result.source, 'utf8');
        return json(res, 200, { ok: true, changed });
      }

      if (url.pathname === '/revert-asset') {
        const body = (await readBody(req)) as {
          slideId?: string;
          file?: string;
          assetPath?: string;
        };
        const slideId = body.slideId ?? '';
        const assetPath = body.assetPath;
        const file = resolveSlideSourcePath(ctx, slideId, body.file);
        if (!file) return json(res, 400, { error: 'invalid slideId or file' });
        if (typeof assetPath !== 'string' || !assetPath) {
          return json(res, 400, { error: 'missing assetPath' });
        }
        if (!assetPath.startsWith('./assets/') && !assetPath.startsWith('@assets/')) {
          return json(res, 400, { error: 'asset path must start with ./assets/ or @assets/' });
        }

        let source: string;
        try {
          source = await fs.readFile(file, 'utf8');
        } catch {
          return json(res, 404, { error: 'slide not found' });
        }

        const result = applyRevertAsset(source, assetPath);
        if (!result.ok) return json(res, result.status, { error: result.error });
        const changed = result.source !== source;
        if (changed) await fs.writeFile(file, result.source, 'utf8');
        return json(res, 200, { ok: true, changed });
      }

      // One read-modify-write per source file so a multi-element edit session
      // lands as few HMR ticks as possible. Per-edit failures are reported but
      // don't abort the batch.
      if (url.pathname === '/batch') {
        const body = (await readBody(req)) as EditBatchBody;
        const slideId = body.slideId ?? '';
        if (!Array.isArray(body.edits)) return json(res, 400, { error: 'missing edits' });

        type FileBucket = {
          abs: string;
          source: string;
          original: string;
          indices: number[];
        };
        const byFile = new Map<string, FileBucket>();
        const results: Array<{ ok: boolean; error?: string }> = new Array(body.edits.length);

        for (let i = 0; i < body.edits.length; i++) {
          const edit = body.edits[i];
          if (!edit.line || edit.line < 1 || !Array.isArray(edit.ops)) {
            results[i] = { ok: false, error: 'invalid edit' };
            continue;
          }
          const abs = resolveSlideSourcePath(ctx, slideId, edit.file);
          if (!abs) {
            results[i] = { ok: false, error: 'invalid slideId or file' };
            continue;
          }
          let bucket = byFile.get(abs);
          if (!bucket) {
            let source: string;
            try {
              source = await fs.readFile(abs, 'utf8');
            } catch {
              results[i] = { ok: false, error: 'slide not found' };
              continue;
            }
            bucket = { abs, source, original: source, indices: [] };
            byFile.set(abs, bucket);
          }
          bucket.indices.push(i);
          const r = applyEdit(bucket.source, edit.line, edit.column ?? 0, edit.ops);
          if (r.ok) {
            bucket.source = r.source;
            results[i] = { ok: true };
          } else {
            results[i] = { ok: false, error: r.error };
          }
        }

        let changed = false;
        for (const bucket of byFile.values()) {
          if (bucket.source !== bucket.original) {
            await fs.writeFile(bucket.abs, bucket.source, 'utf8');
            changed = true;
          }
        }
        return json(res, 200, { ok: true, changed, results });
      }

      return next();
    } catch (err) {
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
