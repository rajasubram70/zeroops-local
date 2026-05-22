export function LiveBadge({ isLive, lastSync }) {
  if (isLive) return (
    <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#16A34A',
      display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%',
        background: '#16A34A', display: 'inline-block' }}/>
      LIVE · {lastSync?.toLocaleTimeString()}
    </span>
  );
  return (
    <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#888780',
      display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%',
        background: '#888780', display: 'inline-block' }}/>
      STATIC
    </span>
  );
}