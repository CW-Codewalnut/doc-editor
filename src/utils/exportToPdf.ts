import type { Editor } from "@tiptap/react";
import html2pdf from "html2pdf.js";

const EDITOR_STYLES = `
  .pdf-export-container {
    font-family: Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #000;
  }
  .pdf-export-container ul {
    list-style-type: disc;
    padding-left: 1.5em;
    margin: 0.5em 0;
  }
  .pdf-export-container ol {
    list-style-type: decimal;
    padding-left: 1.5em;
    margin: 0.5em 0;
  }
  .pdf-export-container ul ul {
    list-style-type: circle;
  }
  .pdf-export-container ul ul ul {
    list-style-type: square;
  }
  .pdf-export-container li {
    margin: 0.2em 0;
  }
  .pdf-export-container a {
    color: #1a73e8;
    text-decoration: underline;
  }
  .pdf-export-container img {
    max-width: 100%;
    height: auto;
  }
  .pdf-export-container hr {
    border: none;
    border-top: 1px solid #dadce0;
    margin: 1em 0;
  }
`;

export function exportToPdf(editor: Editor): void {
  const editorHtml = editor.getHTML();

  const wrapper = document.createElement("div");

  const styleElement = document.createElement("style");
  styleElement.textContent = EDITOR_STYLES;
  wrapper.appendChild(styleElement);

  const content = document.createElement("div");
  content.className = "pdf-export-container";
  content.innerHTML = editorHtml;
  wrapper.appendChild(content);

  const options = {
    margin: [0.5, 1, 0.5, 1] as [number, number, number, number],
    filename: "document.pdf",
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" as const },
  };

  html2pdf().set(options).from(wrapper).save();
}
