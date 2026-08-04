export type SlideLoc = {
  /** Deck-relative POSIX path, e.g. `slides/cover.tsx` or `index.tsx`. */
  file: string | null;
  line: number;
  column: number;
};

export function formatSlideLoc(
  file: string | null | undefined,
  line: number,
  column: number,
): string {
  if (file) return `${file}:${line}:${column}`;
  return `${line}:${column}`;
}

export function parseSlideLoc(raw: string): SlideLoc | null {
  const withFile = raw.match(/^(.*):(\d+):(\d+)$/);
  if (withFile) {
    const file = withFile[1];
    const line = Number(withFile[2]);
    const column = Number(withFile[3]);
    if (!file || !Number.isFinite(line) || !Number.isFinite(column)) return null;
    return { file, line, column };
  }
  const bare = raw.match(/^(\d+):(\d+)$/);
  if (!bare) return null;
  const line = Number(bare[1]);
  const column = Number(bare[2]);
  if (!Number.isFinite(line) || !Number.isFinite(column)) return null;
  return { file: null, line, column };
}

export function slideLocKey(file: string | null | undefined, line: number, column: number): string {
  return formatSlideLoc(file, line, column);
}
