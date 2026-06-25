import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import type { Editor } from "@tiptap/react";
import { FileText, Code2, Hash } from "lucide-react";
import {
  EXPORT_FORMATS,
  type ExportFormatDescriptor,
} from "../utils/documentExport";

interface ExportMenuProps {
  editor: Editor;
  onClose: () => void;
}

const MENU_MIN_WIDTH = 170;

const FORMAT_ICONS: Record<
  ExportFormatDescriptor["id"],
  ComponentType<{ size?: number }>
> = {
  pdf: FileText,
  html: Code2,
  markdown: Hash,
};

function ExportMenu({ editor, onClose }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const runExport = (format: ExportFormatDescriptor) => {
    // Guard against a second export starting while a heavy PDF run is in flight.
    if (isExporting) return;

    const result = format.run(editor);
    if (!(result instanceof Promise)) {
      onClose();
      return;
    }

    setIsExporting(true);
    result
      .catch(() => {
        window.alert(
          `Could not export as ${format.label}. Remote images may have blocked the export — try again or remove external images.`
        );
      })
      .finally(() => {
        setIsExporting(false);
        onClose();
      });
  };

  return (
    <div
      className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
      style={{ minWidth: MENU_MIN_WIDTH }}
      onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
    >
      {EXPORT_FORMATS.map((format) => {
        const Icon = FORMAT_ICONS[format.id];
        return (
          <button
            key={format.id}
            type="button"
            disabled={isExporting}
            className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            // Keep editor focus on mouse press; activate on click so Enter/Space
            // (which fire a click on a focused button) also trigger the export.
            onMouseDown={(mouseEvent) => mouseEvent.preventDefault()}
            onClick={() => runExport(format)}
          >
            <Icon size={16} />
            {format.label}
          </button>
        );
      })}
    </div>
  );
}

export default ExportMenu;
