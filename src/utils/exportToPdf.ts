import html2pdf from "html2pdf.js";

export function exportToPdf(): void {
  const tiptapElement = document.querySelector(".tiptap") as HTMLElement | null;
  if (!tiptapElement) return;

  html2pdf()
    .set({
      margin: [72, 72, 72, 72],
      filename: "document.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "pt", format: "letter", orientation: "portrait" },
    })
    .from(tiptapElement)
    .save();
}
