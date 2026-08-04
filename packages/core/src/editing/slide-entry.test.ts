import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findSlideEntries,
  resolveSlideEntry,
  resolveSlideSourceFile,
  slideIdForPath,
} from './slide-entry.ts';

async function withRoot<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-entry-'));
  try {
    return await fn(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

describe('resolveSlideEntry', () => {
  it('resolves index.tsx', async () => {
    await withRoot(async (root) => {
      await fs.mkdir(path.join(root, 'deck'), { recursive: true });
      await fs.writeFile(path.join(root, 'deck', 'index.tsx'), 'export default [];', 'utf8');
      expect(resolveSlideEntry(root, 'deck')).toBe(path.join(root, 'deck', 'index.tsx'));
    });
  });

  it('ignores presentation.tsx as a deck entry', async () => {
    await withRoot(async (root) => {
      await fs.mkdir(path.join(root, 'deck'), { recursive: true });
      await fs.writeFile(path.join(root, 'deck', 'presentation.tsx'), 'export default [];', 'utf8');
      expect(resolveSlideEntry(root, 'deck')).toBeNull();
    });
  });
});

describe('findSlideEntries', () => {
  it('discovers index entries and ignores nested slide files as decks', async () => {
    await withRoot(async (root) => {
      await fs.mkdir(path.join(root, 'modular', 'slides'), { recursive: true });
      await fs.mkdir(path.join(root, 'modular', 'components'), { recursive: true });
      await fs.writeFile(path.join(root, 'modular', 'index.tsx'), 'export default [];', 'utf8');
      await fs.writeFile(
        path.join(root, 'modular', 'slides', 'slide_01.tsx'),
        'export const Slide01 = () => null;',
        'utf8',
      );
      await fs.writeFile(
        path.join(root, 'modular', 'components', 'header.tsx'),
        'export const Header = () => null;',
        'utf8',
      );
      await fs.mkdir(path.join(root, 'presentation-only'), { recursive: true });
      await fs.writeFile(
        path.join(root, 'presentation-only', 'presentation.tsx'),
        'export default [];',
        'utf8',
      );

      const entries = await findSlideEntries(root);
      const ids = entries.map((e) => path.basename(path.dirname(e))).sort();
      expect(ids).toEqual(['modular']);
      expect(entries.some((e) => e.endsWith(`modular${path.sep}index.tsx`))).toBe(true);
    });
  });
});

describe('slideIdForPath / resolveSlideSourceFile', () => {
  it('maps nested files to the deck id', async () => {
    await withRoot(async (root) => {
      const nested = path.join(root, 'deck', 'slides', 'a.tsx');
      expect(slideIdForPath(root, nested)).toBe('deck');
    });
  });

  it('resolves a deck-relative source file safely', async () => {
    await withRoot(async (root) => {
      await fs.mkdir(path.join(root, 'deck', 'slides'), { recursive: true });
      await fs.writeFile(path.join(root, 'deck', 'index.tsx'), 'export default [];', 'utf8');
      await fs.writeFile(
        path.join(root, 'deck', 'slides', 'a.tsx'),
        'export const A = () => null;',
        'utf8',
      );
      expect(resolveSlideSourceFile(root, 'deck', 'slides/a.tsx')).toBe(
        path.join(root, 'deck', 'slides', 'a.tsx'),
      );
      expect(resolveSlideSourceFile(root, 'deck', '../other.tsx')).toBeNull();
      expect(resolveSlideSourceFile(root, 'deck')).toBe(path.join(root, 'deck', 'index.tsx'));
    });
  });
});
