'use client';

import React, { useState, useRef, useCallback } from 'react';
import ChatPanel from '../../components/ChatPanel';

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
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

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

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Handle mouse move for resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = window.innerWidth - e.clientX;
    const minWidth = 300; // Minimum width
    const maxWidth = 800; // Maximum width
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setPanelWidth(newWidth);
    }
  }, [isResizing]);

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add and remove event listeners
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

  // Add cursor style to body when resizing
  React.useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [isResizing]);

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Header Bar */}
      <header className="w-full bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a 
            href="/" 
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to search
          </a>
          <h1 className="text-lg font-light text-gray-900 dark:text-white">
            arXiv Paper
          </h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex">
        {/* PDF Viewer - Left Side */}
        <div className="flex-1 px-4 py-6">
          <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* PDF Viewer */}
            <div className="relative w-full h-[calc(100vh-200px)]">
              <iframe 
                src={`${paperUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                className="w-full h-full" 
                title="PDF Viewer" 
              />
            </div>
            {/* URL Info */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm">
                {isArxivReference ? 'arXiv Reference:' : 'Source URL:'}
              </p>
              <p className="text-gray-900 dark:text-white font-mono text-xs break-all">
                {displayUrl}
              </p>
            </div>

          </div>
        </div>

        {/* Resize Handle */}
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
