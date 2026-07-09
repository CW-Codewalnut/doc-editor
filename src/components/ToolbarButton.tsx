import type { ReactNode } from "react";

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      // Preserve editor focus/selection on mouse press, but activate on click so
      // keyboard users (Enter/Space fire a click on a focused button) can use it.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors ${
        isActive ? "bg-blue-100 text-blue-700" : "text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

export default ToolbarButton;
