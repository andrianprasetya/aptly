// Circular overlap-score ring (172px). Stroke + score color come from the band.

export default function ScoreRing({
  score,
  color,
}: {
  score: number;
  color: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = 68;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - clamped / 100);

  return (
    <div className="relative h-[172px] w-[172px] flex-none">
      <svg width="172" height="172" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#eef2f6" strokeWidth="14" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-[50px] font-semibold leading-none"
          style={{ color }}
        >
          {clamped}
        </span>
        <span className="mt-[3px] font-mono text-[11.5px] text-slate-400">/ 100</span>
      </div>
    </div>
  );
}
