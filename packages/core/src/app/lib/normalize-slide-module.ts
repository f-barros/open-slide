import type { Page, SlideModule } from './sdk.ts';

export type NormalizeSlideModuleResult =
  | { ok: true; module: SlideModule }
  | { ok: false; error: string };

function isPageComponent(value: unknown): value is Page {
  return typeof value === 'function';
}

/**
 * Validate a loaded slide module before the UI consumes it.
 * Keeps a single error shape for empty decks and malformed exports.
 */
export function normalizeSlideModule(raw: unknown): NormalizeSlideModuleResult {
  if (raw == null || typeof raw !== 'object') {
    return { ok: false, error: 'Invalid presentation export: expected a module object.' };
  }

  const mod = raw as Partial<SlideModule> & { default?: unknown };
  if (!('default' in mod)) {
    return {
      ok: false,
      error: 'Invalid presentation export: missing default export (expected Page[]).',
    };
  }
  if (!Array.isArray(mod.default)) {
    return {
      ok: false,
      error: 'Invalid presentation export: default export must be an array of Page components.',
    };
  }
  if (mod.default.length === 0) {
    return {
      ok: false,
      error: 'Empty presentation: export default must include at least one Page.',
    };
  }

  for (let i = 0; i < mod.default.length; i++) {
    if (!isPageComponent(mod.default[i])) {
      return {
        ok: false,
        error: `Invalid presentation export: pages[${i}] is not a React component.`,
      };
    }
  }

  return { ok: true, module: mod as SlideModule };
}
