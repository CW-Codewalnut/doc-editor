import type { Editor } from "@tiptap/react";
import html2pdf from "html2pdf.js";

export function exportToPdf(editor: Editor) {
  const htmlContent = editor.getHTML();

  const container = document.createElement("div");
  container.innerHTML = htmlContent;
  container.style.padding = "40px";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.fontSize = "11pt";
  container.style.lineHeight = "1.5";
  container.style.color = "#000";

  html2pdf()
    .set({
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: "document.pdf",
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    })
    .from(container)
    .save();
}
