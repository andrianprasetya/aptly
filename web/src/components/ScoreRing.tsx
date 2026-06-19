// A circular progress ring for the overlap score. Color shifts by band.

function bandColor(score: number): string {
  if (score >= 75) return "#16a34a"; // green-600
  if (score >= 50) return "#d97706"; // amber-600
  return "#dc2626"; // red-600
}

export default function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const color = bandColor(clamped);

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" role="img"
      aria-label={`Overlap score ${clamped} out of 100`}>
      <circle
        cx="64" cy="64" r={radius}
        fill="none" strokeWidth="12"
        className="stroke-zinc-200 dark:stroke-zinc-800"
      />
      <circle
        cx="64" cy="64" r={radius}
        fill="none" strokeWidth="12" strokeLinecap="round"
        stroke={color}
        strokeDasharray={`${dash} ${circumference}`}
        transform="rotate(-90 64 64)"
      />
      <text
        x="64" y="64" textAnchor="middle" dominantBaseline="central"
        className="fill-zinc-900 dark:fill-zinc-50"
        fontSize="30" fontWeight="700"
      >
        {clamped}
      </text>
    </svg>
  );
}
