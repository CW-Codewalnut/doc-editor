import type { Editor } from "@tiptap/react";
import TurndownService from "turndown";
import documentContentCss from "../styles/documentContent.css?raw";

const FALLBACK_FILENAME = "document";
const FILENAME_MAX_LENGTH = 50;

// Matches the on-screen editor text column: PAGE_WIDTH (816) minus the left and
// right page padding (96 each) defined in PageView. Rendering the PDF at this
// width keeps exported line breaks identical to what the user sees.
const PDF_CONTENT_WIDTH = 624;
const PDF_MARGIN_MM = 12;
const PDF_IMAGE_QUALITY = 0.98;
const PDF_RENDER_SCALE = 2;
const PDF_BACKGROUND = "#ffffff";

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
    .slice(0, FILENAME_MAX_LENGTH);

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
 * Exports the current document to PDF. Rendering reads a sanitized copy of the
 * document HTML rather than the live editor DOM, so editor-only artifacts (the
 * empty-state placeholder, page-break spacer margins, contentEditable
 * decorations) never leak into the file. The copy is pinned to the on-screen
 * text-column width so line breaks and wrapping match what the user sees.
 *
 * Rejects if html2pdf fails (e.g. a remote image blocks the canvas via CORS) so
 * callers can surface the failure; the live editor content is never mutated.
 */
export async function exportToPdf(editor: Editor): Promise<void> {
  // Loaded on demand: html2pdf bundles html2canvas + jsPDF and would otherwise
  // dominate the initial bundle even though PDF export is rarely the first action.
  const { default: html2pdf } = await import("html2pdf.js");

  const baseName = getDocumentBaseName(editor);

  // The wrapper carries the off-screen positioning. html2pdf deep-clones the
  // node it is given (renderRoot) into its own on-screen capture container, so
  // any off-screen styles on that node would move the clone out of view and
  // render blank pages. Keeping positioning on the wrapper avoids that while
  // still hiding the render root from the user.
  const offscreenWrapper = document.createElement("div");
  offscreenWrapper.style.position = "fixed";
  offscreenWrapper.style.left = "-9999px";
  offscreenWrapper.style.top = "0";

  // Render root inherits .tiptap content styling from the global stylesheet.
  const renderRoot = document.createElement("div");
  renderRoot.className = "tiptap";
  renderRoot.style.width = `${PDF_CONTENT_WIDTH}px`;
  renderRoot.style.background = PDF_BACKGROUND;
  renderRoot.innerHTML = editor.getHTML();

  offscreenWrapper.appendChild(renderRoot);
  document.body.appendChild(offscreenWrapper);

  try {
    // Use html2pdf's default page slicing (css + legacy). The `avoid-all` mode
    // repositions blocks to keep them whole, which on some layouts pushes the
    // first block onto page 2 and leaves a blank first page; plain slicing always
    // starts page 1 at the top of the content.
    await html2pdf()
      .set({
        filename: `${baseName}.pdf`,
        margin: [PDF_MARGIN_MM, PDF_MARGIN_MM, PDF_MARGIN_MM, PDF_MARGIN_MM],
        image: { type: "jpeg", quality: PDF_IMAGE_QUALITY },
        html2canvas: {
          scale: PDF_RENDER_SCALE,
          useCORS: true,
          backgroundColor: PDF_BACKGROUND,
        },
        jsPDF: { unit: "mm", format: "letter", orientation: "portrait" },
      })
      .from(renderRoot)
      .save();
  } finally {
    offscreenWrapper.remove();
  }
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

// Uploaded images are stored as inline `data:` URLs. Embedding them verbatim
// would write multi-megabyte base64 blobs into the Markdown (and duplicate them
// in memory while converting), so they are replaced with a short placeholder —
// consistent with Markdown export being lossy by design.
turndownService.addRule("dataUriImage", {
  filter: (node) =>
    node.nodeName === "IMG" &&
    (node.getAttribute("src") || "").startsWith("data:"),
  replacement: (_content, node) => {
    const altText = (node as HTMLElement).getAttribute("alt")?.trim();
    const label = altText ? `embedded image "${altText}"` : "embedded image";
    return `*(${label} omitted from Markdown export)*`;
  },
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

export interface ExportFormatDescriptor {
  id: "pdf" | "html" | "markdown";
  label: string;
  /** Runs the export. PDF is async; HTML and Markdown are synchronous. */
  run: (editor: Editor) => void | Promise<void>;
}

/**
 * Single source of truth for the available export formats. The toolbar menu and
 * any future entry points read labels and handlers from here so format ids,
 * labels, and behavior cannot drift apart.
 */
export const EXPORT_FORMATS: ExportFormatDescriptor[] = [
  { id: "pdf", label: "PDF (.pdf)", run: exportToPdf },
  { id: "html", label: "HTML (.html)", run: exportToHtml },
  { id: "markdown", label: "Markdown (.md)", run: exportToMarkdown },
];
