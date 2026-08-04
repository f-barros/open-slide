import { describe, expect, it } from 'vitest';
import { normalizeSlideModule } from './normalize-slide-module.ts';

describe('normalizeSlideModule', () => {
  it('accepts a valid Page array', () => {
    const Page = () => null;
    const result = normalizeSlideModule({ default: [Page] });
    expect(result.ok).toBe(true);
  });

  it('rejects a missing default export', () => {
    const result = normalizeSlideModule({ meta: { title: 'x' } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/missing default/i);
  });

  it('rejects a non-array default', () => {
    const result = normalizeSlideModule({ default: () => null });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/must be an array/i);
  });

  it('rejects an empty presentation', () => {
    const result = normalizeSlideModule({ default: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Empty presentation/i);
  });

  it('rejects non-component page entries', () => {
    const result = normalizeSlideModule({ default: [null] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/pages\[0\]/i);
  });
});
