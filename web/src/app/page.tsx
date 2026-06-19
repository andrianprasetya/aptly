"use client";

import { useState } from "react";
import { analyze, MAX_INPUT_CHARS, type AnalysisResult } from "@/lib/api";
import CvInput from "@/components/CvInput";
import ScoreCard from "@/components/ScoreCard";
import SkillList from "@/components/SkillList";
import CoverLetter from "@/components/CoverLetter";

export default function Home() {
  const [cvText, setCvText] = useState("");
  const [jdText, setJdText] = useState("");
  const [parsing, setParsing] = useState(false); // CV file being extracted
  const [loading, setLoading] = useState(false); // analysis in flight
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const canSubmit =
    cvText.trim() !== "" && jdText.trim() !== "" && !loading && !parsing;

  async function onAnalyze() {
    if (!canSubmit) return;

    // Friendly length check before spending a request (mirrors the API cap).
    const overLimit: string[] = [];
    if (cvText.trim().length > MAX_INPUT_CHARS)
      overLimit.push(`your CV (${cvText.trim().length.toLocaleString()})`);
    if (jdText.trim().length > MAX_INPUT_CHARS)
      overLimit.push(`the job description (${jdText.trim().length.toLocaleString()})`);
    if (overLimit.length > 0) {
      setResult(null);
      setError(
        `Too long: ${overLimit.join(" and ")} — the limit is ${MAX_INPUT_CHARS.toLocaleString()} characters each. Trim it and try again.`,
      );
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await analyze(cvText, jdText));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-5 py-[18px] sm:px-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-blue-600 text-base font-bold text-white shadow-[0_2px_6px_rgba(37,99,235,.35)]">
              A
            </div>
            <span className="text-[19px] font-semibold tracking-[-0.02em]">Aptly</span>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-mono text-[12.5px] font-medium text-slate-500">
            CV ↔ JD fit check
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-5 pb-10 sm:px-10">
        <div className="pb-1.5 pt-[38px]">
          <h1 className="m-0 text-[31px] font-semibold leading-[1.12] tracking-[-0.03em]">
            See how your CV fits the job.
          </h1>
          <p className="mt-2.5 max-w-[580px] text-[15.5px] leading-[1.6] text-slate-600">
            Paste your CV and the job description. Get an honest overlap estimate, the
            skills you&apos;re missing, and a grounded cover letter — in seconds.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,.04)]">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <div className="p-[18px]">
              <CvInput value={cvText} onChange={setCvText} onBusyChange={setParsing} />
            </div>
            <div className="flex flex-col p-[18px] sm:border-l sm:border-slate-100">
              <label
                htmlFor="jd"
                className="mb-[11px] flex items-center gap-2 text-[13px] font-semibold text-slate-900"
              >
                Job description{" "}
                <span className="font-mono text-[11px] font-medium text-slate-400">
                  paste only
                </span>
              </label>
              <textarea
                id="jd"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the job description here…"
                className="w-full flex-1 resize-none rounded-[11px] border border-slate-200 bg-white px-[15px] py-[13px] text-[13px] leading-[1.65] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-500/15 min-h-[184px]"
              />
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="animate-fadeup mt-[18px] flex items-start gap-3 rounded-[13px] border border-red-200 bg-red-50 px-4 py-3.5"
          >
            <div className="mt-px flex h-[19px] w-[19px] flex-none items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
              !
            </div>
            <div>
              <div className="text-sm font-semibold text-red-700">{error}</div>
              <div className="mt-0.5 text-[13px] text-[#9f5151]">
                Your CV and the job description are still here.
              </div>
            </div>
          </div>
        )}

        <div className="mt-[18px] flex flex-wrap items-center gap-[18px]">
          {loading ? (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2.5 rounded-xl bg-blue-600 px-[22px] py-[13px] text-[14.5px] font-semibold text-white opacity-75"
            >
              <span className="inline-block h-[15px] w-[15px] animate-spin rounded-full border-2 border-white/45 border-t-white" />
              Analyzing…
            </button>
          ) : (
            <button
              type="button"
              onClick={onAnalyze}
              disabled={!canSubmit}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-[13px] text-[14.5px] font-semibold text-white shadow-[0_1px_2px_rgba(37,99,235,.4),0_8px_18px_rgba(37,99,235,.22)] transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {result ? "Re-analyze" : "Analyze fit"}
            </button>
          )}
          <span className="max-w-[360px] text-[12.5px] leading-[1.5] text-slate-400">
            Nothing is stored — your CV and the job description are sent once for analysis.
          </span>
        </div>

        {loading && (
          <div className="mt-4 max-w-[420px]">
            <div className="h-[5px] overflow-hidden rounded-full bg-slate-200">
              <div className="animate-indet h-full w-[38%] rounded-full bg-blue-600" />
            </div>
            <p className="mt-[9px] text-[12.5px] text-slate-500">
              Reading your CV and the job description… this usually takes a few seconds.
            </p>
          </div>
        )}

        {result && (
          <div className="animate-fadeup mt-[30px] flex flex-col gap-4 border-t border-slate-100 pt-7">
            <ScoreCard score={result.matchScore} summary={result.summary} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SkillList title="Matched skills" items={result.matchedSkills} tone="matched" />
              <SkillList title="Missing skills" items={result.missingSkills} tone="missing" />
            </div>

            <SkillList
              title="Missing keywords"
              items={result.missingKeywords}
              tone="keywords"
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)]">
              <span className="text-[13.5px] font-semibold">Ways to strengthen your CV</span>
              <div className="mt-[15px] flex flex-col gap-[11px]">
                {result.suggestions.length === 0 ? (
                  <span className="text-[13px] text-slate-400">None.</span>
                ) : (
                  result.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-[13px]">
                      <span className="mt-px flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] bg-blue-50 font-mono text-xs font-semibold text-blue-600">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-[1.55] text-slate-700">{s}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <CoverLetter text={result.coverLetter} />
          </div>
        )}

        <footer className="mt-[30px] flex items-center gap-[9px] border-t border-slate-100 pb-9 pt-[18px] text-[12.5px] text-slate-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-300" />
          Private by design — your CV and the job description aren&apos;t stored anywhere.
        </footer>
      </main>
    </>
  );
}
