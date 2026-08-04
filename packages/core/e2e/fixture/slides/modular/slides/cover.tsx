import type { Page } from '@comp-slide/core';
import { accent, fill } from '../components/theme';

export const Cover: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0, color: accent }}>Modular cover</h1>
    <p style={{ fontSize: 40 }}>Shared theme import</p>
  </div>
);
