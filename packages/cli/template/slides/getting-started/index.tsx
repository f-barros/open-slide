import type { DesignSystem, Page, SlideMeta } from '@comp-slide/core';
import { theme } from './components/theme';
import { Slide01 } from './slides/slide_01';
import { Slide02 } from './slides/slide_02';

export const meta: SlideMeta = {
  title: 'Getting started',
  createdAt: '2026-08-03T00:00:00.000Z',
};

export const design: DesignSystem = {
  palette: {
    bg: theme.bg,
    text: theme.text,
    accent: theme.accent,
  },
  fonts: {
    display: theme.fontDisplay,
    body: theme.fontBody,
  },
  typeScale: {
    hero: 120,
    body: 36,
  },
  radius: 16,
};

export const notes: (string | undefined)[] = [
  'Welcome — open-slide decks are modular React.',
  'Shared chrome lives in components/; order is explicit here.',
];

export default [Slide01, Slide02] satisfies Page[];
