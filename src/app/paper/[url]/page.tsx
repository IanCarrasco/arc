'use client';

import React, { useState, useRef, useCallback } from 'react';
import ChatPanel from '../../components/ChatPanel';
import PaperInfoPanel from '../../components/PaperInfoPanel';

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
  const [leftPanelWidth, setLeftPanelWidth] = useState(320); // Left panel width
  const [isResizing, setIsResizing] = useState(false);
  const [isLeftResizing, setIsLeftResizing] = useState(false);
  const [paperTitle, setPaperTitle] = useState('');
  const [paperAuthors, setPaperAuthors] = useState<string[]>([]);
  const [paperAbstract, setPaperAbstract] = useState('');
  const resizeRef = useRef<HTMLDivElement>(null);
  const leftResizeRef = useRef<HTMLDivElement>(null);

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

  // To make this work from localhost (avoid CORS issues), use a proxy server.
  // Fetch the arXiv page and extract metadata
  React.useEffect(() => {
    if (isArxivReference) {
      fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://arxiv.org/abs/${decodedParam}`)}`)
        .then(response => response.json())
        .then(data => {
          // The HTML is in data.contents
          const html = data.contents;
          // Use DOMParser to parse the HTML and extract metadata
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          
          // Extract title
          const ogTitleMeta = doc.querySelector('meta[property="og:title"]');
          const ogTitle = ogTitleMeta ? ogTitleMeta.getAttribute('content') : null;
          setPaperTitle(ogTitle || '');
          
          // Extract authors
          const authorsElement = doc.querySelector('.authors a');
          if (authorsElement) {
            const authorsText = authorsElement.textContent || '';
            // Split by common separators and clean up
            const authors = authorsText
              .split(/,\s*|\sand\s+/i)
              .map(author => author.trim())
              .filter(author => author.length > 0);
            setPaperAuthors(authors);
          }
          
          // Extract abstract
          const abstractElement = doc.querySelector('.abstract');
          if (abstractElement) {
            const abstractText = abstractElement.textContent || '';
            // Clean up the abstract text
            const cleanAbstract = abstractText
              .replace(/^\s*Abstract:\s*/i, '')
              .replace(/\s+/g, ' ')
              .trim();
            setPaperAbstract(cleanAbstract);
          }
        })
        .catch(err => {
          console.error('Failed to fetch or parse arXiv page:', err);
        });
    } else {
      // For non-arXiv URLs, just set the URL as title
      setPaperTitle(displayUrl);
    }
  }, [decodedParam, isArxivReference, displayUrl]);


  // Handle mouse down on right resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Handle mouse down on left resize handle
  const handleLeftMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsLeftResizing(true);
  }, []);

  // Handle mouse move for right panel resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
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

  // Add and remove event listeners for right panel
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Add and remove event listeners for left panel
  React.useEffect(() => {
    if (isLeftResizing) {
      document.addEventListener('mousemove', handleLeftMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleLeftMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isLeftResizing, handleLeftMouseMove, handleMouseUp]);

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

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Header Bar */}
      <header className="w-full bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <h1 className="text-lg font-light text-gray-900 dark:text-white">
            {paperTitle}
          </h1>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Paper Info Panel - Left Side */}
        <div 
          className="flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black"
          style={{ width: `${leftPanelWidth}px` }}
        >
          <PaperInfoPanel 
            title={paperTitle}
            authors={paperAuthors}
            abstract={paperAbstract}
            displayUrl={displayUrl}
          />
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
            <div className="relative w-full h-[calc(100vh-50px)]">
              <iframe 
                src={`${paperUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                className="w-full h-full" 
                title="PDF Viewer" 
              />
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
          style={{ width: `${panelWidth}px` }}
        >
          <ChatPanel paperUrl={paperUrl} displayUrl={displayUrl} />
        </div>
      </main>
    </div>
  );
}
