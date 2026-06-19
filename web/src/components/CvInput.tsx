"use client";

import { useRef, useState } from "react";
import { extractText, fileMeta, type ExtractFailReason } from "@/lib/extractText";

type CvStatus =
  | "idle"
  | "parsing"
  | "parsed"
  | ExtractFailReason; // wrongtype | toolarge | scanned | parseerror

const NOTES: Record<
  Exclude<CvStatus, "idle" | "parsing" | "parsed">,
  { tone: "red" | "amber"; title: string; body: string }
> = {
  wrongtype: {
    tone: "red",
    title: "Unsupported file. ",
    body: "Only .pdf and .docx are supported — the older .doc format can't be read in the browser. Re-save as PDF or DOCX, or paste the text below.",
  },
  toolarge: {
    tone: "red",
    title: "That file is over 5 MB. ",
    body: "Please upload a smaller PDF or DOCX, or paste the text below instead.",
  },
  scanned: {
    tone: "amber",
    title: "This looks like a scanned PDF. ",
    body: "We couldn't find selectable text — there's no OCR. Please paste your CV text below instead.",
  },
  parseerror: {
    tone: "red",
    title: "Couldn't read that file. ",
    body: "Something went wrong while parsing it. Try a different export, or paste your CV text below — anything you've already typed is kept.",
  },
};

export default function CvInput({
  value,
  onChange,
  onBusyChange,
}: {
  value: string;
  onChange: (v: string) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [status, setStatus] = useState<CvStatus>("idle");
  const [fileName, setFileName] = useState("");
  const [meta, setMeta] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const showDropzone = ["idle", "wrongtype", "toolarge", "parseerror"].includes(status);
  const showChip = status === "parsed" || status === "scanned";
  const note = status in NOTES ? NOTES[status as keyof typeof NOTES] : null;
  const dzError = ["wrongtype", "toolarge", "parseerror"].includes(status);

  const placeholder =
    status === "parsing"
      ? "Extracted text will appear here…"
      : status === "scanned"
        ? "Paste your CV text here…"
        : "Or paste your CV text here…";

  function openPicker() {
    inputRef.current?.click();
  }

  async function handleFile(file: File) {
    setStatus("parsing");
    setFileName(file.name);
    onBusyChange?.(true);
    const res = await extractText(file);
    onBusyChange?.(false);

    if (res.ok) {
      setStatus("parsed");
      setMeta(fileMeta(file, res.pages));
      onChange(res.text);
      return;
    }
    if (res.reason === "scanned") {
      setStatus("scanned");
      setMeta(`${fileMeta(file)} · no selectable text`);
      return;
    }
    setStatus(res.reason); // wrongtype | toolarge | parseerror — keep typed text
  }

  function clear() {
    setStatus("idle");
    setFileName("");
    setMeta("");
    onChange("");
  }

  return (
    <div>
      <label
        htmlFor="cv"
        className="mb-[11px] flex items-center gap-2 text-[13px] font-semibold text-slate-900"
      >
        Your CV{" "}
        <span className="font-mono text-[11px] font-medium text-slate-400">
          upload or paste
        </span>
      </label>

      {showDropzone && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload your CV: drop a PDF or DOCX, or choose a file"
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`flex cursor-pointer items-center gap-[14px] rounded-xl border-[1.5px] border-dashed px-4 py-[14px] transition-colors focus:outline-none focus:ring-[3px] focus:ring-blue-500/15 ${
            dzError
              ? "border-red-200 bg-[#fffafa]"
              : "border-slate-300 bg-[#fafbfc] hover:border-blue-600 hover:bg-[#f8fbff]"
          }`}
        >
          <div
            className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] ${
              dzError ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
            }`}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4" />
              <path d="M7 9l5-5 5 5" />
              <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold text-slate-800">
              Drop a PDF or DOCX here, or paste below
            </div>
            <div className="mt-0.5 font-mono text-[11.5px] text-slate-400">
              PDF · DOCX · up to 5 MB · parsed in your browser
            </div>
          </div>
          <span className="flex-none rounded-[9px] border border-slate-300 bg-white px-[14px] py-2 text-[12.5px] font-semibold text-slate-700">
            Choose file
          </span>
        </div>
      )}

      {status === "parsing" && (
        <div
          aria-live="polite"
          className="flex items-center gap-[13px] rounded-xl border border-blue-100 bg-blue-50 px-4 py-[14px]"
        >
          <span className="inline-block h-[18px] w-[18px] flex-none animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold text-blue-700">Reading your CV…</div>
            <div className="mt-0.5 truncate font-mono text-[11.5px] text-blue-400">
              {fileName} · extracting text
            </div>
          </div>
        </div>
      )}

      {showChip && (
        <div
          className={`flex items-center gap-3 rounded-xl border px-[13px] py-[11px] ${
            status === "scanned" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"
          }`}
        >
          <div
            className={`flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] ${
              status === "scanned" ? "bg-amber-100 text-amber-600" : "bg-blue-50 text-blue-600"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-slate-800">{fileName}</div>
            <div className="mt-px font-mono text-[11px] text-slate-400">{meta}</div>
          </div>
          <div className="flex flex-none gap-[7px]">
            <button
              type="button"
              onClick={openPicker}
              className="rounded-lg border border-slate-300 bg-white px-3 py-[7px] text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={clear}
              className="rounded-lg border border-slate-200 bg-white px-3 py-[7px] text-xs font-semibold text-slate-400 transition-colors hover:border-red-200 hover:text-red-600"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {note && (
        <div
          role="alert"
          className={`mt-[10px] flex items-start gap-[9px] rounded-[10px] border px-3 py-[10px] ${
            note.tone === "amber" ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"
          }`}
        >
          <span
            className={`mt-px flex h-4 w-4 flex-none items-center justify-center rounded-full text-[11px] font-bold text-white ${
              note.tone === "amber" ? "bg-amber-600" : "bg-red-600"
            }`}
          >
            !
          </span>
          <div
            className="text-[12.5px] leading-[1.5]"
            style={{ color: note.tone === "amber" ? "#92660c" : "#9f5151" }}
          >
            <span className="font-semibold">{note.title}</span>
            {note.body}
          </div>
        </div>
      )}

      <div className="relative mt-[11px]">
        <textarea
          id="cv"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-[150px] w-full resize-none rounded-[11px] border border-slate-200 px-[15px] py-[13px] text-[13px] leading-[1.65] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-500/15 ${
            status === "parsing" ? "bg-slate-50" : "bg-white"
          }`}
        />
        {status === "parsed" && (
          <span className="absolute right-3 top-[10px] inline-flex items-center gap-[5px] rounded-full border border-green-200 bg-green-50 px-[9px] py-[3px] font-mono text-[10.5px] font-semibold text-green-700">
            extracted · editable
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
