# Coding Conventions & Project Guidelines

## Project Overview

Doc Editor is a Google Docs-inspired rich text editor built with React, TypeScript, TipTap, Tailwind CSS, and Vite. The product goal is a lightweight, document-centric editing experience with familiar formatting controls, predictable page visuals, and a clean writing surface.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Editor Engine**: TipTap 3 / ProseMirror
- **Styling**: Tailwind CSS 4 with small targeted editor CSS in `src/index.css`
- **Icons**: Lucide React
- **Package Manager / Runner**: Bun
- **Linting**: ESLint with TypeScript, React Hooks, and React Refresh rules

## Project Structure

- `src/App.tsx` — root layout and application shell
- `src/main.tsx` — React entry point
- `src/index.css` — Tailwind import plus TipTap content styling
- `src/components/Editor.tsx` — TipTap editor creation, extensions, and editor composition
- `src/components/Toolbar.tsx` — formatting toolbar, grouped controls, dropdowns, and active states
- `src/components/PageView.tsx` — document page frame, page break overlays, and page count calculation
- `src/components/ColorPicker.tsx` — reusable color palette popover
- `src/components/LinkPopover.tsx` — link insertion/editing while preserving editor selection
- `src/components/ImagePopover.tsx` — image upload/URL insertion UI
- `docs/architecture.excalidraw` — architecture/design diagram
- `.claude/skills`, `.agent/skills`, `.agents/skills` — local agent skills used for PR docs and Excalidraw diagrams

## Architecture & Design Principles

- **Document-first UX** — prioritize writing and formatting over app chrome. The page surface should feel stable, familiar, and close to a real document editor.
- **TipTap as the source of editor truth** — formatting state should come from TipTap commands, attributes, and `editor.isActive(...)`; avoid duplicating editor state in React unless it is only UI state.
- **Clear component boundaries** — keep editor setup in `Editor`, toolbar interactions in `Toolbar`, pagination in `PageView`, and focused popover behavior inside each popover component.
- **Small, composable UI pieces** — add reusable components/helpers when behavior appears in more than one place, but do not introduce broad abstractions before they are needed.
- **Predictable pagination** — page calculations should be deterministic and tied to measured editor content. Avoid changes that make page breaks jump unexpectedly while typing.
- **Preserve editor selection** — popovers and inputs can steal focus; save and restore the TipTap selection before applying links, images, or formatting that depends on the current range.
- **Browser-native where practical** — use standard DOM APIs such as `ResizeObserver`, `FileReader`, and CSS layout before introducing heavier dependencies.
- **Performance-aware editing** — avoid expensive work on every keystroke. Keep measurements scoped, memoize callbacks where useful, and prevent resize/update feedback loops.
- **Accessible interactions** — controls should use real buttons/inputs, meaningful `title` text, keyboard support for Enter/Escape where relevant, visible disabled states, and clear focus behavior.
- **Security-conscious content handling** — treat user-entered URLs and uploaded image data carefully. Do not add unsafe HTML injection paths; prefer TipTap commands and sanitized editor APIs.
- **KISS / YAGNI / DRY** — keep solutions simple, avoid speculative features, and extract shared logic only when it removes real duplication.
- **Single Responsibility Principle** — every function, component, and module should have one clear reason to change.

## UI & Product Guidelines

- Keep the editor visually close to common document tools: white page, subtle shadow, gray app background, compact fixed toolbar, grouped controls, and blue active-state indicators.
- Maintain US Letter-style page proportions unless there is a clear product requirement to support other formats.
- Page headers, footers, gaps, page numbers, and content padding should stay visually consistent across page count changes.
- Toolbar controls should not blur or lose the user's editing position unnecessarily; prefer `onMouseDown` with `preventDefault()` for toolbar actions that should keep editor focus.
- Popovers should close on outside click and Escape, and should avoid blocking editor commands after a selection has been made.
- Font sizes, color palettes, heading levels, and font families should remain curated lists unless custom input is intentionally supported.
- Make visual states obvious: active formatting, disabled undo/redo, selected dropdown items, and current color indicators should be easy to scan.

## TypeScript & React Conventions

- Use functional React components with hooks only.
- Avoid `any`; define interfaces/types for props and reusable data structures.
- Prefer `type` imports for TypeScript-only imports.
- Keep state minimal and local. Store UI state such as active popover tabs in React; keep document content and formatting state in TipTap.
- Use descriptive names. No single-character variables; prefer `index`, `pageNumber`, `contentElement`, `currentFontSize`, etc.
- Use `UPPER_SNAKE_CASE` for true constants such as page dimensions and fixed toolbar options.
- Keep callbacks small and intention-revealing. Extract helpers when a callback mixes measurement, state updates, and DOM mutation.
- Avoid comments that restate code. Comments are useful for non-obvious editor, selection, or pagination behavior.

## Styling Conventions

- Prefer Tailwind utility classes for layout, spacing, borders, colors, and interaction states.
- Use inline styles only for dynamic values, fixed document measurements, typography values that map to editor behavior, or browser APIs that are awkward in Tailwind.
- Keep TipTap document-content styles in `src/index.css` so generated editor content remains consistent regardless of toolbar implementation.
- Avoid scattering page geometry constants across files. If page sizing becomes shared, centralize it before adding more page-related features.

## TipTap Guidelines

- Register editor extensions in `Editor.tsx` and keep extension configuration explicit.
- Use TipTap command chains (`editor.chain().focus()...run()`) for formatting operations.
- Check command availability with `editor.can()` before enabling toolbar buttons where commands may be invalid.
- Use `editor.getAttributes(...)` and `editor.isActive(...)` for current formatting state instead of manually tracking it.
- Be careful with focus-stealing controls: save `editor.state.selection` before focusing form inputs and restore it via `setTextSelection(...)` before applying range-based commands.
- Prefer TipTap extension APIs over direct manipulation of `.tiptap` inner HTML.

## Pagination Guidelines

- `PageView.tsx` owns page frame rendering, page count state, and page break overlay placement.
- Keep constants such as page width, header/footer height, content height, gap height, and padding easy to audit.
- Avoid introducing layout thrashing. When measuring DOM nodes, batch calculations and prevent recursive update loops.
- When changing pagination behavior, manually test long paragraphs, headings near page boundaries, nested lists, images, and edits that shrink content back to fewer pages.
- Page break adjustments should avoid hiding text behind overlays and should not permanently corrupt user content or TipTap document data.

## Code Quality

- No dead code, unused imports, or commented-out experiments.
- Do not add dependencies unless the benefit is clear and the problem cannot be solved cleanly with existing tools.
- Keep components readable enough for a workshop/demo audience; clarity is more valuable than cleverness.
- Prefer explicit, self-documenting names over dense helper abstractions.
- Handle edge cases deliberately: empty selections, invalid URLs, missing files, unsupported image input, unavailable editor instance, and resize loops.

## Testing & Verification

This project currently exposes build and lint scripts rather than a dedicated test suite.

Before handing off code changes, run:

```bash
bun run lint
bun run build
```

For editor behavior changes, also verify manually in the browser:

- basic text formatting: bold, italic, underline
- heading dropdown and normal text reset
- font family and font size changes, including manual size input
- text color and highlight color selection
- left/center/right/justify alignment
- bullet and numbered lists with indent/outdent
- undo/redo disabled and active states
- link add/edit/remove with a selected text range
- image insert from upload and from URL
- horizontal rule insertion
- pagination with multi-page content, headings near boundaries, lists, and images
- popover close behavior via outside click and Escape

## Tooling

- Use `bun` instead of `npm` for all package management and script execution:
  - `bun install`
  - `bun run dev`
  - `bun run lint`
  - `bun run build`
  - `bun run preview`
- Do not mix package managers. Keep `bun.lockb` authoritative unless the project explicitly moves away from Bun.
- Use GitHub CLI (`gh`) for GitHub operations such as repositories, PRs, and issues.

## Git & Pull Request Guidelines

- Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`, `style:`, `perf:`, `ci:`.
- Commit messages should be concise and describe the purpose of the change.
- Do not push directly to protected/default branches unless the repository owner explicitly asks for it.
- Create feature/fix branches for code changes.
- For PR descriptions, use the local `pr-document-writer` skill when available.
- Keep PRs focused. Separate documentation-only changes, editor behavior changes, and styling-only changes when practical.

## Documentation & Diagrams

- Update `README.md` when user-facing features, setup commands, or project structure changes.
- Update `docs/architecture.excalidraw` when the component relationships or data flow materially change.
- Use the local Excalidraw diagram generator skill for architecture, workflow, or sequence diagrams when asked.
- Keep documentation realistic and project-specific; do not copy conventions from unrelated projects unless they actually apply here.
