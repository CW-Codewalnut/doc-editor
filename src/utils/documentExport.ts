import type { Editor } from "@tiptap/react";
import TurndownService from "turndown";
import documentContentCss from "../styles/documentContent.css?raw";

const FALLBACK_FILENAME = "document";

/**
 * Derives a readable, filesystem-safe base filename from the first non-empty
 * line of the document, falling back to a generic name for empty documents.
 */
function getDocumentBaseName(editor: Editor): string {
  let firstLine = "";

  editor.state.doc.descendants((node) => {
    if (firstLine) return false;
    if (node.isTextblock) {
      const text = node.textContent.trim();
      if (text) {
        firstLine = text;
        return false;
      }
    }
    return true;
  });

  const slug = firstLine
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  return slug || FALLBACK_FILENAME;
}

/** Triggers a client-side download of the given content, no server round-trip. */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Wraps editor HTML in a self-contained document with content styling applied. */
function buildStandaloneHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
body { margin: 0; padding: 48px; background: #fff; }
${documentContentCss}
</style>
</head>
<body>
<div class="tiptap">
${bodyHtml}
</div>
</body>
</html>
`;
}

/**
 * Exports the current document to PDF, reusing the live `.tiptap` element
 * directly so on-screen formatting and pagination are preserved. Rendering is
 * read-only and does not mutate the editor content.
 */
export async function exportToPdf(editor: Editor): Promise<void> {
  // Loaded on demand: html2pdf bundles html2canvas + jsPDF and would otherwise
  // dominate the initial bundle even though PDF export is rarely the first action.
  const { default: html2pdf } = await import("html2pdf.js");

  const liveContentElement = editor.view.dom as HTMLElement;
  const baseName = getDocumentBaseName(editor);

  // Use html2pdf's default page slicing (css + legacy). The `avoid-all` mode
  // repositions blocks to keep them whole, which on some layouts pushes the
  // first block onto page 2 and leaves a blank first page; plain slicing always
  // starts page 1 at the top of the content.
  await html2pdf()
    .set({
      filename: `${baseName}.pdf`,
      margin: [12, 12, 12, 12],
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "letter", orientation: "portrait" },
    })
    .from(liveContentElement)
    .save();
}

/** Exports the current document as a self-contained HTML file. */
export function exportToHtml(editor: Editor): void {
  const baseName = getDocumentBaseName(editor);
  const html = buildStandaloneHtml(baseName, editor.getHTML());
  triggerDownload(new Blob([html], { type: "text/html;charset=utf-8" }), `${baseName}.html`);
}

const turndownService = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});

/**
 * Exports the current document as Markdown. Editor-specific constructs
 * (colors, highlights, font sizes/families, alignment) are intentionally
 * dropped — Markdown export is lossy by design.
 */
export function exportToMarkdown(editor: Editor): void {
  const baseName = getDocumentBaseName(editor);
  const markdown = turndownService.turndown(editor.getHTML());
  triggerDownload(
    new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
    `${baseName}.md`
  );
}
