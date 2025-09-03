'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';

interface CapturedRegion {
  id: string;
  base64: string;
  timestamp: Date;
}

interface SelectionOverlayProps {
  isActive: boolean;
  onToggle: () => void;
  onCapturedRegion?: (region: CapturedRegion) => void;
  children: React.ReactNode;
}

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function SelectionOverlay({ isActive, onToggle, onCapturedRegion, children }: SelectionOverlayProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [captureFailed, setCaptureFailed] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Debug logging for component initialization
  console.log('🚀 SelectionOverlay component initialized', {
    isActive,
    timestamp: new Date().toISOString()
  });

  // Debug when isActive changes
  useEffect(() => {
    console.log('🎯 SelectionOverlay isActive changed:', isActive);
  }, [isActive]);

  // CSS sanitization function to handle unsupported color functions
  const sanitizeCSS = useCallback((clonedDoc: Document) => {
    const style = clonedDoc.createElement('style');
    style.textContent = `
      * {
        color: rgb(0, 0, 0) !important;
        background-color: rgb(255, 255, 255) !important;
        border-color: rgb(200, 200, 200) !important;
      }
      body {
        background: white !important;
      }
      /* Override any modern CSS color functions */
      [style*="lab("], [style*="lch("], [style*="oklab("], [style*="oklch("] {
        color: rgb(0, 0, 0) !important;
        background-color: rgb(255, 255, 255) !important;
      }
    `;
    clonedDoc.head.appendChild(style);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    console.log('🖱️ Mouse down event', { isActive, clientX: e.clientX, clientY: e.clientY });
    
    // Check if the click is on a button (don't start selection)
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      console.log('🔄 Click on button, not starting selection');
      return;
    }
    
    if (!isActive) {
      console.log('❌ Overlay not active, ignoring mouse down');
      return;
    }
    
    console.log('✅ Starting selection - overlay is active');
    e.preventDefault();
    setIsSelecting(true);
    
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) {
      console.log('❌ No overlay rect found');
      return;
    }
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log('📍 Selection started', { x, y, rect });
    
    setStartPos({ x, y });
    setSelection({ x, y, width: 0, height: 0 });
  }, [isActive]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !isActive) {
      if (isActive && !isSelecting) {
        console.log('🖱️ Mouse move - overlay active but not selecting');
      }
      return;
    }
    
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const x = Math.min(startPos.x, currentX);
    const y = Math.min(startPos.y, currentY);
    const width = Math.abs(currentX - startPos.x);
    const height = Math.abs(currentY - startPos.y);
    
    console.log('🖱️ Mouse move - updating selection:', { x, y, width, height });
    setSelection({ x, y, width, height });
  }, [isSelecting, isActive, startPos]);

  const captureSelection = useCallback(async () => {
    if (!selection) {
      return;
    }
    
    // Validate selection dimensions
    if (selection.width <= 0 || selection.height <= 0 || selection.width < 10 || selection.height < 10) {
      setCaptureFailed(true);
      return;
    }
    
    setCaptureFailed(false);
    
    try {
      // Create output canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Set canvas size to match selection with higher resolution
      canvas.width = selection.width * 2;
      canvas.height = selection.height * 2;
      
      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Find the main PDF canvas within the overlay's container
      const container = overlayRef.current?.parentElement;
      if (!container) {
        throw new Error('No container found');
      }
      
      const canvasElements = container.querySelectorAll('canvas');
      
      if (canvasElements.length === 0) {
        throw new Error('No canvas elements found');
      }
      
      // Get the main canvas (largest one)
      let mainCanvas = canvasElements[0] as HTMLCanvasElement;
      let maxArea = mainCanvas.width * mainCanvas.height;
      
      for (let i = 1; i < canvasElements.length; i++) {
        const canvas = canvasElements[i] as HTMLCanvasElement;
        const area = canvas.width * canvas.height;
        if (area > maxArea) {
          mainCanvas = canvas;
          maxArea = area;
        }
      }
      
      // Create temp canvas for the selected region
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      if (!tempCtx) {
        throw new Error('Could not get temp canvas context');
      }
      
      tempCanvas.width = selection.width * 2;
      tempCanvas.height = selection.height * 2;
      
      // Fill with white background
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Calculate scaling between displayed canvas and actual canvas
      const canvasRect = mainCanvas.getBoundingClientRect();
      const scaleX = mainCanvas.width / canvasRect.width;
      const scaleY = mainCanvas.height / canvasRect.height;
      
      // Debug coordinate mapping
      console.log('🎯 Coordinate mapping debug:', {
        selection: { x: selection.x, y: selection.y, width: selection.width, height: selection.height },
        mainCanvas: { width: mainCanvas.width, height: mainCanvas.height },
        canvasRect: { width: canvasRect.width, height: canvasRect.height },
        scale: { x: scaleX, y: scaleY },
        mainCanvasRect: mainCanvas.getBoundingClientRect(),
        overlayRect: overlayRef.current?.getBoundingClientRect()
      });
      
      // Scale the selection coordinates to match the actual canvas resolution
      const scaledX = selection.x * scaleX;
      const scaledY = selection.y * scaleY;
      const scaledWidth = selection.width * scaleX;
      const scaledHeight = selection.height * scaleY;
      
      console.log('🎯 Scaled coordinates:', { scaledX, scaledY, scaledWidth, scaledHeight });
      
      // Draw the selected region from the main canvas with scaled coordinates
      tempCtx.drawImage(
        mainCanvas,
        scaledX, scaledY, scaledWidth, scaledHeight,
        0, 0, tempCanvas.width, tempCanvas.height
      );
      
      // Draw the temp canvas to the output canvas
      ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 and send to parent
      const base64 = canvas.toDataURL('image/png');
      
      if (!base64) {
        throw new Error('Failed to create base64 from canvas');
      }
      
      const capturedRegion: CapturedRegion = {
        id: `region-${Date.now()}`,
        base64: base64,
        timestamp: new Date()
      };
      
      onCapturedRegion?.(capturedRegion);
      
      // Clear selection and deactivate overlay
      setSelection(null);
      onToggle();
      
    } catch (error) {
      console.error('Error capturing selection:', error);
      setCaptureFailed(true);
    }
  }, [selection, onToggle, onCapturedRegion]);

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !isActive) return;
    setIsSelecting(false);
    
    // Clear selection if it's too small
    if (selection && (selection.width < 10 || selection.height < 10)) {
      setSelection(null);
      return;
    }
    
    // Automatically capture if we have a valid selection
    if (selection && selection.width >= 10 && selection.height >= 10) {
      // Small delay to ensure the selection state is updated
      setTimeout(() => {
        captureSelection();
      }, 100);
    }
  }, [isSelecting, isActive, selection, captureSelection]);





  // Prevent PDF viewer interactions when overlay is active
  useEffect(() => {
    const container = overlayRef.current?.parentElement;
    console.log('🔧 Pointer events effect:', { isActive, hasContainer: !!container });
    if (isActive && container) {
      // Don't disable pointer events on the container since we need them for the overlay
      console.log('✅ Overlay active - keeping pointer events enabled');
    } else if (container) {
      container.style.pointerEvents = 'auto';
      console.log('🔄 Overlay inactive - resetting pointer events');
    }
  }, [isActive]);

  console.log('🎨 SelectionOverlay render:', { isActive, hasChildren: !!children });

  return (
    <div className="relative inline-block">
      {/* Render the children (PDF Page) */}
      {children}
      
      {/* Selection overlay - only show when active */}
      {isActive && (
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-transparent cursor-crosshair z-10"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ 
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            cursor: 'crosshair',
            pointerEvents: 'auto'
          }}
        >
          {/* Selection rectangle */}
          {selection && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
              style={{
                left: selection.x,
                top: selection.y,
                width: selection.width,
                height: selection.height,
              }}
            />
          )}
          
          {/* Warning message when capture fails */}
          {captureFailed && (
            <div className="absolute bottom-4 left-4 bg-orange-500 bg-opacity-90 text-white text-sm px-3 py-2 rounded max-w-xs">
              <div className="font-semibold mb-1">⚠️ Capture Failed</div>
              <div className="text-xs">
                Capture failed. Please try selecting a different region.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
