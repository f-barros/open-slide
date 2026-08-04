import type { Page, SlideMeta } from '@comp-slide/core';
import { Agenda } from './slides/agenda';
import { Cover } from './slides/cover';

export const meta: SlideMeta = {
  title: 'Modular Deck',
  createdAt: '2026-01-06T00:00:00.000Z',
};

export const notes: (string | undefined)[] = ['Cover note', 'Agenda note'];

export default [Cover, Agenda] satisfies Page[];
