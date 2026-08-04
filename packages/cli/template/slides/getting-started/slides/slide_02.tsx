import type { Page } from '@comp-slide/core';
import { Footer } from '../components/footer';
import { Header } from '../components/header';
import { canvas, theme } from '../components/theme';

const steps = [
  { title: 'index.tsx', body: 'Import pages and export default in display order.' },
  { title: 'slides/', body: 'One Page component per file — edit pages independently.' },
  { title: 'components/', body: 'Headers, footers, cards, and theme tokens shared across pages.' },
];

export const Slide02: Page = () => (
  <div style={canvas}>
    <Header label="Structure" />
    <h2
      style={{
        margin: '0 0 48px',
        fontSize: 72,
        letterSpacing: '-0.025em',
        fontFamily: 'var(--osd-font-display)',
        fontWeight: 650,
      }}
    >
      Deck layout
    </h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {steps.map((step) => (
        <div
          key={step.title}
          style={{
            display: 'flex',
            gap: 28,
            alignItems: 'baseline',
            padding: '28px 32px',
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
          }}
        >
          <code
            style={{
              fontSize: 32,
              color: theme.accent,
              fontWeight: 600,
              minWidth: 280,
            }}
          >
            {step.title}
          </code>
          <span style={{ fontSize: 32, color: theme.textSoft, lineHeight: 1.35 }}>{step.body}</span>
        </div>
      ))}
    </div>
    <Footer page="02" />
  </div>
);
