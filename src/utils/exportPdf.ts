import html2pdf from "html2pdf.js";

export function exportToPdf(): void {
  const element = document.querySelector(".tiptap") as HTMLElement | null;
  if (!element) return;

  html2pdf()
    .set({
      margin: [0.5, 1, 0.5, 1],
      filename: "document.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    })
    .from(element)
    .save();
}
