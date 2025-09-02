'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RecentPapers from './components/RecentPapers';
import { CacheManager } from './utils/cacheManager';

export default function Home() {
  const [url, setUrl] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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

  const handleClearCache = () => {
    try {
      const result = CacheManager.clearAll();
      console.log('Cache cleared successfully:', result);
      setShowClearConfirm(false);

      // Dispatch custom event to notify components that cache was cleared
      window.dispatchEvent(new CustomEvent('cacheCleared', { detail: result }));

      // Refresh the page to update all components
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      setShowClearConfirm(false);
    }
  };

  const getCacheStats = () => {
    return CacheManager.getStats();
  };

  return (
    <div className="min-h-screen overflow-y-hidden bg-white dark:bg-black flex flex-col items-center justify-center px-4">
      {/* Top Right Actions - Adjusted for header */}
      <div className="absolute top-20 right-4 flex items-center space-x-2">
        {/* Clear Cache Button */}
        <button
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          title="Clear cache"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Clear Cache</span>
        </button>

        {/* Settings Link */}
        <a
          href="/settings"
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </a>
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <h1 className="text-4xl font-light text-gray-900 dark:text-white text-center tracking-wide">
          ark
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

      {/* Recent Papers Section */}
      <RecentPapers />

      {/* Clear Cache Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Clear Cache
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This will remove all cached paper metadata and chat conversations. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCache}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
