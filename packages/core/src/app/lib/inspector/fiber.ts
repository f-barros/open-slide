import { formatSlideLoc, parseSlideLoc } from './slide-loc.ts';

export type SlideSourceHit = {
  /** Deck-relative POSIX path when known (from loc-tags or fiber). */
  file: string | null;
  line: number;
  column: number;
  anchor: HTMLElement;
};

export type FindSlideSourceOptions = {
  // Visual editor uses this: skip component-invocation JSX (`<MyComp/>`)
  // since most components don't forward `style`. Comments leave it off
  // so any JSX can be annotated.
  hostOnly?: boolean;
};

type FiberLike = {
  return: FiberLike | null;
  stateNode?: unknown;
  _debugSource?: { fileName?: string; lineNumber?: number; columnNumber?: number };
  memoizedProps?: { __source?: { fileName?: string; lineNumber?: number; columnNumber?: number } };
};

function getFiber(el: Element): FiberLike | null {
  const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
  if (!key) return null;
  return (el as unknown as Record<string, FiberLike>)[key] ?? null;
}

function getSource(fiber: FiberLike) {
  return fiber._debugSource ?? fiber.memoizedProps?.__source;
}

// `_debugSource.fileName` may carry Vite's HMR query (`?t=…`) and, on
// Windows, backslash separators. Both break the naive `endsWith` match.
function normalizeDebugFileName(fileName: string): string {
  return fileName.split(/[?#]/)[0].replace(/\\/g, '/');
}

function deckRelFromDebugFile(fileName: string, slideId: string): string | null {
  const normalized = normalizeDebugFileName(fileName);
  const needle = `/slides/${slideId}/`;
  const idx = normalized.lastIndexOf(needle);
  if (idx === -1) return null;
  return normalized.slice(idx + needle.length);
}

export function findSlideSource(
  el: HTMLElement,
  slideId: string,
  opts?: FindSlideSourceOptions,
): SlideSourceHit | null {
  // Primary path: the `data-slide-loc` attribute injected by the
  // loc-tags Vite plugin. Immune to HMR-stale fiber state.
  const tagged = el.closest<HTMLElement>('[data-slide-loc]');
  if (tagged) {
    const loc = tagged.dataset.slideLoc;
    if (loc) {
      const parsed = parseSlideLoc(loc);
      if (parsed) {
        return {
          file: parsed.file,
          line: parsed.line,
          column: parsed.column,
          anchor: tagged,
        };
      }
    }
  }

  // Fallback for JSX when loc-tags didn't run or fiber still has debug source.
  const needle = `/slides/${slideId}/`;
  let fiber = getFiber(el);
  let anchor: HTMLElement = el;
  while (fiber) {
    const src = getSource(fiber);
    const isHost = fiber.stateNode instanceof HTMLElement;
    const fileName = src?.fileName ? normalizeDebugFileName(src.fileName) : null;
    if (fileName?.includes(needle) && src?.lineNumber && (!opts?.hostOnly || isHost)) {
      return {
        file: deckRelFromDebugFile(src.fileName ?? fileName, slideId),
        line: src.lineNumber,
        column: src.columnNumber ?? 0,
        anchor: isHost ? (fiber.stateNode as HTMLElement) : anchor,
      };
    }
    if (isHost) {
      anchor = fiber.stateNode as HTMLElement;
    }
    fiber = fiber.return;
  }
  return null;
}

export { formatSlideLoc, parseSlideLoc };
