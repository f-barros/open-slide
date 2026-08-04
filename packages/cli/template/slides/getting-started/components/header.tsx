import { theme } from './theme';

export function Header({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 48,
      }}
    >
      <span
        style={{
          fontSize: 22,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: theme.muted,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 22,
          color: theme.accent,
          fontWeight: 600,
        }}
      >
        open-slide
      </span>
    </div>
  );
}
