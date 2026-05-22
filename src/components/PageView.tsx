import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const PAGE_WIDTH = 816;
const HEADER_HEIGHT = 48;
const FOOTER_HEIGHT = 48;
const GAP_HEIGHT = 40;
const PAGE_CONTENT_HEIGHT = 1056 - HEADER_HEIGHT - FOOTER_HEIGHT;
const PAGE_HORIZONTAL_PADDING = 96;
const BASE_OVERLAY_HEIGHT = HEADER_HEIGHT + FOOTER_HEIGHT + GAP_HEIGHT;

const PAGE_SHADOW = "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)";

const pageNumberStyle = {
  fontFamily: "Roboto, sans-serif",
  fontSize: 10,
  color: "#999",
} as const;

interface PageViewProps {
  children: ReactNode;
  documentHeaderSlot?: ReactNode;
  documentHeaderHtml?: string;
  isDocumentHeaderVisible?: boolean;
}

/**
 * Finds the .tiptap element inside the content ref and adds margin-top
 * to block elements that would straddle a page boundary, pushing them to
 * the next page. Returns the total number of pages.
 */
function adjustBlockMarginsForPageBreaks(
  contentElement: HTMLElement,
  overlayHeight: number
): number {
  const tiptapElement = contentElement.querySelector(".tiptap");
  if (!tiptapElement) return 1;

  const blockChildren = Array.from(tiptapElement.children) as HTMLElement[];
  const contentTop = tiptapElement.getBoundingClientRect().top;

  // First pass: clear all previously injected margins
  for (const block of blockChildren) {
    if (block.dataset.pageMargin) {
      block.style.marginBottom = "";
      delete block.dataset.pageMargin;
    }
  }

  // Second pass: find blocks that straddle page boundaries and add margin
  let currentPage = 1;
  for (const block of blockChildren) {
    const blockRect = block.getBoundingClientRect();
    const blockTop = blockRect.top - contentTop;
    const blockBottom = blockRect.bottom - contentTop;

    // Account for margins already added (each previous page break adds overlayHeight)
    const previousBreaks = currentPage - 1;
    const adjustedTop = blockTop - previousBreaks * overlayHeight;
    const adjustedBottom = blockBottom - previousBreaks * overlayHeight;

    const pageBoundary = currentPage * PAGE_CONTENT_HEIGHT;

    // If this block crosses a page boundary
    if (adjustedTop < pageBoundary && adjustedBottom > pageBoundary) {
      // Add margin to push it to the next page's content area
      const spaceNeeded = pageBoundary - adjustedTop + overlayHeight;
      block.style.marginTop = `${spaceNeeded}px`;
      block.dataset.pageMargin = "true";
      currentPage++;
    } else if (adjustedBottom > pageBoundary) {
      // Block starts on or after the boundary — we've moved to next page
      currentPage = Math.floor(adjustedTop / PAGE_CONTENT_HEIGHT) + 1;
    }
  }

  // Calculate total pages from the final content height
  const finalHeight = tiptapElement.getBoundingClientRect().height;
  const totalBreaks = currentPage - 1;
  const adjustedHeight = finalHeight - totalBreaks * overlayHeight;
  return Math.max(1, Math.ceil(adjustedHeight / PAGE_CONTENT_HEIGHT));
}

function PageView({
  children,
  documentHeaderSlot,
  documentHeaderHtml,
  isDocumentHeaderVisible = false,
}: PageViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const headerMeasureRef = useRef<HTMLDivElement>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [documentHeaderRenderedHeight, setDocumentHeaderRenderedHeight] =
    useState(0);
  const isAdjustingRef = useRef(false);

  const showHeader = isDocumentHeaderVisible && !!documentHeaderSlot;
  const headerHeight = showHeader ? documentHeaderRenderedHeight : 0;
  const effectiveOverlayHeight = BASE_OVERLAY_HEIGHT + headerHeight;

  // Measure document header height
  useEffect(() => {
    const element = headerMeasureRef.current;
    if (!element || !showHeader) {
      setDocumentHeaderRenderedHeight(0);
      return;
    }
    const measureHeight = () => {
      const height = element.getBoundingClientRect().height;
      setDocumentHeaderRenderedHeight(height);
    };
    measureHeight();
    const observer = new ResizeObserver(measureHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [showHeader]);

  const recalculatePages = useCallback(() => {
    if (isAdjustingRef.current) return;
    const element = contentRef.current;
    if (!element) return;

    isAdjustingRef.current = true;
    const pages = adjustBlockMarginsForPageBreaks(
      element,
      effectiveOverlayHeight
    );
    if (pages !== totalPages) {
      setTotalPages(pages);
    }
    isAdjustingRef.current = false;
  }, [totalPages, effectiveOverlayHeight]);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const observer = new ResizeObserver(recalculatePages);
    observer.observe(element);

    // Also observe the tiptap element itself for content changes
    const tiptapElement = element.querySelector(".tiptap");
    if (tiptapElement) {
      observer.observe(tiptapElement);
    }

    return () => observer.disconnect();
  }, [recalculatePages]);

  // Recalculate when header height changes
  useEffect(() => {
    recalculatePages();
  }, [headerHeight, recalculatePages]);

  return (
    <div className="relative mt-4" style={{ width: PAGE_WIDTH }}>
      {/* First page header */}
      <div
        className="bg-white"
        style={{
          height: HEADER_HEIGHT,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          boxShadow: PAGE_SHADOW,
          clipPath: "inset(-10px -10px 0 -10px)",
        }}
      />

      {/* Document header (editable, first page) */}
      {showHeader && (
        <div
          ref={headerMeasureRef}
          className="bg-white"
          style={{
            paddingLeft: PAGE_HORIZONTAL_PADDING,
            paddingRight: PAGE_HORIZONTAL_PADDING,
            boxShadow: PAGE_SHADOW,
            clipPath: "inset(0 -10px)",
          }}
        >
          <div className="document-header bg-[#f8f9fc] rounded-sm px-3 py-2">
            {documentHeaderSlot}
          </div>
          <div className="border-b border-gray-300 mt-2" />
        </div>
      )}

      {/* Content area */}
      <div
        ref={contentRef}
        className="bg-white"
        style={{
          paddingLeft: PAGE_HORIZONTAL_PADDING,
          paddingRight: PAGE_HORIZONTAL_PADDING,
          minHeight: PAGE_CONTENT_HEIGHT,
          boxShadow: PAGE_SHADOW,
          clipPath: "inset(0 -10px)",
        }}
      >
        {children}
      </div>

      {/* Last page footer */}
      <div
        className="bg-white flex items-center justify-end"
        style={{
          height: FOOTER_HEIGHT,
          paddingRight: PAGE_HORIZONTAL_PADDING,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
          boxShadow: PAGE_SHADOW,
          clipPath: "inset(0 -10px -10px -10px)",
        }}
      >
        <span style={pageNumberStyle}>
          Page {totalPages} of {totalPages}
        </span>
      </div>

      {/* Page gap overlays at each boundary */}
      {Array.from({ length: totalPages - 1 }, (_, index) => {
        const pageNumber = index + 1;
        // Each overlay sits at: first page header + document header + N page-content-heights + previous overlays
        const topPosition =
          HEADER_HEIGHT +
          headerHeight +
          PAGE_CONTENT_HEIGHT * pageNumber +
          index * effectiveOverlayHeight;

        return (
          <div
            key={pageNumber}
            className="absolute left-0 right-0 pointer-events-none"
            style={{ top: topPosition, zIndex: 10 }}
          >
            {/* Footer of ending page */}
            <div
              className="bg-white flex items-center justify-end"
              style={{
                height: FOOTER_HEIGHT,
                paddingRight: PAGE_HORIZONTAL_PADDING,
                boxShadow: PAGE_SHADOW,
                clipPath: "inset(0 -10px -10px -10px)",
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 4,
              }}
            >
              <span style={pageNumberStyle}>
                Page {pageNumber} of {totalPages}
              </span>
            </div>

            {/* Gap between pages */}
            <div className="bg-[#F8F9FA]" style={{ height: GAP_HEIGHT }} />

            {/* Header of next page */}
            <div
              className="bg-white"
              style={{
                height: HEADER_HEIGHT,
                boxShadow: PAGE_SHADOW,
                clipPath: "inset(-10px -10px 0 -10px)",
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
              }}
            />

            {/* Document header (read-only copy for subsequent pages) */}
            {showHeader && documentHeaderHtml && (
              <div
                className="bg-white"
                style={{
                  paddingLeft: PAGE_HORIZONTAL_PADDING,
                  paddingRight: PAGE_HORIZONTAL_PADDING,
                  boxShadow: PAGE_SHADOW,
                  clipPath: "inset(0 -10px)",
                }}
              >
                <div className="document-header bg-[#f8f9fc] rounded-sm px-3 py-2">
                  <div
                    className="tiptap"
                    dangerouslySetInnerHTML={{ __html: documentHeaderHtml }}
                  />
                </div>
                <div className="border-b border-gray-300 mt-2" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PageView;
