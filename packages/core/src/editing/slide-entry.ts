import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

export const SLIDE_ID_RE = /^[a-z0-9_-]+$/i;

export const SLIDE_ENTRY_BASENAMES = ['index'] as const;
export const SLIDE_ENTRY_EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js'] as const;

const ENTRY_FILE_RE = /^index\.(tsx|jsx|ts|js)$/;

export function isSlideEntryFilename(name: string): boolean {
  return ENTRY_FILE_RE.test(name);
}

function entryCandidates(dir: string): string[] {
  const out: string[] = [];
  for (const base of SLIDE_ENTRY_BASENAMES) {
    for (const ext of SLIDE_ENTRY_EXTENSIONS) {
      out.push(path.join(dir, `${base}${ext}`));
    }
  }
  return out;
}

/**
 * Resolve the deck entry file for `slides/<slideId>/`.
 * The sole entry is `index.{tsx,jsx,ts,js}`.
 */
export function resolveSlideEntry(slidesRoot: string, slideId: string): string | null {
  if (!SLIDE_ID_RE.test(slideId)) return null;
  const root = path.resolve(slidesRoot);
  const dir = path.resolve(root, slideId);
  if (!dir.startsWith(root + path.sep) && dir !== root) return null;

  for (const candidate of entryCandidates(dir)) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export function slideEntryBasename(entryPath: string): string {
  return path.basename(entryPath);
}

/**
 * Discover deck entry files under `slidesRoot`.
 * One entry per deck folder; nested `slides/` / `components/` are never deck roots.
 */
export async function findSlideEntries(slidesRoot: string): Promise<string[]> {
  const root = path.resolve(slidesRoot);
  if (!existsSync(root)) return [];

  let dirs: string[];
  try {
    const ents = await fs.readdir(root, { withFileTypes: true });
    dirs = ents.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }

  const entries: string[] = [];
  for (const name of dirs) {
    const entry = resolveSlideEntry(root, name);
    if (entry) entries.push(entry);
  }
  return entries.sort();
}

/**
 * Map any path under `slides/<id>/…` to that deck id (for HMR / watchers).
 * Returns null for paths outside the slides root or the root itself.
 */
export function slideIdForPath(slidesRoot: string, filePath: string): string | null {
  const root = path.resolve(slidesRoot);
  const abs = path.resolve(filePath);
  const rel = path.relative(root, abs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  const slideId = rel.split(path.sep)[0];
  if (!slideId || !SLIDE_ID_RE.test(slideId)) return null;
  return slideId;
}

/** True when `filePath` is a deck entry file (`index.*`). */
export function isSlideEntryPath(slidesRoot: string, filePath: string): boolean {
  const slideId = slideIdForPath(slidesRoot, filePath);
  if (!slideId) return false;
  const abs = path.resolve(filePath);
  const rel = path.relative(path.resolve(slidesRoot, slideId), abs);
  return !rel.includes('..') && !path.isAbsolute(rel) && isSlideEntryFilename(path.basename(abs));
}

/**
 * Resolve a writable source file under a deck.
 * `relFile` is deck-relative (POSIX or native separators). Defaults to the entry.
 */
export function resolveSlideSourceFile(
  slidesRoot: string,
  slideId: string,
  relFile?: string | null,
): string | null {
  if (!SLIDE_ID_RE.test(slideId)) return null;
  const root = path.resolve(slidesRoot);
  const dir = path.resolve(root, slideId);
  if (!dir.startsWith(root + path.sep) && dir !== root) return null;

  if (!relFile) return resolveSlideEntry(root, slideId);

  const normalized = relFile.replace(/\\/g, '/');
  if (
    !normalized ||
    normalized.startsWith('/') ||
    normalized.includes('..') ||
    path.isAbsolute(normalized)
  ) {
    return null;
  }
  if (!/\.(tsx|jsx|ts|js)$/.test(normalized) || normalized.endsWith('.d.ts')) return null;

  const full = path.resolve(dir, ...normalized.split('/'));
  if (!full.startsWith(dir + path.sep)) return null;
  return full;
}

/** Deck-relative POSIX path for a file under a slide folder. */
export function toDeckRelativePath(
  slidesRoot: string,
  slideId: string,
  absFile: string,
): string | null {
  const dir = path.resolve(slidesRoot, slideId);
  const abs = path.resolve(absFile);
  const rel = path.relative(dir, abs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return rel.split(path.sep).join('/');
}
