"use client";

import { useState } from "react";

export default function CoverLetter({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04)]">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-[18px]">
        <div>
          <div className="text-sm font-semibold text-slate-900">Cover letter</div>
          <div className="mt-0.5 text-[12.5px] text-slate-400">
            Grounded in your CV — review and edit before sending.
          </div>
        </div>
        <button
          type="button"
          onClick={copy}
          className={`inline-flex flex-none items-center gap-[7px] rounded-[10px] border bg-white px-[15px] py-[9px] text-[13px] font-semibold transition-colors hover:bg-slate-50 ${
            copied
              ? "border-green-200 text-green-700"
              : "border-slate-200 text-slate-700"
          }`}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <div className="max-w-[660px] whitespace-pre-wrap px-[30px] py-[26px] text-[14.5px] leading-[1.75] text-slate-800">
        {text}
      </div>
    </section>
  );
}
