import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeSlideModule } from './normalize-slide-module.ts';
import type { SlideModule } from './sdk';
import { loadSlide, slideChangeIncludes } from './slides';

export function useSlideModule(slideId: string) {
  const [slide, setSlide] = useState<SlideModule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadSeqRef = useRef(0);

  const reload = useCallback(
    (reset: boolean) => {
      const seq = ++loadSeqRef.current;
      if (reset) setSlide(null);
      setError(null);
      loadSlide(slideId)
        .then((mod) => {
          if (seq !== loadSeqRef.current) return;
          const normalized = normalizeSlideModule(mod);
          if (!normalized.ok) {
            setSlide(null);
            setError(normalized.error);
            return;
          }
          setSlide(normalized.module);
        })
        .catch((e) => {
          if (seq === loadSeqRef.current) setError(String(e?.message ?? e));
        });
    },
    [slideId],
  );

  useEffect(() => {
    reload(true);
  }, [reload]);

  useEffect(() => {
    if (!import.meta.hot) return;
    let cancelled = false;
    const handler = (data: unknown) => {
      if (slideChangeIncludes(data, slideId)) {
        queueMicrotask(() => {
          if (!cancelled) reload(false);
        });
      }
    };
    import.meta.hot.on('open-slide:slide-changed', handler);
    return () => {
      cancelled = true;
      import.meta.hot?.off('open-slide:slide-changed', handler);
    };
  }, [slideId, reload]);

  return { slide, error, reload };
}
