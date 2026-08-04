import fs from 'node:fs/promises';
import path from 'node:path';
import type { ViteDevServer } from 'vite';
import {
  b64urlEncode,
  type Comment,
  findInsertion,
  markerDeleteRegex,
  newCommentId,
  offsetToLine,
  parseMarkers,
} from '../../editing/comments.ts';
import { resolveSlideEntry, resolveSlideSourceFile } from '../../editing/slide-entry.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import {
  type ApiContext,
  json,
  readBody,
  resolveSlideEntryPath,
  resolveSlideSourcePath,
} from './context.ts';

// GET    /__comments        list markers for ?slideId=…
// POST   /__comments/add    add marker { slideId, file?, line, column?, text, hint? }
// DELETE /__comments/:id    remove marker

type AddCommentBody = {
  slideId?: string;
  file?: string;
  line?: number;
  column?: number;
  text?: string;
  hint?: string;
};

async function listDeckTsxFiles(deckDir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    let ents: import('node:fs').Dirent[];
    try {
      ents = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of ents) {
      if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!ent.isFile()) continue;
      if (!/\.(tsx|jsx)$/.test(ent.name)) continue;
      if (ent.name.endsWith('.d.ts') || ent.name.endsWith('.test.tsx')) continue;
      out.push(full);
    }
  }
  await walk(deckDir);
  return out;
}

export function registerCommentRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__comments', async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';

    try {
      if (method === 'GET' && url.pathname === '/') {
        const slideId = url.searchParams.get('slideId') ?? '';
        const entry = resolveSlideEntryPath(ctx, slideId);
        if (!entry) return json(res, 400, { error: 'invalid slideId' });
        const deckDir = path.dirname(entry);
        const files = await listDeckTsxFiles(deckDir);
        const comments: Array<Comment & { file: string }> = [];
        for (const abs of files) {
          let source: string;
          try {
            source = await fs.readFile(abs, 'utf8');
          } catch {
            continue;
          }
          const rel = path.relative(deckDir, abs).split(path.sep).join('/');
          for (const c of parseMarkers(source)) {
            comments.push({ ...c, file: rel });
          }
        }
        return json(res, 200, { comments });
      }

      if (method === 'POST' && url.pathname === '/add') {
        const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const body = (await readBody(req)) as AddCommentBody;
        const slideId = body.slideId ?? '';
        const file = resolveSlideSourcePath(ctx, slideId, body.file);
        if (!file) return json(res, 400, { error: 'invalid slideId or file' });
        if (!body.line || body.line < 1) return json(res, 400, { error: 'invalid line' });
        if (!body.text || typeof body.text !== 'string') {
          return json(res, 400, { error: 'missing text' });
        }

        let source: string;
        try {
          source = await fs.readFile(file, 'utf8');
        } catch {
          return json(res, 404, { error: 'slide not found' });
        }

        const plan = findInsertion(source, body.line, body.column);
        if (!plan) {
          return json(res, 422, {
            error:
              'could not find a JSX container around line ' +
              `${body.line}. Try clicking a different element.`,
          });
        }

        const id = newCommentId();
        const ts = new Date().toISOString();
        const payload = b64urlEncode(JSON.stringify({ note: body.text, hint: body.hint }));
        const marker = `\n${plan.indent}{/* @slide-comment id="${id}" ts="${ts}" text="${payload}" */}`;

        const next = source.slice(0, plan.offset) + marker + source.slice(plan.offset);
        await fs.writeFile(file, next, 'utf8');
        const markerLine = offsetToLine(next, plan.offset + 1);
        const entry = resolveSlideEntry(ctx.slidesRoot, slideId);
        const deckRel =
          entry && path.dirname(entry)
            ? path.relative(path.dirname(entry), file).split(path.sep).join('/')
            : (body.file ?? null);
        return json(res, 200, { id, line: markerLine, file: deckRel });
      }

      if (method === 'DELETE' && url.pathname.startsWith('/')) {
        const requestCheck = validateMutationRequest(req);
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const id = url.pathname.slice(1);
        if (!/^c-[a-f0-9]+$/.test(id)) return json(res, 400, { error: 'invalid id' });
        const slideId = url.searchParams.get('slideId') ?? '';
        const entry = resolveSlideEntryPath(ctx, slideId);
        if (!entry) return json(res, 400, { error: 'invalid slideId' });

        const preferred = url.searchParams.get('file');
        const candidates: string[] = [];
        if (preferred) {
          const resolved = resolveSlideSourceFile(ctx.slidesRoot, slideId, preferred);
          if (resolved) candidates.push(resolved);
        }
        if (candidates.length === 0) {
          candidates.push(...(await listDeckTsxFiles(path.dirname(entry))));
        }

        const idRe = markerDeleteRegex(id);
        for (const file of candidates) {
          let source: string;
          try {
            source = await fs.readFile(file, 'utf8');
          } catch {
            continue;
          }
          const lines = source.split('\n');
          const hit = lines.findIndex((l) => idRe.test(l));
          if (hit === -1) continue;
          lines.splice(hit, 1);
          await fs.writeFile(file, lines.join('\n'), 'utf8');
          return json(res, 200, { ok: true });
        }
        return json(res, 404, { error: 'marker not found' });
      }

      next();
    } catch (err) {
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
