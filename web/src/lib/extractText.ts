// Client-side CV text extraction. PDFs via pdf.js, DOCX via mammoth — both run
// in the browser, so nothing is uploaded to a server just to read the file.
// The API still receives plain `cvText`.

export type ExtractFailReason =
  | "wrongtype" // not .pdf / .docx (e.g. legacy .doc)
  | "toolarge" // over the size cap
  | "scanned" // parsed, but no selectable text (likely a scanned image PDF)
  | "parseerror"; // something threw while parsing

export type ExtractResult =
  | { ok: true; text: string; pages?: number }
  | { ok: false; reason: ExtractFailReason };

export const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Below this many non-whitespace chars we treat the PDF as scanned (no OCR).
const MIN_TEXT_CHARS = 24;

export function isPdf(file: File): boolean {
  return file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
}

export function isDocx(file: File): boolean {
  return (
    file.name.toLowerCase().endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

export async function extractText(file: File): Promise<ExtractResult> {
  if (!isPdf(file) && !isDocx(file)) return { ok: false, reason: "wrongtype" };
  if (file.size > MAX_BYTES) return { ok: false, reason: "toolarge" };

  try {
    if (isPdf(file)) {
      const { text, pages } = await extractPdf(file);
      const clean = normalize(text);
      if (clean.length < MIN_TEXT_CHARS) return { ok: false, reason: "scanned" };
      return { ok: true, text: clean, pages };
    }
    const clean = normalize(await extractDocx(file));
    if (clean.length < MIN_TEXT_CHARS) return { ok: false, reason: "scanned" };
    return { ok: true, text: clean };
  } catch {
    return { ok: false, reason: "parseerror" };
  }
}

// Collapse extraction whitespace: runs of horizontal whitespace (space, tab,
// nbsp — everything but newline) and 3+ blank lines. Cuts bloat from per-item
// spacing and tidies up the extracted text.
function normalize(text: string): string {
  return text
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdf(file: File): Promise<{ text: string; pages: number }> {
  const pdfjs = await import("pdfjs-dist");
  // Worker served from a CDN, matching the installed version — avoids bundler
  // worker-wiring quirks while still parsing entirely client-side.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str?: string }>;
    out += items.map((it) => it.str ?? "").join(" ") + "\n";
  }
  return { text: out, pages: doc.numPages };
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value ?? "";
}

/** Human label like "PDF · 182 KB · 2 pages" for the file chip. */
export function fileMeta(file: File, pages?: number): string {
  const ext = file.name.toLowerCase().endsWith(".docx") ? "DOCX" : "PDF";
  const kb = Math.max(1, Math.round(file.size / 1024));
  const size = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
  return `${ext} · ${size}${pages ? ` · ${pages} page${pages > 1 ? "s" : ""}` : ""}`;
}
