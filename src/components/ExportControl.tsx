import type { Editor } from "@tiptap/react";
import { Download } from "lucide-react";
import ToolbarButton from "./ToolbarButton";
import ExportMenu from "./ExportMenu";

interface ExportControlProps {
  editor: Editor;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

/**
 * Self-contained toolbar control for document export: the trigger button plus
 * its anchored export menu. Keeps the toolbar's export feature in one focused
 * component instead of inline JSX in the toolbar. Open/close state stays owned
 * by the toolbar so it participates in the shared outside-click backdrop.
 */
function ExportControl({ editor, isOpen, onToggle, onClose }: ExportControlProps) {
  return (
    <div className="relative ml-auto">
      <ToolbarButton
        title="Export document"
        onClick={onToggle}
        isActive={isOpen}
      >
        <Download size={18} />
      </ToolbarButton>
      {isOpen && (
        <ExportMenu
          editor={editor}
          onClose={onClose}
        />
      )}
    </div>
  );
}

export default ExportControl;
