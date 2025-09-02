'use client';

import React from 'react';

interface PaperInfoPanelProps {
  title: string;
  authors: string[];
  abstract: string;
  displayUrl: string;
}

export default function PaperInfoPanel({ title, authors, abstract, displayUrl }: PaperInfoPanelProps) {
  console.log('PaperInfoPanel received:', { title, authors, abstract, displayUrl });

  // Function to decode HTML entities
  const decodeHtmlEntities = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Paper Information</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-track-hide px-4 py-4 space-y-6">
        {/* Title */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Title
          </h3>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-relaxed">
            {title ? decodeHtmlEntities(title) : 'Loading...'}
          </h1>
        </div>

        {/* Authors */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Authors
          </h3>
          <div className="space-y-1">
            {authors.length > 0 ? (
              authors.map((author, index) => (
                <span key={index} className="text-sm text-gray-700 dark:text-gray-300">
                  {`${decodeHtmlEntities(author)}`}{index === authors.length - 1 ? '' : ', '}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            )}
          </div>
        </div>

        {/* Abstract */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Abstract
          </h3>
          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {abstract ? (
              <p className="whitespace-pre-wrap">{decodeHtmlEntities(abstract)}</p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            )}
          </div>
        </div>

        {/* Reference */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Reference
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
            {displayUrl}
          </p>
        </div>
      </div>
    </div>
  );
}
