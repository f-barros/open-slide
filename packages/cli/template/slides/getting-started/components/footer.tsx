import { theme } from './theme';

export function Footer({ page }: { page: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        bottom: 64,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: theme.muted,
        fontSize: 22,
      }}
    >
      <span>Modular decks · one file per page</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{page}</span>
    </div>
  );
}
