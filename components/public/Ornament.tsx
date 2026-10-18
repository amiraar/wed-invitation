// Botanical sprig drawn inline (no image files), in currentColor so it follows the section's text color.

// Leaves along the stem: [x, length, height, side] with side 1 = above the stem, -1 = below.
const LEAVES: [number, number, number, 1 | -1][] = [
  [26, 18, 8, 1],
  [40, 17, 7, -1],
  [56, 15, 7, 1],
  [70, 13, 6, -1],
  [84, 11, 5, 1],
  [96, 9, 4, -1]
];

function leafPath(x: number, length: number, height: number, side: 1 | -1): string {
  const y = 20;
  const h = height * -side;
  return `M${x} ${y} C${x + length * 0.25} ${y + h * 1.1} ${x + length * 0.7} ${y + h * 1.15} ${x + length} ${y + h}`
    + ` C${x + length * 0.65} ${y + h * 0.35} ${x + length * 0.3} ${y + h * 0.05} ${x} ${y} Z`;
}

export function Sprig({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 40"
      fill="none"
      aria-hidden="true"
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M2 20 C 40 19, 80 21, 112 20" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      {LEAVES.map(([x, length, height, side], index) => (
        <path key={x} d={leafPath(x, length, height, side)} fill="currentColor" opacity={index % 2 === 0 ? 0.6 : 0.4} />
      ))}
      <circle cx="114" cy="20" r="1.6" fill="currentColor" />
    </svg>
  );
}

// Two sprigs facing a small diamond: the divider used on the cover, hero, headings and footer.
export function OrnamentDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`} aria-hidden="true">
      <Sprig flip className="h-5 w-20 sm:w-24" />
      <span className="ornament-diamond" />
      <Sprig className="h-5 w-20 sm:w-24" />
    </div>
  );
}
