import type { CSSProperties } from 'react';

export const theme = {
  bg: '#08090a',
  text: '#f7f8f8',
  textSoft: '#c7c9d1',
  muted: '#6f727c',
  accent: '#7170ff',
  surface: '#0e0f12',
  border: 'rgba(255,255,255,0.08)',
  fontDisplay: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
  fontBody: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
} as const;

export const canvas: CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box',
  padding: '100px 120px',
};
