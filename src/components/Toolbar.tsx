import { useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Baseline,
  Highlighter,
  Minus,
  Plus,
  ChevronDown,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Link,
  ImageIcon,
  MinusIcon,
  PanelTop,
} from "lucide-react";
import ColorPicker from "./ColorPicker";
import LinkPopover from "./LinkPopover";
import ImagePopover from "./ImagePopover";

const FONT_FAMILIES = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Comic Sans MS",
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 24, 36, 48, 72];

const HEADING_OPTIONS = [
  { label: "Normal text", level: 0 },
  { label: "Heading 1", level: 1 },
  { label: "Heading 2", level: 2 },
  { label: "Heading 3", level: 3 },
  { label: "Heading 4", level: 4 },
] as const;

type PopoverName =
  | "heading"
  | "font"
  | "textColor"
  | "highlightColor"
  | "link"
  | "image"
  | null;

interface ToolbarProps {
  editor: Editor;
  isHeaderVisible: boolean;
  onToggleHeader: () => void;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className={`p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors ${
        isActive ? "bg-blue-100 text-blue-700" : "text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-300 mx-1" />;
}

function Toolbar({ editor, isHeaderVisible, onToggleHeader }: ToolbarProps) {
  const [activePopover, setActivePopover] = useState<PopoverName>(null);

  // Check which node types are available in the active editor's schema
  const hasHeading = !!editor.schema.nodes.heading;
  const hasListItem = !!editor.schema.nodes.listItem;
  const hasBulletList = !!editor.schema.nodes.bulletList;
  const hasOrderedList = !!editor.schema.nodes.orderedList;
  const hasHorizontalRule = !!editor.schema.nodes.horizontalRule;
  const hasImage = !!editor.schema.nodes.image;

  const togglePopover = useCallback(
    (name: PopoverName) => {
      setActivePopover((current) => (current === name ? null : name));
    },
    []
  );

  const closePopover = useCallback(() => setActivePopover(null), []);

  const currentFontFamily =
    (editor.getAttributes("textStyle").fontFamily as string) || "Arial";
  const currentFontSizeRaw =
    (editor.getAttributes("textStyle").fontSize as string) || "11pt";
  const currentFontSize = parseInt(currentFontSizeRaw, 10);
  const currentTextColor =
    (editor.getAttributes("textStyle").color as string) || "#000000";
  const currentHighlightColor =
    (editor.getAttributes("highlight").color as string) || "#FFFF00";

  const activeHeading = HEADING_OPTIONS.find(
    (option) =>
      option.level > 0 && editor.isActive("heading", { level: option.level })
  );
  const currentHeadingLabel = activeHeading?.label || "Normal text";

  const setFontSize = useCallback(
    (size: number) => {
      editor.chain().focus().setFontSize(`${size}pt`).run();
    },
    [editor]
  );

  const adjustFontSize = useCallback(
    (direction: "up" | "down") => {
      const currentIndex = FONT_SIZES.indexOf(currentFontSize);
      if (direction === "up") {
        const nextSize =
          currentIndex === -1 || currentIndex >= FONT_SIZES.length - 1
            ? FONT_SIZES[FONT_SIZES.length - 1]
            : FONT_SIZES[currentIndex + 1];
        setFontSize(nextSize);
      } else {
        const prevSize =
          currentIndex === -1 || currentIndex <= 0
            ? FONT_SIZES[0]
            : FONT_SIZES[currentIndex - 1];
        setFontSize(prevSize);
      }
    },
    [currentFontSize, setFontSize]
  );

  const handleFontSizeInput = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        const value = parseInt(event.currentTarget.value, 10);
        if (value > 0 && value <= 400) {
          setFontSize(value);
        }
        editor.commands.focus();
      }
    },
    [editor, setFontSize]
  );

  return (
    <>
      {/* Backdrop overlay to close popovers when clicking outside */}
      {activePopover !== null && (
        <div
          className="fixed inset-0 z-30"
          onMouseDown={(event) => {
            event.preventDefault();
            closePopover();
          }}
        />
      )}

      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 flex items-center gap-0.5 px-4 py-1.5 flex-wrap">
        {/* Undo / Redo */}
        <ToolbarButton
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 size={18} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Heading Dropdown */}
        <div className="relative">
          <button
            type="button"
            disabled={!hasHeading}
            onMouseDown={(event) => {
              event.preventDefault();
              if (hasHeading) togglePopover("heading");
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-sm cursor-pointer transition-colors ${!hasHeading ? "opacity-40 cursor-not-allowed" : "text-gray-700"}`}
            style={{ minWidth: 110 }}
          >
            <span className="truncate">{currentHeadingLabel}</span>
            <ChevronDown size={14} />
          </button>
          {activePopover === "heading" && hasHeading && (
            <div
              className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
              style={{ minWidth: 160 }}
            >
              {HEADING_OPTIONS.map((option) => (
                <button
                  key={option.level}
                  type="button"
                  className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 cursor-pointer transition-colors ${
                    currentHeadingLabel === option.label
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700"
                  }`}
                  style={{
                    fontSize:
                      option.level === 0
                        ? 14
                        : option.level === 1
                          ? 22
                          : option.level === 2
                            ? 18
                            : option.level === 3
                              ? 15
                              : 13,
                    fontWeight: option.level > 0 ? 700 : 400,
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    if (option.level === 0) {
                      editor.chain().focus().setParagraph().run();
                    } else {
                      editor
                        .chain()
                        .focus()
                        .toggleHeading({
                          level: option.level as 1 | 2 | 3 | 4,
                        })
                        .run();
                    }
                    closePopover();
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* Font Family Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              togglePopover("font");
            }}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-sm text-gray-700 cursor-pointer transition-colors"
            style={{ minWidth: 120 }}
          >
            <span
              className="truncate"
              style={{ fontFamily: currentFontFamily }}
            >
              {currentFontFamily}
            </span>
            <ChevronDown size={14} />
          </button>
          {activePopover === "font" && (
            <div
              className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
              style={{ minWidth: 180 }}
            >
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font}
                  type="button"
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 cursor-pointer transition-colors ${
                    currentFontFamily === font
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700"
                  }`}
                  style={{ fontFamily: font }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    editor.chain().focus().setFontFamily(font).run();
                    closePopover();
                  }}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* Font Size */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            title="Decrease font size"
            onClick={() => adjustFontSize("down")}
            disabled={currentFontSize <= FONT_SIZES[0]}
          >
            <Minus size={14} />
          </ToolbarButton>
          <input
            type="text"
            value={currentFontSize}
            onKeyDown={handleFontSizeInput}
            onChange={() => {}}
            className="w-8 text-center text-sm border border-gray-300 rounded py-0.5 focus:outline-none focus:border-blue-400"
          />
          <ToolbarButton
            title="Increase font size"
            onClick={() => adjustFontSize("up")}
            disabled={currentFontSize >= FONT_SIZES[FONT_SIZES.length - 1]}
          >
            <Plus size={14} />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* Bold / Italic / Underline */}
        <ToolbarButton
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
        >
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
        >
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
        >
          <Underline size={18} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Text Color */}
        <div className="relative">
          <ToolbarButton
            title="Text color"
            onClick={() => togglePopover("textColor")}
          >
            <div className="flex flex-col items-center">
              <Baseline size={18} />
              <div
                className="w-4 h-1 rounded-sm mt-px"
                style={{ backgroundColor: currentTextColor }}
              />
            </div>
          </ToolbarButton>
          {activePopover === "textColor" && (
            <ColorPicker
              currentColor={currentTextColor}
              onSelectColor={(color) =>
                editor.chain().focus().setColor(color).run()
              }
              onClose={closePopover}
            />
          )}
        </div>

        {/* Highlight Color */}
        <div className="relative">
          <ToolbarButton
            title="Highlight color"
            onClick={() => togglePopover("highlightColor")}
          >
            <div className="flex flex-col items-center">
              <Highlighter size={18} />
              <div
                className="w-4 h-1 rounded-sm mt-px"
                style={{ backgroundColor: currentHighlightColor }}
              />
            </div>
          </ToolbarButton>
          {activePopover === "highlightColor" && (
            <ColorPicker
              currentColor={currentHighlightColor}
              onSelectColor={(color) =>
                editor.chain().focus().toggleHighlight({ color }).run()
              }
              onClose={closePopover}
            />
          )}
        </div>

        <ToolbarDivider />

        {/* Text Alignment */}
        <ToolbarButton
          title="Align left"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
        >
          <AlignLeft size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Align center"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
        >
          <AlignCenter size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Align right"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
        >
          <AlignRight size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Justify"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
        >
          <AlignJustify size={18} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Bulleted List / Numbered List */}
        <ToolbarButton
          title="Bulleted list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={hasBulletList && editor.isActive("bulletList")}
          disabled={!hasBulletList}
        >
          <List size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={hasOrderedList && editor.isActive("orderedList")}
          disabled={!hasOrderedList}
        >
          <ListOrdered size={18} />
        </ToolbarButton>

        {/* Indent / Outdent */}
        <ToolbarButton
          title="Decrease indent"
          onClick={() => editor.chain().focus().liftListItem("listItem").run()}
          disabled={!hasListItem || !editor.can().liftListItem("listItem")}
        >
          <Outdent size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Increase indent"
          onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
          disabled={!hasListItem || !editor.can().sinkListItem("listItem")}
        >
          <Indent size={18} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Insert Link */}
        <div className="relative">
          <ToolbarButton
            title="Insert link"
            onClick={() => togglePopover("link")}
            isActive={editor.isActive("link")}
          >
            <Link size={18} />
          </ToolbarButton>
          {activePopover === "link" && (
            <LinkPopover
              editor={editor}
              onClose={closePopover}
            />
          )}
        </div>

        {/* Insert Image */}
        <div className="relative">
          <ToolbarButton
            title="Insert image"
            onClick={() => togglePopover("image")}
            disabled={!hasImage}
          >
            <ImageIcon size={18} />
          </ToolbarButton>
          {activePopover === "image" && hasImage && (
            <ImagePopover
              editor={editor}
              onClose={closePopover}
            />
          )}
        </div>

        {/* Horizontal Rule */}
        <ToolbarButton
          title="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={!hasHorizontalRule}
        >
          <MinusIcon size={18} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Toggle Document Header */}
        <ToolbarButton
          title={isHeaderVisible ? "Hide header" : "Show header"}
          onClick={onToggleHeader}
          isActive={isHeaderVisible}
        >
          <PanelTop size={18} />
        </ToolbarButton>
      </div>
    </>
  );
}

export default Toolbar;
