# Doc Editor — Requirement Specification (v1)

## 1. Purpose & Scope

A client-only, single-user web app for creating and formatting documents in the
browser. v1 delivers a Google Docs–style writing surface with rich formatting,
**local persistence** so work survives a refresh, and **export/import** for
common file formats. No backend, accounts, or multi-user collaboration.

**In scope:** core rich-text formatting, paginated page view, local autosave,
export, import.

**Out of scope (v1):** auth/accounts, cloud storage/sync, real-time
collaboration, sharing links, comments, version history, multiple documents at
once, DOCX support.

## 2. Users & Context

- **Primary user:** an individual writing a document on their own device.
- **Environment:** modern desktop browsers (Chrome, Edge, Firefox, Safari —
  current versions).
- **Editing model:** **one document at a time.** Opening or importing a document
  replaces the current working document (after appropriate confirmation).

## 3. Functional Requirements

### 3.1 Document & Page Surface

- **FR-1** Render a single editable document on a US-Letter-proportioned page
  with subtle shadow on a gray app background.
- **FR-2** Auto-paginate content into multiple pages as it grows, with
  consistent headers/footers, gaps, page numbers, and padding (per existing
  `PageView`).
- **FR-3** Pagination must be deterministic and must not hide or corrupt text
  when content shrinks back to fewer pages.

### 3.2 Text Formatting

- **FR-4** Inline styles: bold, italic, underline (optionally strikethrough).
- **FR-5** Headings (curated levels) and a "normal text" reset.
- **FR-6** Font family and font size from curated lists, plus manual size entry.
- **FR-7** Text color and highlight color via palette popovers, with
  current-color indicators.
- **FR-8** Paragraph alignment: left / center / right / justify.
- **FR-9** Bullet and numbered lists with indent / outdent (including nested
  lists).
- **FR-10** Links: add / edit / remove over a selected range, preserving
  selection across the popover.
- **FR-11** Images: insert from local upload and from URL.
- **FR-12** Horizontal rule insertion.
- **FR-13** Undo / redo with correct disabled and active states.

### 3.3 Toolbar & Interaction

- **FR-14** Fixed, compact, grouped toolbar; active formatting state reflected
  from TipTap (`isActive`), not duplicated in React state.
- **FR-15** Toolbar actions preserve editing focus/selection
  (`onMouseDown` + `preventDefault`).
- **FR-16** Popovers close on outside click and Escape; support Enter to confirm
  where relevant.

### 3.4 Local Persistence

- **FR-17** Autosave the current document to browser storage
  (`localStorage`/IndexedDB) so a refresh or accidental close does not lose work.
- **FR-18** On load, restore the most recently saved document automatically.
- **FR-19** Saving must be debounced and must not block typing or cause resize /
  update feedback loops (see NFR-1).
- **FR-20** Provide a way to start a new/empty document, clearing the persisted
  state with confirmation.

### 3.5 Export

- **FR-21** Export the current document to **PDF** with formatting and
  pagination preserved (reuse the live `.tiptap` element per the established
  html2pdf approach — pass the live element directly, no cloning/off-screen
  tricks).
- **FR-22** Export to **HTML** (self-contained, with document-content styling
  applied so the file renders consistently outside the app).
- **FR-23** Export to **Markdown** (lossy for editor-specific constructs; see
  §6).
- **FR-24** Each export uses a sensible default filename and triggers a browser
  download; no server round-trip.
- **FR-25** Export must not mutate or lose the in-editor document content.

### 3.6 Import

- **FR-26** Import **HTML** and load it into the editor as TipTap content.
- **FR-27** Import **Markdown** and load it into the editor as TipTap content.
- **FR-28** Import **PDF** *(flagged high-risk — see §6; recommended for
  deferral)*. If retained, it is best-effort text extraction only, with no
  guarantee of layout, styling, or structure fidelity.
- **FR-29** Import sanitizes incoming content — no unsafe HTML injection;
  unsupported nodes are dropped or downgraded gracefully, never silently
  corrupting the document.
- **FR-30** Importing replaces the current single document, with confirmation
  to prevent accidental loss of unsaved work.
- **FR-31** Handle invalid, empty, or oversized files with clear, non-blocking
  error feedback.

## 4. Non-Functional Requirements

- **NFR-1 Performance:** no expensive work per keystroke; scoped measurements,
  memoized callbacks, debounced autosave, no resize/update feedback loops.
- **NFR-2 Accessibility:** real buttons/inputs, meaningful `title` text,
  keyboard support (Enter/Escape), visible disabled states, clear focus.
- **NFR-3 Security:** treat user-entered URLs and uploaded/imported content
  carefully; prefer TipTap commands and sanitized APIs over raw HTML injection.
- **NFR-4 Visual fidelity:** stay close to common document tools; editor content
  styling lives in `index.css` so output is consistent regardless of toolbar.
- **NFR-5 Maintainability:** clear component boundaries
  (`Editor` / `Toolbar` / `PageView` / popovers); KISS / YAGNI / DRY / SRP.
- **NFR-6 Browser-native first:** use `ResizeObserver`, `FileReader`, CSS layout
  before adding dependencies.

## 5. Constraints & Stack

- React 19 + TypeScript + Vite; TipTap 3 / ProseMirror as the editor source of
  truth; Tailwind 4; Lucide icons; **Bun** as package manager/runner.
- Client-only — all logic runs in the browser; no network/storage backend.

## 6. Risks & Decisions to Watch

- **PDF import (FR-28)** is the highest-risk item. PDFs encode visual layout, not
  clean document structure; importing into a rich-text editor yields poor,
  lossy results. **Recommendation: drop PDF from import for v1**, keeping HTML +
  Markdown as the supported import formats. PDF remains a strong **export**
  target.
- **Markdown fidelity** is inherently lossy for editor-specific constructs
  (colors, highlights, font sizes/families, alignment, page breaks). Define and
  document what Markdown export/import preserves vs. drops.
- **Round-trip fidelity** (export → import) will be imperfect, especially for
  pagination, page breaks, and images. Test these paths explicitly.
- **Image handling** needs a defined policy across persistence and export/import
  (base64 inline vs. URL reference, and size limits for autosave storage
  quotas).
- **Storage quotas:** large documents/images can exceed `localStorage` limits;
  IndexedDB is the safer target if image-heavy documents are expected.

## 7. Acceptance Criteria (high level)

- A user can create, format, and edit a document covering all of §3.2.
- Refreshing the browser restores the last-edited document automatically.
- The user can export the current document to PDF, HTML, and Markdown, each
  downloading a correct file without altering the in-editor content.
- The user can import an HTML or Markdown file and continue editing it, with
  unsupported content downgraded gracefully and invalid files reported clearly.
- All editor behaviors pass the manual verification checklist in the project
  guidelines, plus the new export, import, and autosave paths.
