// Typed fetch wrapper to the Go API. Mirrors api/models.go:AnalysisResult.

export interface AnalysisResult {
  matchScore: number;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  missingKeywords: string[];
  suggestions: string[];
  coverLetter: string;
}

// Per-field input cap, mirrors the API's maxInputChars (api/service.go). Used
// for a friendly client-side check before spending a request.
export const MAX_INPUT_CHARS = 50000;

// NEXT_PUBLIC_API_URL is the public Go API URL (set on Vercel). Falls back to
// the local Go dev server.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function analyze(
  cvText: string,
  jdText: string,
  turnstileToken?: string | null,
): Promise<AnalysisResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (turnstileToken) headers["X-Turnstile-Token"] = turnstileToken;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers,
      body: JSON.stringify({ cvText, jdText }),
    });
  } catch {
    throw new Error(
      "Couldn't reach the analyzer. Check your connection and that the API is up.",
    );
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `Request failed (${res.status}).`);
  }

  return (await res.json()) as AnalysisResult;
}
