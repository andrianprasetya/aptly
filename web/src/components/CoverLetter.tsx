"use client";

import { useState } from "react";
import {
  downloadCoverLetterPdf,
  downloadCoverLetterDocx,
} from "@/lib/exportCoverLetter";

const BTN =
  "inline-flex flex-none items-center gap-[7px] rounded-[10px] border bg-white px-[13px] py-[9px] text-[13px] font-semibold transition-colors hover:bg-slate-50 disabled:opacity-50";

export default function CoverLetter({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<null | "pdf" | "docx">(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function download(kind: "pdf" | "docx") {
    setBusy(kind);
    try {
      if (kind === "pdf") await downloadCoverLetterPdf(text);
      else await downloadCoverLetterDocx(text);
    } catch {
      // generation failed — leave the letter on screen; user can copy instead
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-[18px]">
        <div>
          <div className="text-sm font-semibold text-slate-900">Cover letter</div>
          <div className="mt-0.5 text-[12.5px] text-slate-400">
            Grounded in your CV — review and edit before sending.
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={copy}
            className={`${BTN} ${copied ? "border-green-200 text-green-700" : "border-slate-200 text-slate-700"}`}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => download("pdf")}
            disabled={busy !== null}
            className={`${BTN} border-slate-200 text-slate-700`}
          >
            {busy === "pdf" ? "…" : "PDF"}
          </button>
          <button
            type="button"
            onClick={() => download("docx")}
            disabled={busy !== null}
            className={`${BTN} border-slate-200 text-slate-700`}
          >
            {busy === "docx" ? "…" : "DOCX"}
          </button>
        </div>
      </div>
      <div className="max-w-[660px] whitespace-pre-wrap px-[30px] py-[26px] text-[14.5px] leading-[1.75] text-slate-800">
        {text}
      </div>
    </section>
  );
}
