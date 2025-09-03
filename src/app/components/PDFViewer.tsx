'use client';

import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Document, Page, pdfjs } from "react-pdf";
import SelectionOverlay from './SelectionOverlay';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  url: string;
  onPageLoad?: (numPages: number) => void;
  onLoadError?: (error: Error) => void;
  isSelectionActive: boolean;
  onToggleSelection: () => void;
  onCapturedRegion: (region: {id: string; base64: string; timestamp: Date}) => void;
}

export interface PDFViewerRef {
  getCanvasElements: () => HTMLCanvasElement[];
  getMainCanvas: () => HTMLCanvasElement | null;
}

const PDFViewer = forwardRef<PDFViewerRef, PDFViewerProps>(({ url, onPageLoad, onLoadError, isSelectionActive, onToggleSelection, onCapturedRegion }, ref) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.25);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose canvas methods to parent components
  useImperativeHandle(ref, () => ({
    getCanvasElements: () => {
      return containerRef.current ? Array.from(containerRef.current.querySelectorAll('canvas')) : [];
    },
    getMainCanvas: () => {
      const canvases = containerRef.current ? Array.from(containerRef.current.querySelectorAll('canvas')) : [];
      if (canvases.length === 0) return null;
      
      // Find the largest canvas (main PDF canvas)
      let mainCanvas = canvases[0] as HTMLCanvasElement;
      let maxArea = mainCanvas.width * mainCanvas.height;
      
      for (let i = 1; i < canvases.length; i++) {
        const canvas = canvases[i] as HTMLCanvasElement;
        const area = canvas.width * canvas.height;
        if (area > maxArea) {
          mainCanvas = canvas;
          maxArea = area;
        }
      }
      
      return mainCanvas;
    }
  }), []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully:', { numPages, url });
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
    onPageLoad?.(numPages);
  }, [url, onPageLoad]);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setError(error.message);
    setIsLoading(false);
    onLoadError?.(error);
  }, [onLoadError]);

  const onPageLoadSuccess = useCallback((page: any) => {
    console.log('Page loaded:', page.pageNumber);
  }, []);

  const onPageLoadError = useCallback((error: Error) => {
    console.error('Page load error:', error);
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.25);
  }, []);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= (numPages || 1)) {
      setPageNumber(page);
    }
  }, [numPages]);

  // Reset state when URL changes
  useEffect(() => {
    setPageNumber(1);
    setScale(1.25);
    setIsLoading(true);
    setError(null);
  }, [url]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
        <div className="text-center p-6">
          <div className="text-red-500 text-lg mb-2">❌ PDF Load Error</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {error}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            This might be due to CORS restrictions or an invalid PDF URL.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-gray-100 dark:bg-black">
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-transparent border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center space-x-2">
          {/* Page Navigation */}
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {pageNumber} of {numPages || '...'}
          </span>
          
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= (numPages || 1)}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <button
            onClick={zoomOut}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Zoom Out
          </button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Zoom In
          </button>
          
          <button
            onClick={resetZoom}
            className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Page Jump */}
        {numPages && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Go to:</span>
            <input
              type="number"
              min="1"
              max={numPages}
              value={pageNumber}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        )}
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <div className="text-gray-600 dark:text-gray-400">Loading PDF...</div>
            </div>
          </div>
        )}

        <div className="flex justify-center items-center min-h-full">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <div className="text-gray-600 dark:text-gray-400">Loading PDF...</div>
                </div>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-96">
                <div className="text-center p-6">
                  <div className="text-red-500 text-lg mb-2">❌ PDF Load Error</div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    Failed to load PDF document
                  </div>
                </div>
              </div>
            }
          >
              <SelectionOverlay 
                isActive={isSelectionActive}
                onToggle={onToggleSelection}
                onCapturedRegion={onCapturedRegion}>
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  onLoadSuccess={onPageLoadSuccess}
                  onLoadError={onPageLoadError}
                  className="shadow-lg"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </SelectionOverlay>
            
          </Document>
        </div>
      </div>
    </div>
  );
});

PDFViewer.displayName = 'PDFViewer';

export default PDFViewer;
