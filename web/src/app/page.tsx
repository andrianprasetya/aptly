"use client";

import { useState } from "react";
import { analyze, type AnalysisResult } from "@/lib/api";
import ScoreCard from "@/components/ScoreCard";
import SkillList from "@/components/SkillList";
import CoverLetter from "@/components/CoverLetter";

export default function Home() {
  const [cvText, setCvText] = useState("");
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const canSubmit = cvText.trim() !== "" && jdText.trim() !== "" && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
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
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-10 sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Aptly
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Paste your CV and a job description for an honest fit estimate and a
          grounded cover letter.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Your CV"
            placeholder="Paste your CV / resume text…"
            value={cvText}
            onChange={setCvText}
          />
          <Field
            label="Job description"
            placeholder="Paste the job description…"
            value={jdText}
            onChange={setJdText}
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Analyzing…" : "Analyze fit"}
          </button>
          {loading && (
            <span className="text-sm text-zinc-500">
              Talking to the model — this can take a few seconds.
            </span>
          )}
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
        >
          {error}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-6">
          <ScoreCard score={result.matchScore} summary={result.summary} />

          <section className="grid gap-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2">
            <SkillList
              title="Matched skills"
              items={result.matchedSkills}
              tone="positive"
            />
            <SkillList
              title="Missing skills"
              items={result.missingSkills}
              tone="negative"
            />
            <SkillList
              title="Missing keywords"
              items={result.missingKeywords}
              tone="neutral"
            />
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Suggestions{" "}
                <span className="font-normal text-zinc-400">
                  ({result.suggestions.length})
                </span>
              </h3>
              {result.suggestions.length === 0 ? (
                <p className="text-sm text-zinc-400">None.</p>
              ) : (
                <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  {result.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <CoverLetter text={result.coverLetter} />
        </div>
      )}

      <footer className="mt-auto border-t border-zinc-200 pt-6 text-xs leading-5 text-zinc-500 dark:border-zinc-800">
        Prototype. Your CV and the job description are sent to the API only to
        generate this analysis and aren&apos;t stored anywhere. The match score
        is a rough overlap estimate, not a real ATS score.
      </footer>
    </main>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={12}
        className="resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-700"
      />
    </label>
  );
}
