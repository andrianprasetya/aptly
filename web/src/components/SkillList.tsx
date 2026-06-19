// A titled card listing skill/keyword chips. Tone sets the dot + chip colors.

type Tone = "matched" | "missing" | "keywords";

const dot: Record<Tone, string> = {
  matched: "bg-green-600",
  missing: "bg-red-600",
  keywords: "bg-slate-400",
};

const chip: Record<Tone, string> = {
  matched: "bg-green-50 border-green-200 text-green-700",
  missing: "bg-red-50 border-red-200 text-red-700",
  keywords: "bg-slate-100 border-slate-200 text-slate-600 font-mono",
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)]">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-900">
          <span className={`inline-block h-2 w-2 rounded-full ${dot[tone]}`} />
          {title}
        </span>
        <span className="font-mono text-xs text-slate-400">{items.length}</span>
      </div>
      <div className="mt-[13px] flex flex-wrap gap-2">
        {items.length === 0 ? (
          <span className="text-[13px] text-slate-400">None.</span>
        ) : (
          items.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className={`inline-flex items-center rounded-[9px] border px-[11px] py-1.5 text-[13px] font-medium ${chip[tone]}`}
            >
              {item}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
