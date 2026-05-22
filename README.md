# Doc Editor

Doc Editor is a lightweight, Google Docs-style editor built with React, TypeScript, TipTap, Tailwind CSS, and Vite. It gives you a clean writing surface, a familiar formatting toolbar, and visual pages that feel closer to a real document than a plain text box.

Use it as a starting point for document editing workflows, internal writing tools, rich text experiments, or anything that needs a polished browser-based editor.

## What it can do

- Format text with bold, italic, underline, headings, fonts, sizes, colors, and highlights.
- Align text left, center, right, or justified.
- Create bullet and numbered lists with indent and outdent controls.
- Add links, images, and horizontal rules.
- Undo and redo changes from the toolbar.
- Show content inside US Letter-style pages with page gaps, shadows, footers, and live page counts.
- Keep the toolbar fixed at the top so formatting tools stay within reach while you write.

## Why this project exists

Most browser editors either feel too bare or too heavy. Doc Editor aims for the middle: a simple document editor with the parts people expect from Google Docs, but small enough to understand, customize, and extend.

The code is organized around clear responsibilities:

- `Editor.tsx` sets up TipTap and the editor extensions.
- `Toolbar.tsx` handles formatting controls and active states.
- `PageView.tsx` renders the paper-like page layout and page breaks.
- Popover components handle links, images, and color selection.

## Tech stack

- React 19
- TypeScript
- TipTap 3 / ProseMirror
- Tailwind CSS 4
- Vite 7
- Lucide React
- Bun

## Getting started

Install dependencies:

```bash
bun install
```

Start the development server:

```bash
bun run dev
```

Build for production:

```bash
bun run build
```

Preview the production build:

```bash
bun run preview
```

Run lint checks:

```bash
bun run lint
```

## Project structure

```text
src/
├── components/
│   ├── Editor.tsx        # TipTap setup and editor composition
│   ├── Toolbar.tsx       # Formatting toolbar and popovers
│   ├── PageView.tsx      # Page frame, page breaks, and page count
│   ├── ColorPicker.tsx   # Text and highlight color picker
│   ├── LinkPopover.tsx   # Link editing popover
│   └── ImagePopover.tsx  # Image upload and URL insertion
├── App.tsx               # App shell
├── main.tsx              # React entry point
└── index.css             # Tailwind import and editor-specific styles
```

## Notes for contributors

Keep the editor simple and document-focused. TipTap should remain the source of truth for formatting and content state. When adding UI, prefer small components, accessible controls, and predictable behavior over clever abstractions.
