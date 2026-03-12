# Doc Editor

A Google Docs-inspired rich text editor built with React, TipTap, and Tailwind CSS. Features a comprehensive formatting toolbar, visual pagination with dynamic page breaks, and a clean document-centric layout.

## Features

### Text Formatting
- **Bold, Italic, Underline** — Standard text formatting toggles with keyboard shortcut support
- **Text Color** — Choose from 20 preset color swatches via a popover color picker to change the font color
- **Highlight Color** — Apply background highlighting with 20 preset colors, similar to a marker pen effect

### Headings
- **Normal Text** — Default paragraph style
- **Heading 1–4** — Four heading levels with progressively smaller sizes, selectable from a dropdown

### Font Controls
- **Font Family** — Choose from 6 fonts: Arial, Times New Roman, Courier New, Georgia, Verdana, and Comic Sans MS
- **Font Size** — 12 preset sizes ranging from 8pt to 72pt, plus manual input for custom sizes (1–400pt)
- **Increase/Decrease Size** — Quick buttons to step through the preset size list

### Text Alignment
- **Left Align** — Default left-aligned text
- **Center Align** — Center text within the page
- **Right Align** — Right-align text
- **Justify** — Full justification across the page width

### Lists
- **Bullet List** — Unordered lists with disc, circle, and square styles for nested levels
- **Numbered List** — Ordered lists with decimal numbering
- **Indent/Outdent** — Increase or decrease list nesting level

### Media and Links
- **Link Insertion** — Add hyperlinks via a popover with URL input; supports editing and removing existing links
- **Image Insertion** — Insert images via file upload (converted to data URL) or by entering an external URL, with a live preview before inserting
- **Horizontal Rule** — Insert a visual separator line between content sections

### History
- **Undo/Redo** — Full undo and redo support with disabled states when history is empty

### Visual Pagination
- **Dynamic Page Breaks** — Content is visually divided into pages (816 x 1056px, matching US Letter proportions) with automatic page counting
- **Page Gap Overlays** — Gray gaps between pages with rounded corners and paper-like shadow on each page section
- **Page Numbers** — "Page N of M" displayed right-aligned in each page footer in small gray Roboto text
- **Responsive Page Count** — Pages are recalculated in real-time as content grows or shrinks using a ResizeObserver
- **Block-Level Margin Adjustment** — Paragraphs and headings that straddle a page boundary are automatically pushed to the next page so they are not hidden behind page break overlays

### Toolbar
- **Fixed Positioning** — The toolbar stays pinned at the top of the viewport while scrolling
- **Active State Indicators** — Buttons reflect the current formatting at the cursor position (e.g., bold button highlighted when cursor is on bold text)
- **Grouped Controls** — Related tools are grouped together and separated by thin vertical dividers
- **Popover Menus** — Dropdowns and color pickers open as popovers with a backdrop overlay that closes them on outside click

## Tech Stack

- **React 19** with TypeScript
- **TipTap 3** — headless rich text editor framework
- **Tailwind CSS 4** — utility-first styling
- **Vite 7** — build tooling
- **Lucide React** — toolbar icons

## Getting Started

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Lint
bun run lint
```

## Project Structure

```
src/
├── components/
│   ├── Editor.tsx        # TipTap editor setup and extension configuration
│   ├── Toolbar.tsx       # Formatting toolbar with dropdowns, popovers, and active states
│   ├── PageView.tsx      # Visual pagination with page break overlays and dynamic page counting
│   ├── ColorPicker.tsx   # 20-swatch color picker popover for text and highlight colors
│   ├── LinkPopover.tsx   # Link insertion/editing popover with URL input
│   └── ImagePopover.tsx  # Image insertion via file upload or URL with preview
├── App.tsx               # Root layout with centered document view
├── main.tsx              # Application entry point
└── index.css             # Tailwind imports and TipTap editor styles
```
