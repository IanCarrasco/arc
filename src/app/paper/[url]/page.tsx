'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import ChatPanel from '../../components/ChatPanel';
import PaperInfoPanel from '../../components/PaperInfoPanel';
import SelectionOverlay from '../../components/SelectionOverlay';
import PDFViewer, { PDFViewerRef } from '../../components/PDFViewer';
import { PaperMetadataStorage, PaperMetadata } from '../../utils/paperMetadata';

interface PaperPageProps {
  params: Promise<{
    url: string;
  }>;
}

export default function PaperPage({ params }: PaperPageProps) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = React.use(params);

  // State for panel width
  const [panelWidth, setPanelWidth] = useState(384); // 96 * 4 = 384px (w-96)
  const [leftPanelWidth, setLeftPanelWidth] = useState(400); // Left panel width
  const [isResizing, setIsResizing] = useState(false);
  const [isLeftResizing, setIsLeftResizing] = useState(false);
  const [paperTitle, setPaperTitle] = useState('');
  const [paperAuthors, setPaperAuthors] = useState<string[]>([]);
  const [paperAbstract, setPaperAbstract] = useState('');
  const [isSelectionActive, setIsSelectionActive] = useState(false);
  const [capturedRegions, setCapturedRegions] = useState<Array<{id: string; base64: string; timestamp: Date}>>([]);
  const resizeRef = useRef<HTMLDivElement>(null);
  const leftResizeRef = useRef<HTMLDivElement>(null);
  const pdfViewerRef = useRef<HTMLDivElement | null>(null);
  const pdfViewerComponentRef = useRef<PDFViewerRef>(null);

  // Decode the URL parameter
  const decodedParam = decodeURIComponent(resolvedParams.url);
  
  // Determine if it's an arXiv reference number or a full URL
  const isArxivReference = /^\d{4}\.\d{4,5}(?:v\d+)?$/.test(decodedParam);
  
  // Construct the appropriate URL
  const paperUrl = isArxivReference 
    ? `https://arxiv.org/pdf/${decodedParam}`
    : decodedParam;
  
  // For display purposes, show the reference number if available
  const displayUrl = isArxivReference 
    ? `arXiv:${decodedParam}`
    : decodedParam;

  // Load paper metadata from cache or fetch if needed
  React.useEffect(() => {
    console.log('useEffect triggered with:', { paperUrl, displayUrl, isArxivReference, decodedParam });

    const loadPaperMetadata = async () => {
      try {
        // First check if we have cached metadata
        const cachedMetadata = PaperMetadataStorage.get(paperUrl);

        console.log('Checking cache for:', paperUrl, 'Found:', !!cachedMetadata);

        if (cachedMetadata && PaperMetadataStorage.hasValidCache(paperUrl)) {
          // Use cached data
          console.log('Using cached metadata for:', paperUrl);
          setPaperTitle(cachedMetadata.title);
          setPaperAuthors(cachedMetadata.authors);
          setPaperAbstract(cachedMetadata.abstract);
          return;
        }

        console.log('No valid cache found, will fetch metadata for:', paperUrl, 'isArxivReference:', isArxivReference);

        // No valid cache, need to fetch
        if (isArxivReference) {
          console.log('Making API call to:', `/api/arxiv?id=${encodeURIComponent(decodedParam)}`);
          try {
            const response = await fetch(`/api/arxiv?id=${encodeURIComponent(decodedParam)}`);
            console.log('API response status:', response.status, response.ok);

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched arXiv data:', data);

            // Create and store metadata
            const metadata = PaperMetadataStorage.createFromArxivResponse(data, paperUrl, displayUrl);
            PaperMetadataStorage.store(metadata);
            console.log('Stored metadata in localStorage:', metadata);

            // Update state
            setPaperTitle(metadata.title);
            setPaperAuthors(metadata.authors);
            setPaperAbstract(metadata.abstract);
          } catch (error) {
            console.error('Failed to fetch arXiv metadata:', error);

            // Create and store basic metadata as fallback
            const metadata = PaperMetadataStorage.createBasic(paperUrl, displayUrl);
            PaperMetadataStorage.store(metadata);
            console.log('Stored fallback metadata:', metadata);

            setPaperTitle(displayUrl);
            setPaperAuthors([]);
            setPaperAbstract('');
          }
        } else {
          // For non-arXiv URLs, create and store basic metadata
          console.log('Creating basic metadata for non-arXiv URL:', paperUrl);
          const metadata = PaperMetadataStorage.createBasic(paperUrl, displayUrl);
          PaperMetadataStorage.store(metadata);
          console.log('Stored basic metadata:', metadata);

          setPaperTitle(displayUrl);
          setPaperAuthors([]);
          setPaperAbstract('');
        }

        console.log('Metadata loading complete');
      } catch (error) {
        console.error('Error in loadPaperMetadata:', error);
        // Fallback to basic info
        setPaperTitle(displayUrl);
        setPaperAuthors([]);
        setPaperAbstract('');
      }
    };

    loadPaperMetadata();
  }, [paperUrl, displayUrl, isArxivReference, decodedParam]);

  // Add a separate effect to handle initial load
  React.useEffect(() => {
    console.log('Initial load effect triggered');
    // This ensures the component has mounted before trying to fetch
  }, []);


  // Handle mouse down on right resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start resizing if left mouse button is pressed
    if (e.button !== 0) return;
    
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Handle mouse down on left resize handle
  const handleLeftMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start resizing if left mouse button is pressed
    if (e.button !== 0) return;
    
    e.preventDefault();
    setIsLeftResizing(true);
  }, []);

  // Handle mouse move for right panel resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    // Only resize if we're actually dragging (mouse button is down)
    if (e.buttons !== 1) {
      setIsResizing(false);
      return;
    }
    
    const newWidth = window.innerWidth - e.clientX;
    const minWidth = 300; // Minimum width
    const maxWidth = 800; // Maximum width
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setPanelWidth(newWidth);
    }
  }, [isResizing]);

  // Handle mouse move for left panel resizing
  const handleLeftMouseMove = useCallback((e: MouseEvent) => {
    if (!isLeftResizing) return;
    
    // Only resize if we're actually dragging (mouse button is down)
    if (e.buttons !== 1) {
      setIsLeftResizing(false);
      return;
    }
    
    const newWidth = e.clientX;
    const minWidth = 250; // Minimum width
    const maxWidth = 500; // Maximum width
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setLeftPanelWidth(newWidth);
    }
  }, [isLeftResizing]);

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setIsLeftResizing(false);
  }, []);

  // Handle mouse leave to stop resizing if mouse leaves the window
  const handleMouseLeave = useCallback(() => {
    setIsResizing(false);
    setIsLeftResizing(false);
  }, []);

  // Add and remove event listeners for right panel
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp, handleMouseLeave]);

  // Add and remove event listeners for left panel
  React.useEffect(() => {
    if (isLeftResizing) {
      document.addEventListener('mousemove', handleLeftMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        document.removeEventListener('mousemove', handleLeftMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [isLeftResizing, handleLeftMouseMove, handleMouseUp, handleMouseLeave]);

  // Add cursor style to body when resizing
  React.useEffect(() => {
    if (isResizing || isLeftResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [isResizing, isLeftResizing]);

  // Toggle selection overlay
  const toggleSelection = useCallback(() => {
    setIsSelectionActive(prev => !prev);
  }, []);

  const handleCapturedRegion = useCallback((region: {id: string; base64: string; timestamp: Date}) => {
    setCapturedRegions(prev => [...prev, region]);
  }, []);

  const removeCapturedRegion = useCallback((id: string) => {
    setCapturedRegions(prev => prev.filter(region => region.id !== id));
  }, []);

  const clearAllCapturedRegions = useCallback(() => {
    setCapturedRegions([]);
  }, []);

  // Memoize PaperInfoPanel props to prevent unnecessary re-renders
  const paperInfoProps = useMemo(() => ({
    title: paperTitle,
    authors: paperAuthors,
    abstract: paperAbstract,
    displayUrl: displayUrl
  }), [paperTitle, paperAuthors, paperAbstract, displayUrl]);

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Main Content - Adjusted for header */}
      <main className="flex-1 flex pt-16">
        {/* Paper Info Panel - Left Side */}
        <div
          className="flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black"
          style={{ width: `${leftPanelWidth}px`, height: 'calc(100vh - 4rem)' }}
        >
          <PaperInfoPanel {...paperInfoProps} />
        </div>

        {/* Left Resize Handle */}
        <div
          ref={leftResizeRef}
          className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize transition-colors duration-200 flex-shrink-0"
          onMouseDown={handleLeftMouseDown}
          style={{ cursor: 'col-resize' }}
        />

        {/* PDF Viewer - Center */}
        <div className="flex-1 px-4 py-6">
          <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* PDF Viewer */}
            <div className="relative w-full h-[calc(100vh-6rem)]">
              <div ref={pdfViewerRef} className="w-full h-full">
                <PDFViewer 
                  ref={pdfViewerComponentRef}
                  url={paperUrl}
                  onPageLoad={(numPages) => {
                    console.log('PDF loaded with', numPages, 'pages');
                  }}
                  onLoadError={(error) => {
                    console.error('PDF load error:', error);
                  }}
                  isSelectionActive={isSelectionActive}
                  onToggleSelection={toggleSelection}
                  onCapturedRegion={handleCapturedRegion}
                />
              </div> 
            </div>

          </div>
        </div>

        {/* Right Resize Handle */}
        <div
          ref={resizeRef}
          className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize transition-colors duration-200 flex-shrink-0"
          onMouseDown={handleMouseDown}
          style={{ cursor: 'col-resize' }}
        />

        {/* Agent Panel - Right Side */}
        <div
          className="flex-shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-black"
          style={{ width: `${panelWidth}px`, height: 'calc(100vh - 4rem)' }}
        >
          <ChatPanel 
            paperUrl={paperUrl} 
            displayUrl={displayUrl}
            onCaptureClick={toggleSelection}
            isSelectionActive={isSelectionActive}
            capturedRegions={capturedRegions}
            onCapturedRegion={handleCapturedRegion}
            onRemoveCapturedRegion={removeCapturedRegion}
            onClearAllCapturedRegions={clearAllCapturedRegions}
          />
        </div>
      </main>
    </div>
  );
}
