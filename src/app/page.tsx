'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [url, setUrl] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      // Extract arXiv reference number from URL
      const arxivRef = extractArxivReference(url.trim());
      if (arxivRef) {
        router.push(`/paper/${arxivRef}`);
      } else {
        // Fallback to original behavior if not a valid arXiv URL
        const encodedUrl = encodeURIComponent(url.trim());
        router.push(`/paper/${encodedUrl}`);
      }
    }
  };

  const extractArxivReference = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      
      // Check if it's an arXiv URL
      if (urlObj.hostname !== 'arxiv.org') {
        return null;
      }
      
      // Extract reference from different arXiv URL patterns
      const pathname = urlObj.pathname;
      
      // Pattern: /abs/1234.5678 or /abs/1234.5678v1
      const absMatch = pathname.match(/^\/abs\/(\d{4}\.\d{4,5}(?:v\d+)?)$/);
      if (absMatch) {
        return absMatch[1];
      }
      
      // Pattern: /pdf/1234.5678.pdf or /pdf/1234.5678v1.pdf
      const pdfMatch = pathname.match(/^\/pdf\/(\d{4}\.\d{4,5}(?:v\d+)?)\.pdf$/);
      if (pdfMatch) {
        return pdfMatch[1];
      }
      
      return null;
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen overflow-y-hidden bg-white dark:bg-black flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <h1 className="text-4xl font-light text-gray-900 dark:text-white text-center tracking-wide">
          arc
        </h1>
        
        {/* Input Box with Submit Button */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="url"
            placeholder="Enter arXiv URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-6 py-4 pr-16 text-lg border border-gray-500 dark:border-gray-500 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Submit URL"
            disabled={!url.trim()}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
