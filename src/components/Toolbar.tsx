import { useState, useCallback } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
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
  Download,
} from "lucide-react";
import ColorPicker from "./ColorPicker";
import LinkPopover from "./LinkPopover";
import ImagePopover from "./ImagePopover";
import ExportMenu from "./ExportMenu";

const FONT_FAMILIES = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Comic Sans MS",
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 24, 36, 48, 72];

const DEFAULT_FONT_FAMILY = "Arial";
const DEFAULT_FONT_SIZE = 11;
const DEFAULT_TEXT_COLOR = "#000000";
const DEFAULT_HIGHLIGHT_COLOR = "#FFFF00";
const DEFAULT_TEXT_ALIGN = "left";

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
  | "export"
  | null;

type HeadingLevel = 0 | 1 | 2 | 3 | 4;
type NonParagraphHeadingLevel = Exclude<HeadingLevel, 0>;

interface ToolbarProps {
  editor: Editor;
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

function isHeadingLevel(level: unknown): level is NonParagraphHeadingLevel {
  return (
    typeof level === "number" &&
    HEADING_OPTIONS.some((option) => option.level === level && level > 0)
  );
}

function getActiveHeadingLevel(editor: Editor): HeadingLevel {
  const { selection } = editor.state;

  if (selection.empty) {
    const parentNode = selection.$from.parent;
    return parentNode.type.name === "heading" &&
      isHeadingLevel(parentNode.attrs.level)
      ? parentNode.attrs.level
      : 0;
  }

  const selectedHeadingLevels = new Set<NonParagraphHeadingLevel>();
  let hasNonEmptyNonHeadingBlock = false;

  editor.state.doc.nodesBetween(selection.from, selection.to, (node) => {
    if (!node.isTextblock) return;

    if (node.type.name === "heading" && isHeadingLevel(node.attrs.level)) {
      selectedHeadingLevels.add(node.attrs.level);
      return;
    }

    if (node.textContent.trim()) {
      hasNonEmptyNonHeadingBlock = true;
    }
  });

  if (selectedHeadingLevels.size === 1 && !hasNonEmptyNonHeadingBlock) {
    return Array.from(selectedHeadingLevels)[0];
  }

  return 0;
}

function parseFontSize(fontSize: string | undefined): number {
  if (!fontSize) return DEFAULT_FONT_SIZE;

  const parsedFontSize = parseInt(fontSize, 10);
  return Number.isFinite(parsedFontSize) ? parsedFontSize : DEFAULT_FONT_SIZE;
}

function getCurrentTextAlign(editor: Editor): string {
  const paragraphAlign = editor.getAttributes("paragraph").textAlign as
    | string
    | undefined;
  const headingAlign = editor.getAttributes("heading").textAlign as
    | string
    | undefined;

  return headingAlign || paragraphAlign || DEFAULT_TEXT_ALIGN;
}

function getAdjacentFontSize(currentFontSize: number, direction: "up" | "down") {
  if (direction === "up") {
    return (
      FONT_SIZES.find((fontSize) => fontSize > currentFontSize) ??
      FONT_SIZES[FONT_SIZES.length - 1]
    );
  }

  for (let index = FONT_SIZES.length - 1; index >= 0; index--) {
    if (FONT_SIZES[index] < currentFontSize) {
      return FONT_SIZES[index];
    }
  }

  return FONT_SIZES[0];
}

function Toolbar({ editor }: ToolbarProps) {
  const [activePopover, setActivePopover] = useState<PopoverName>(null);
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      const activeHeadingLevel = getActiveHeadingLevel(currentEditor);
      const textStyleAttributes = currentEditor.getAttributes("textStyle");
      const currentTextAlign = getCurrentTextAlign(currentEditor);

      return {
        activeHeadingLevel,
        currentFontFamily:
          (textStyleAttributes.fontFamily as string | undefined) ||
          DEFAULT_FONT_FAMILY,
        currentFontSize: parseFontSize(
          textStyleAttributes.fontSize as string | undefined
        ),
        currentTextColor:
          (textStyleAttributes.color as string | undefined) ||
          DEFAULT_TEXT_COLOR,
        currentHighlightColor:
          (currentEditor.getAttributes("highlight").color as
            | string
            | undefined) || DEFAULT_HIGHLIGHT_COLOR,
        currentTextAlign,
        isBoldActive: currentEditor.isActive("bold"),
        isItalicActive: currentEditor.isActive("italic"),
        isUnderlineActive: currentEditor.isActive("underline"),
        isTextColorActive: Boolean(textStyleAttributes.color),
        isHighlightActive: currentEditor.isActive("highlight"),
        isBulletListActive: currentEditor.isActive("bulletList"),
        isOrderedListActive: currentEditor.isActive("orderedList"),
        isLinkActive: currentEditor.isActive("link"),
        canUndo: currentEditor.can().undo(),
        canRedo: currentEditor.can().redo(),
        canLiftListItem: currentEditor.can().liftListItem("listItem"),
        canSinkListItem: currentEditor.can().sinkListItem("listItem"),
      };
    },
  });
  const [fontSizeInput, setFontSizeInput] = useState<string | null>(null);

  const togglePopover = useCallback(
    (name: PopoverName) => {
      setActivePopover((current) => (current === name ? null : name));
    },
    []
  );

  const closePopover = useCallback(() => setActivePopover(null), []);

  const currentHeadingLabel =
    HEADING_OPTIONS.find(
      (option) => option.level === toolbarState.activeHeadingLevel
    )?.label || "Normal text";
  const displayedFontSizeInput =
    fontSizeInput ?? String(toolbarState.currentFontSize);

  const setFontSize = useCallback(
    (size: number) => {
      editor.chain().focus().setFontSize(`${size}pt`).run();
    },
    [editor]
  );

  const adjustFontSize = useCallback(
    (direction: "up" | "down") => {
      setFontSize(getAdjacentFontSize(toolbarState.currentFontSize, direction));
    },
    [setFontSize, toolbarState.currentFontSize]
  );

  const applyFontSizeInput = useCallback(() => {
    const value = parseInt(displayedFontSizeInput, 10);
    if (Number.isFinite(value) && value > 0 && value <= 400) {
      setFontSize(value);
      setFontSizeInput(null);
      return;
    }

    setFontSizeInput(null);
    editor.commands.focus();
  }, [displayedFontSizeInput, editor, setFontSize]);

  const handleFontSizeInput = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyFontSizeInput();
      }
      if (event.key === "Escape") {
        setFontSizeInput(null);
        editor.commands.focus();
      }
    },
    [applyFontSizeInput, editor]
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
          disabled={!toolbarState.canUndo}
        >
          <Undo2 size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!toolbarState.canRedo}
        >
          <Redo2 size={18} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Heading Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              togglePopover("heading");
            }}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-sm text-gray-700 cursor-pointer transition-colors"
            style={{ minWidth: 110 }}
          >
            <span className="truncate">{currentHeadingLabel}</span>
            <ChevronDown size={14} />
          </button>
          {activePopover === "heading" && (
            <div
              className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
              style={{ minWidth: 160 }}
            >
              {HEADING_OPTIONS.map((option) => (
                <button
                  key={option.level}
                  type="button"
                  className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 cursor-pointer transition-colors ${
                    toolbarState.activeHeadingLevel === option.level
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
                        .setHeading({
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
              style={{ fontFamily: toolbarState.currentFontFamily }}
            >
              {toolbarState.currentFontFamily}
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
                    toolbarState.currentFontFamily === font
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
            disabled={toolbarState.currentFontSize <= FONT_SIZES[0]}
          >
            <Minus size={14} />
          </ToolbarButton>
          <input
            type="text"
            title="Font size"
            inputMode="numeric"
            value={displayedFontSizeInput}
            onChange={(event) => setFontSizeInput(event.target.value)}
            onKeyDown={handleFontSizeInput}
            onBlur={applyFontSizeInput}
            onFocus={(event) => event.currentTarget.select()}
            className="w-8 text-center text-sm border border-gray-300 rounded py-0.5 focus:outline-none focus:border-blue-400"
          />
          <ToolbarButton
            title="Increase font size"
            onClick={() => adjustFontSize("up")}
            disabled={
              toolbarState.currentFontSize >= FONT_SIZES[FONT_SIZES.length - 1]
            }
          >
            <Plus size={14} />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* Bold / Italic / Underline */}
        <ToolbarButton
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={toolbarState.isBoldActive}
        >
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={toolbarState.isItalicActive}
        >
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={toolbarState.isUnderlineActive}
        >
          <Underline size={18} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Text Color */}
        <div className="relative">
          <ToolbarButton
            title="Text color"
            onClick={() => togglePopover("textColor")}
            isActive={toolbarState.isTextColorActive}
          >
            <div className="flex flex-col items-center">
              <Baseline size={18} />
              <div
                className="w-4 h-1 rounded-sm mt-px"
                style={{ backgroundColor: toolbarState.currentTextColor }}
              />
            </div>
          </ToolbarButton>
          {activePopover === "textColor" && (
            <ColorPicker
              currentColor={toolbarState.currentTextColor}
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
            isActive={toolbarState.isHighlightActive}
          >
            <div className="flex flex-col items-center">
              <Highlighter size={18} />
              <div
                className="w-4 h-1 rounded-sm mt-px"
                style={{ backgroundColor: toolbarState.currentHighlightColor }}
              />
            </div>
          </ToolbarButton>
          {activePopover === "highlightColor" && (
            <ColorPicker
              currentColor={toolbarState.currentHighlightColor}
              onSelectColor={(color) =>
                editor.chain().focus().setHighlight({ color }).run()
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
          isActive={toolbarState.currentTextAlign === "left"}
        >
          <AlignLeft size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Align center"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={toolbarState.currentTextAlign === "center"}
        >
          <AlignCenter size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Align right"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={toolbarState.currentTextAlign === "right"}
        >
          <AlignRight size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Justify"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={toolbarState.currentTextAlign === "justify"}
        >
          <AlignJustify size={18} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Bulleted List / Numbered List */}
        <ToolbarButton
          title="Bulleted list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={toolbarState.isBulletListActive}
        >
          <List size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={toolbarState.isOrderedListActive}
        >
          <ListOrdered size={18} />
        </ToolbarButton>

        {/* Indent / Outdent */}
        <ToolbarButton
          title="Decrease indent"
          onClick={() => editor.chain().focus().liftListItem("listItem").run()}
          disabled={!toolbarState.canLiftListItem}
        >
          <Outdent size={18} />
        </ToolbarButton>
        <ToolbarButton
          title="Increase indent"
          onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
          disabled={!toolbarState.canSinkListItem}
        >
          <Indent size={18} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Insert Link */}
        <div className="relative">
          <ToolbarButton
            title="Insert link"
            onClick={() => togglePopover("link")}
            isActive={toolbarState.isLinkActive}
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
          >
            <ImageIcon size={18} />
          </ToolbarButton>
          {activePopover === "image" && (
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
        >
          <MinusIcon size={18} />
        </ToolbarButton>

        {/* Export */}
        <div className="relative ml-auto">
          <ToolbarButton
            title="Export document"
            onClick={() => togglePopover("export")}
            isActive={activePopover === "export"}
          >
            <Download size={18} />
          </ToolbarButton>
          {activePopover === "export" && (
            <ExportMenu
              editor={editor}
              onClose={closePopover}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default Toolbar;
