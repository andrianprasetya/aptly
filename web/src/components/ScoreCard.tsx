import ScoreRing from "./ScoreRing";

export default function ScoreCard({
  score,
  summary,
}: {
  score: number;
  summary: string;
}) {
  return (
    <section className="flex flex-col items-center gap-4 rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:text-left">
      <ScoreRing score={score} />
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Fit overlap
        </h2>
        {/* Honest framing — this is NOT a real ATS score. */}
        <p className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-500">
          Overlap estimate — not a real ATS score
        </p>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {summary}
        </p>
      </div>
    </section>
  );
}
