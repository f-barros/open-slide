import type { Page } from '@comp-slide/core';
import { Footer } from '../components/footer';
import { Header } from '../components/header';
import { canvas, theme } from '../components/theme';

export const Slide01: Page = () => (
  <div style={canvas}>
    <Header label="Cover" />
    <h1
      style={{
        margin: 0,
        fontSize: 'var(--osd-hero)',
        lineHeight: 1.05,
        letterSpacing: '-0.03em',
        fontFamily: 'var(--osd-font-display)',
        fontWeight: 650,
        maxWidth: 1400,
      }}
    >
      Build decks as React modules
    </h1>
    <p
      style={{
        marginTop: 36,
        fontSize: 40,
        lineHeight: 1.35,
        color: theme.textSoft,
        maxWidth: 1100,
      }}
    >
      Each page is its own file. Register order in{' '}
      <code style={{ color: theme.accent }}>index.tsx</code>. Share chrome from{' '}
      <code style={{ color: theme.accent }}>components/</code>.
    </p>
    <Footer page="01" />
  </div>
);
