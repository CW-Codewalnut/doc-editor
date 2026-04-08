const PRINT_STYLES = `
  @page {
    size: letter;
    margin: 0.75in 1in;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .document-header {
    font-size: 9pt;
    line-height: 1.4;
    color: #555;
    background-color: #f8f9fc;
    border-radius: 2px;
    padding: 8px 12px;
    margin-bottom: 8px;
    border-bottom: 1px solid #d1d5db;
  }

  p { margin: 0; }

  ul {
    list-style-type: disc;
    padding-left: 1.5em;
    margin: 0.5em 0;
  }

  ol {
    list-style-type: decimal;
    padding-left: 1.5em;
    margin: 0.5em 0;
  }

  ul ul { list-style-type: circle; }
  ul ul ul { list-style-type: square; }

  li { margin: 0.2em 0; }

  a {
    color: #1a73e8;
    text-decoration: underline;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  hr {
    border: none;
    border-top: 1px solid #dadce0;
    margin: 1em 0;
  }

  h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
  h2 { font-size: 1.5em; font-weight: bold; margin: 0.75em 0; }
  h3 { font-size: 1.17em; font-weight: bold; margin: 0.83em 0; }
  h4 { font-size: 1em; font-weight: bold; margin: 1em 0; }

  code {
    background-color: #f3f4f6;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }

  pre {
    background-color: #1e1e1e;
    color: #d4d4d4;
    padding: 1em;
    border-radius: 4px;
    overflow-x: auto;
    margin: 0.5em 0;
  }

  pre code {
    background: none;
    padding: 0;
  }

  blockquote {
    border-left: 3px solid #d1d5db;
    padding-left: 1em;
    margin: 0.5em 0;
    color: #6b7280;
  }
`;

interface ExportToPdfOptions {
  bodyHtml: string;
  headerHtml?: string;
  showHeader?: boolean;
}

export function exportToPdf({
  bodyHtml,
  headerHtml,
  showHeader,
}: ExportToPdfOptions): void {
  const headerSection =
    showHeader && headerHtml
      ? `<div class="document-header">${headerHtml}</div>`
      : "";

  const htmlDocument = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Document</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>
        ${headerSection}
        ${bodyHtml}
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(htmlDocument);
  printWindow.document.close();

  // Use requestAnimationFrame to ensure the document is rendered before printing.
  // Do not auto-close the window — the user may cancel the print dialog.
  printWindow.requestAnimationFrame(() => {
    printWindow.print();
  });
}
