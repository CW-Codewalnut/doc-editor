import { useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { FileText, Code2, Hash } from "lucide-react";
import {
  exportToPdf,
  exportToHtml,
  exportToMarkdown,
} from "../utils/documentExport";

interface ExportMenuProps {
  editor: Editor;
  onClose: () => void;
}

const EXPORT_OPTIONS = [
  { format: "pdf", label: "PDF (.pdf)", icon: FileText },
  { format: "html", label: "HTML (.html)", icon: Code2 },
  { format: "markdown", label: "Markdown (.md)", icon: Hash },
] as const;

type ExportFormat = (typeof EXPORT_OPTIONS)[number]["format"];

function ExportMenu({ editor, onClose }: ExportMenuProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const runExport = (format: ExportFormat) => {
    // Close first so the menu never appears in a PDF capture of the page.
    onClose();
    if (format === "html") {
      exportToHtml(editor);
    } else if (format === "markdown") {
      exportToMarkdown(editor);
    } else {
      void exportToPdf(editor);
    }
  };

  return (
    <div
      className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
      style={{ minWidth: 170 }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {EXPORT_OPTIONS.map(({ format, label, icon: Icon }) => (
        <button
          key={format}
          type="button"
          className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
          onMouseDown={(event) => {
            event.preventDefault();
            runExport(format);
          }}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  );
}

export default ExportMenu;
