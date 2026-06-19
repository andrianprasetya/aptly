// Download the cover letter as a nicely formatted PDF or DOCX, generated in the
// browser (no server round-trip). Libraries are dynamically imported so they
// only load when the user actually clicks download.

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Split into paragraphs on blank lines; keep single line breaks within a block
// (e.g. "Best regards,\nName") intact.
function toBlocks(text: string): string[] {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
}

export async function downloadCoverLetterPdf(text: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const margin = 64; // ~0.9in
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - margin * 2;
  const lineH = 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  let y = margin;
  for (const block of toBlocks(text)) {
    const lines = doc.splitTextToSize(block, maxW) as string[];
    for (const line of lines) {
      if (y > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineH;
    }
    y += lineH * 0.7; // gap between paragraphs
  }

  downloadBlob(doc.output("blob"), "cover-letter.pdf");
}

export async function downloadCoverLetterDocx(text: string) {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");

  const children = toBlocks(text).map((block) => {
    const runs = block
      .split("\n")
      .map((line, i) =>
        i === 0 ? new TextRun({ text: line }) : new TextRun({ text: line, break: 1 }),
      );
    return new Paragraph({ children: runs, spacing: { after: 220, line: 276 } });
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } }, // 11pt
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }, // 1in
        },
        children,
      },
    ],
  });

  downloadBlob(await Packer.toBlob(doc), "cover-letter.docx");
}
