"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Dynamically import react-pdf parts; SSR disabled. Build will ignore 'canvas' via next.config.js alias.
const Document = dynamic(() => import("react-pdf").then((m) => m.Document as any), { ssr: false });
const Page = dynamic(() => import("react-pdf").then((m) => m.Page as any), { ssr: false });

export interface PdfProgress {
  totalPages: number;
  pagesSeen: number;
  seenPages: number[];
  reachedEnd: boolean;
}

export default function PdfReader({
  src,
  className,
  onProgress,
  onPageChange,
  enableShortcuts = true,
}: {
  src: string;
  className?: string;
  onProgress?: (p: PdfProgress) => void;
  onPageChange?: (page: number, total: number) => void;
  enableShortcuts?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const seenPagesRef = useRef<Set<number>>(new Set());

  // Configure pdf.js worker on client only
  useEffect(() => {
    (async () => {
      try {
        const pdfjsLib: any = await import("pdfjs-dist/build/pdf");
        const version: string = pdfjsLib?.version || "3.11.174";
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
      } catch {
        // Fallback: hardcode version if dynamic import fails
        try {
          const pdfjsLib: any = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        } catch {}
      }
    })();
  }, []);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const emitProgress = useCallback(() => {
    const seen = Array.from(seenPagesRef.current).sort((a, b) => a - b);
    const reachedEnd = seen.length === numPages && numPages > 0;
    onProgress?.({
      totalPages: numPages,
      pagesSeen: seen.length,
      seenPages: seen,
      reachedEnd,
    });
  }, [numPages, onProgress]);

  const onDocumentLoad = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
    // Mark the first visible page as seen
    seenPagesRef.current.add(1);
    emitProgress();
  };

  const onDocumentError = (error: Error) => {
    setError('Failed to load PDF. Please try again later.');
    setIsLoading(false);
    console.error('PDF loading error:', error);
  };

  useEffect(() => {
    emitProgress();
    if (numPages > 0) {
      onPageChange?.(pageNumber, numPages);
    }
  }, [pageNumber, numPages, emitProgress, onPageChange]);

  const markCurrentPageSeen = useCallback((p: number) => {
    if (!seenPagesRef.current.has(p)) {
      seenPagesRef.current.add(p);
      emitProgress();
    }
  }, [emitProgress]);

  const goPrev = useCallback(() => setPageNumber((p) => clamp(p - 1, 1, numPages || 1)), [numPages]);
  const goNext = useCallback(() => setPageNumber((p) => clamp(p + 1, 1, numPages || 1)), [numPages]);
  const zoomOut = useCallback(() => setScale((s) => clamp(Number((s - 0.1).toFixed(2)), 0.6, 2.0)), []);
  const zoomIn = useCallback(() => setScale((s) => clamp(Number((s + 0.1).toFixed(2)), 0.6, 2.0)), []);

  // Keyboard shortcuts: ←/→ for prev/next, +/- for zoom
  useEffect(() => {
    if (!enableShortcuts) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Ignore when typing in inputs or contenteditable
      if (target) {
        const tag = target.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === '+' || (e.key === '=' && e.shiftKey)) {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enableShortcuts, goPrev, goNext, zoomIn, zoomOut]);

  // Cast to any to satisfy TypeScript when using dynamic-imported components
  const Doc: any = Document as any;
  const Pg: any = Page as any;

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center p-8`}>
        <div className="text-center">
          <div className="text-4xl mb-4 opacity-50">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">PDF Loading Error</h3>
          <p className="text-sm opacity-70 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setIsLoading(true);
            }}
            className="px-4 py-2 rounded-lg bg-burgundy text-white hover:bg-burgundy/80 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className} role="application" aria-label="PDF Viewer">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3 p-2 glass rounded-lg">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <button 
            onClick={goPrev} 
            disabled={pageNumber <= 1} 
            className="px-3 py-2 rounded bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all text-sm"
            aria-label="Previous page"
          >
            ← Prev
          </button>
          <button 
            onClick={goNext} 
            disabled={numPages > 0 ? pageNumber >= numPages : true} 
            className="px-3 py-2 rounded bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all text-sm"
            aria-label="Next page"
          >
            Next →
          </button>
          <span className="text-sm opacity-80 px-2" aria-live="polite">
            Page {pageNumber} of {numPages || "?"}
          </span>
        </div>
        <div className="flex items-center gap-2 justify-center sm:justify-end">
          <button 
            onClick={zoomOut} 
            className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 transition-all text-sm font-mono"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="text-sm opacity-80 px-2 min-w-[4rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button 
            onClick={zoomIn} 
            className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 transition-all text-sm font-mono"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      {/* Document */}
      <div className="rounded-lg overflow-auto bg-black/10 relative h-[40vh] sm:h-[50vh] lg:h-[60vh] max-h-[500px] min-h-[250px] sm:min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy mx-auto mb-4"></div>
              <p className="text-sm opacity-70">Loading PDF...</p>
            </div>
          </div>
        )}
        <Doc 
          file={src} 
          onLoadSuccess={onDocumentLoad}
          onLoadError={onDocumentError}
          loading={null}
          error={null}
        >
          <div className="flex justify-center p-1 sm:p-4">
            <Pg
              pageNumber={pageNumber}
              scale={scale}
              onRenderSuccess={() => markCurrentPageSeen(pageNumber)}
              renderTextLayer
              renderAnnotationLayer
              className="shadow-lg"
            />
          </div>
        </Doc>
      </div>
      
      {/* Keyboard shortcuts help */}
      {enableShortcuts && (
        <div className="mt-2 text-xs opacity-60 text-center">
          <span className="hidden sm:inline">
            Use ← → arrow keys to navigate, +/- to zoom
          </span>
          <span className="sm:hidden">
            Use toolbar buttons to navigate and zoom
          </span>
        </div>
      )}
    </div>
  );
}
