import { describe, expect, it } from 'vitest';
import { formatSlideLoc, parseSlideLoc } from './slide-loc.ts';

describe('slide-loc', () => {
  it('formats and parses file:line:column', () => {
    expect(formatSlideLoc('slides/a.tsx', 12, 4)).toBe('slides/a.tsx:12:4');
    expect(parseSlideLoc('slides/a.tsx:12:4')).toEqual({
      file: 'slides/a.tsx',
      line: 12,
      column: 4,
    });
  });

  it('supports legacy line:column without a file', () => {
    expect(formatSlideLoc(null, 3, 1)).toBe('3:1');
    expect(parseSlideLoc('3:1')).toEqual({ file: null, line: 3, column: 1 });
  });
});
