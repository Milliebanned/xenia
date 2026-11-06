/** White pixel-block X mark plus the lowercase wordmark. */
export function XMark({ size = 30 }: { size?: number }) {
  const cells = [
    [0, 0], [1, 1], [3, 0], [2, 1],
    [1, 2], [2, 2], [0, 3], [3, 3],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 4 4" shapeRendering="crispEdges" aria-hidden="true" className="xl-mark">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />
      ))}
      <rect x="1.5" y="1.5" width="1" height="1" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <span className="xl-wordmark">
      <XMark size={size} />
      <span>xenia</span>
    </span>
  );
}

export function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className="xl-arrow">
      <path d="M2.5 8h10M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
    </svg>
  );
}
