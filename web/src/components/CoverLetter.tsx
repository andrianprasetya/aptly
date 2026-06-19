"use client";

import { useState } from "react";

export default function CoverLetter({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Cover letter
        </h2>
        <button
          type="button"
          onClick={copy}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        {text}
      </p>
    </section>
  );
}
