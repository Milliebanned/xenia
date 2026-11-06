/** Tiny two-square pixel-block logo mark. */
export function LogoMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true" className="xl-logo-mark">
      <rect x="0" y="0" width="10" height="10" fill="#7CFFB2" />
      <rect x="8" y="8" width="10" height="10" fill="#19E58A" opacity="0.9" />
      <rect x="8" y="8" width="2" height="2" fill="#050806" />
    </svg>
  );
}

const GLYPHS = [
  ["10101", "01010", "10101", "01010", "10101"],
  ["00100", "01110", "11111", "01110", "00100"],
  ["11111", "10001", "10101", "10001", "11111"],
  ["01110", "10001", "10001", "10001", "01110"],
  ["11000", "11000", "00011", "00011", "00000"],
  ["10000", "11000", "11100", "11110", "11111"],
  ["00100", "00100", "11111", "00100", "00100"],
  ["11011", "11011", "00000", "11011", "11011"],
];

function Glyph({ rows }: { rows: string[] }) {
  return (
    <svg width="25" height="25" viewBox="0 0 5 5" shapeRendering="crispEdges" aria-hidden="true">
      {rows.flatMap((r, y) =>
        r.split("").map((c, x) => (c === "1" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null)),
      )}
    </svg>
  );
}

/** Gentle marquee of pixel glyphs between sections. Decorative. */
export function GlyphMarquee({ words }: { words: string[] }) {
  const track = (k: string) => (
    <div className="xl-marquee-track" aria-hidden="true" key={k}>
      {words.map((w, i) => (
        <span className="xl-marquee-item" key={`${w}-${i}`}>
          <Glyph rows={GLYPHS[i % GLYPHS.length]} />
          <span>{w}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="xl-marquee" role="presentation">
      {track("a")}
      {track("b")}
    </div>
  );
}
