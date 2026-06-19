// Reusable chip list for matched/missing skills and missing keywords.

type Tone = "positive" | "negative" | "neutral";

const toneClasses: Record<Tone, string> = {
  positive:
    "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950 dark:text-green-400 dark:ring-green-400/20",
  negative:
    "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-400 dark:ring-red-400/20",
  neutral:
    "bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-400/20",
};

export default function SkillList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: Tone;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {title}{" "}
        <span className="font-normal text-zinc-400">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-400">None.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <li
              key={`${item}-${i}`}
              className={`rounded-full px-3 py-1 text-sm ring-1 ring-inset ${toneClasses[tone]}`}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
