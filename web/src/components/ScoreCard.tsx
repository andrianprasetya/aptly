import ScoreRing from "./ScoreRing";

type Band = {
  ring: string; // hex for the SVG stroke + score number
  pill: string; // tailwind classes for the band pill
  dot: string; // tailwind bg for the pill dot
  label: string;
};

function bandFor(score: number): Band {
  if (score >= 75)
    return {
      ring: "#16a34a",
      pill: "bg-green-50 border-green-200 text-green-700",
      dot: "bg-green-600",
      label: "Strong overlap",
    };
  if (score >= 50)
    return {
      ring: "#d97706",
      pill: "bg-amber-50 border-amber-200 text-amber-700",
      dot: "bg-amber-600",
      label: "Partial overlap",
    };
  return {
    ring: "#dc2626",
    pill: "bg-red-50 border-red-200 text-red-700",
    dot: "bg-red-600",
    label: "Low overlap",
  };
}

export default function ScoreCard({
  score,
  summary,
}: {
  score: number;
  summary: string;
}) {
  const band = bandFor(score);

  return (
    <section className="flex flex-col items-center gap-6 rounded-[18px] border border-slate-200 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,.04)] sm:flex-row sm:gap-[34px] sm:p-8">
      <ScoreRing score={score} color={band.ring} />
      <div className="flex-1 text-center sm:text-left">
        <span
          className={`inline-flex items-center gap-[7px] rounded-full border px-3 py-[5px] text-[12.5px] font-semibold ${band.pill}`}
        >
          <span className={`inline-block h-[7px] w-[7px] rounded-full ${band.dot}`} />
          {band.label}
        </span>
        <p className="mt-[13px] text-[16px] leading-[1.6] text-slate-900">{summary}</p>
        <p className="mt-[13px] flex items-center justify-center gap-[7px] font-mono text-xs text-slate-400 sm:justify-start">
          <span className="inline-flex h-[15px] w-[15px] items-center justify-center rounded-full border-[1.5px] border-slate-300 text-[9px]">
            i
          </span>
          Overlap estimate — not a real ATS score.
        </p>
      </div>
    </section>
  );
}
