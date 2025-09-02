'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PaperMetadataStorage, PaperMetadata } from '../utils/paperMetadata';

interface RecentPaper {
  metadata: PaperMetadata;
  threadCount: number;
  lastActivity: Date;
}

export default function RecentPapers() {
  const [recentPapers, setRecentPapers] = useState<RecentPaper[]>([]);
  const router = useRouter();

  const loadRecentPapers = React.useCallback(() => {
    try {
      // Get all recent paper metadata
      const allMetadata = PaperMetadataStorage.getAllRecent();

      // For each paper, get thread count and last activity
      const papers: RecentPaper[] = allMetadata.map(metadata => {
        let threadCount = 0;
        let lastActivity = metadata.fetchedAt;

        try {
          // Get thread data to find actual last activity and thread count
          const threadsKey = `chat-threads-${btoa(metadata.url).replace(/[^a-zA-Z0-9]/g, '')}`;
          const threadsData = localStorage.getItem(threadsKey);

          if (threadsData) {
            const threads = JSON.parse(threadsData);
            threadCount = threads.length;

            if (threads.length > 0) {
              // Find the most recent thread activity
              const threadLastActivity = threads.reduce((latest: Date, thread: any) => {
                const threadDate = new Date(thread.lastMessageAt);
                return threadDate > latest ? threadDate : latest;
              }, new Date(0));

              if (threadLastActivity > lastActivity) {
                lastActivity = threadLastActivity;
              }
            }
          }
        } catch (error) {
          console.warn('Failed to load thread data for paper:', metadata.url, error);
        }

        return {
          metadata,
          threadCount,
          lastActivity
        };
      });

      // Sort by last activity (most recent first)
      papers.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

      // Limit to 5 most recent papers
      setRecentPapers(papers.slice(0, 5));
    } catch (error) {
      console.error('Failed to load recent papers:', error);
    }
  }, []);

  useEffect(() => {
    loadRecentPapers();

    // Listen for storage changes to update the list
    const handleStorageChange = () => loadRecentPapers();
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom cache clear event
    const handleCacheClear = () => {
      console.log('Cache cleared, refreshing recent papers');
      setRecentPapers([]);
    };
    window.addEventListener('cacheCleared', handleCacheClear);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cacheCleared', handleCacheClear);
    };
  }, [loadRecentPapers]);

  const getDisplayTitle = (metadata: PaperMetadata): string => {
    // Use the actual title if available, otherwise fall back to display URL
    return metadata.title || metadata.displayUrl;
  };

  const getAuthorString = (authors: string[]): string => {
    if (authors.length === 0) return '';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
    return `${authors[0]} et al.`;
  };

  const formatLastActivity = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handlePaperClick = (metadata: PaperMetadata) => {
    // Use arXiv ID if available, otherwise use the original URL logic
    if (metadata.arxivId) {
      router.push(`/paper/${metadata.arxivId}`);
    } else {
      const encodedUrl = encodeURIComponent(metadata.url);
      router.push(`/paper/${encodedUrl}`);
    }
  };

  if (recentPapers.length === 0) {
    return null; // Don't show anything if no recent papers
  }

  return (
    <div className="w-full max-w-md mt-12">
      <h2 className="text-xl font-light text-gray-900 dark:text-white text-center mb-6">
        Recent Papers
      </h2>

      <div className="space-y-3">
        {recentPapers.map((paper, index) => (
          <div
            key={paper.metadata.url}
            onClick={() => handlePaperClick(paper.metadata)}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-gray-700 dark:group-hover:text-gray-300">
                  {getDisplayTitle(paper.metadata)}
                </h3>
                {paper.metadata.authors.length > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                    {getAuthorString(paper.metadata.authors)}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {paper.threadCount} thread{paper.threadCount !== 1 ? 's' : ''} • {formatLastActivity(paper.lastActivity)}
                </p>
              </div>
              <svg
                className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 ml-2 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
