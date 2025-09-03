'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useChat } from "@ai-sdk/react";
import 'katex/dist/katex.min.css';

// @ts-ignore - react-markdown doesn't have proper TypeScript definitions
import ReactMarkdown from 'react-markdown';
// @ts-ignore - remark-gfm doesn't have proper TypeScript definitions
import remarkGfm from 'remark-gfm';
// @ts-ignore - remark-math doesn't have proper TypeScript definitions
import remarkMath from 'remark-math';
// @ts-ignore - rehype-katex doesn't have proper TypeScript definitions
import rehypeKatex from 'rehype-katex';

interface CapturedRegion {
  id: string;
  base64: string;
  timestamp: Date;
}

interface ChatPanelProps {
  paperUrl: string;
  displayUrl: string;
  onCaptureClick?: () => void;
  isSelectionActive?: boolean;
  capturedRegions?: CapturedRegion[];
  onCapturedRegion?: (region: CapturedRegion) => void;
  onRemoveCapturedRegion?: (id: string) => void;
  onClearAllCapturedRegions?: () => void;
}

// Utility function to render markdown with built-in LaTeX support
const renderMarkdown = (text: string) => {
  return (
    <ReactMarkdown
      remarkPlugins={[
        remarkGfm, 
        [remarkMath, { singleDollarTextMath: true }]
      ]}
      rehypePlugins={[[rehypeKatex, { 
        strict: false,
        throwOnError: false,
        errorColor: '#cc0000',
        macros: {
          "\\f": "#1f(#2)"
        }
      }]]}
      components={{
        // Custom styling for markdown elements
        h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-6 border-b border-gray-200 dark:border-gray-700 pb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 mt-5">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">{children}</h3>,
        h4: ({ children }) => <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2 mt-3">{children}</h4>,
        p: ({ children }) => <p className="text-gray-900 dark:text-white leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-outside text-gray-900 dark:text-white ml-6 my-3 space-y-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-outside text-gray-900 dark:text-white ml-6 my-3 space-y-2">{children}</ol>,
        li: ({ children }) => <li className="pl-3 leading-relaxed font-medium">{children}</li>,
        code: ({ children, className }) => {
          const isInline = !className;
          const isMath = className?.includes('language-math') || className?.includes('math');
          
          if (isMath) {
            // Let KaTeX handle math rendering - don't wrap in code styling
            return <span>{children}</span>;
          }
          
          if (isInline) {
            return <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
          }
          return (
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto scrollbar-track-hide mb-2">
              <code className="text-sm font-mono text-gray-900 dark:text-white">{children}</code>
            </pre>
          );
        },
        // Handle inline math elements specifically
        span: ({ children, className, ...props }: any) => {
          // Check if this is a KaTeX math element
          if (className?.includes('katex') || className?.includes('math') || props['data-math']) {
            return <span className={className} {...props}>{children}</span>;
          }
          return <span className={className} {...props}>{children}</span>;
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-2 text-gray-700 dark:text-gray-300">
            {children}
          </blockquote>
        ),
        strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-gray-900 dark:text-white">{children}</em>,
        a: ({ children, href }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto scrollbar-track-hide mb-2">
            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 bg-gray-100 dark:bg-gray-700 font-semibold text-left">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
            {children}
          </td>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
};

interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  lastMessageAt: Date;
}

// Memoized input component to prevent re-renders
const ChatInput = React.memo(({ 
  onSubmit, 
  disabled, 
  placeholder,
  onStop,
  isStreaming,
  onCaptureClick,
  isSelectionActive
}: { 
  onSubmit: (input: string) => void;
  disabled: boolean;
  placeholder: string;
  onStop: () => void;
  isStreaming: boolean;
  onCaptureClick?: () => void;
  isSelectionActive?: boolean;
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim());
      setInput('');
    }
  }, [input, onSubmit]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex-shrink-0">
      <div className="flex items-center space-x-2">
        {/* Capture Button */}
        {onCaptureClick && !isSelectionActive && (
          <button
            type="button"
            onClick={onCaptureClick}
            disabled={disabled}
            className="flex-shrink-0 px-3 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-sm rounded-xl transition-colors duration-200 shadow-sm"
            title="Capture region from PDF"
          >
            📷
          </button>
        )}
        
        {/* Cancel Button - shown when selection is active */}
        {isSelectionActive && (
          <button
            type="button"
            onClick={onCaptureClick}
            disabled={disabled}
            className="flex-shrink-0 px-3 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white text-sm rounded-xl transition-colors duration-200 shadow-sm"
            title="Cancel selection"
          >
            ✕
          </button>
        )}
        
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={isSelectionActive ? "Select a region to capture..." : placeholder}
            disabled={disabled || isSelectionActive}
            className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors duration-200"
              aria-label="Stop streaming"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 6h12v12H6z"
                />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={disabled || !input.trim() || isSelectionActive}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white transition-colors duration-200"
              aria-label="Send message"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          )}
        </form>
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

// Typing indicator animation component
const TypingIndicator = React.memo(() => {
  return (
    <div className="typing-indicator">
      <div className="typing-dot"></div>
      <div className="typing-dot"></div>
      <div className="typing-dot"></div>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

// Memoized message component to prevent unnecessary re-renders
const ChatMessage = React.memo(({ message, showRaw }: { message: any; showRaw: boolean }) => {
  // Calculate message content length for dynamic width
  const messageText = message.parts?.find((part: any) => part.type === 'text')?.text || '';
  const contentLength = messageText.length;
  
  // Determine width class based on content length
  const getWidthClass = (length: number) => {
    if (length < 50) return 'max-w-xs';
    if (length < 100) return 'max-w-sm';
    if (length < 200) return 'max-w-md';
    if (length < 400) return 'max-w-lg';
    if (length < 600) return 'max-w-xl';
    return 'max-w-2xl';
  };

  return (
    <div className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className={`rounded-lg px-3 py-2 ${getWidthClass(contentLength)} overflow-hidden ${message.role === 'user'
        ? 'bg-blue-500 text-white'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
        }`}>
        <div className="text-sm break-words overflow-x-auto chat-message">
          {message.parts?.map((part: any, index: number) => {
            switch (part.type) {
              case 'text':
                return (
                  <div key={index}>
                    {showRaw ? (
                      <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-200 dark:bg-gray-700 p-2 rounded">
                        {part.text}
                      </pre>
                    ) : (
                      renderMarkdown(part.text)
                    )}
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default function ChatPanel({ paperUrl, onCaptureClick, isSelectionActive, capturedRegions = [], onCapturedRegion, onRemoveCapturedRegion, onClearAllCapturedRegions }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialRender = useRef(true);
  const prevStatusRef = useRef<string>('');
  
  // Thread management state
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [showNewThreadInput, setShowNewThreadInput] = useState(false);
  
  // Raw response toggle state
  const [showRawResponse, setShowRawResponse] = useState(false);
  
  // Image modal state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Remove captured region
  const handleRemoveCapturedRegion = useCallback((id: string) => {
    onRemoveCapturedRegion?.(id);
  }, [onRemoveCapturedRegion]);

  // Handle image click to show enlarged view
  const handleImageClick = useCallback((base64: string) => {
    setSelectedImage(base64);
  }, []);

  // Close image modal
  const closeImageModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedImage) {
        closeImageModal();
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedImage, closeImageModal]);

  // Create a unique storage key based on the paper URL
  const storageKey = React.useMemo(() => 
    `chat-history-${btoa(paperUrl).replace(/[^a-zA-Z0-9]/g, '')}`, 
    [paperUrl]
  );
  const threadsStorageKey = React.useMemo(() => 
    `chat-threads-${btoa(paperUrl).replace(/[^a-zA-Z0-9]/g, '')}`, 
    [paperUrl]
  );

  const {
    messages,
    status,
    sendMessage,
    setMessages,
    stop,
  } = useChat();

  const createDefaultThread = React.useCallback(() => {
    const defaultThread: Thread = {
      id: 'default',
      title: 'Main Thread',
      createdAt: new Date(),
      lastMessageAt: new Date(),
    };
    
    setThreads([defaultThread]);
    setActiveThreadId(defaultThread.id);
    
    try {
      localStorage.setItem(threadsStorageKey, JSON.stringify([defaultThread]));
    } catch (error) {
      console.error('Failed to save default thread to localStorage:', error);
    }
  }, [threadsStorageKey]);

  // Load threads from localStorage on component mount
  useEffect(() => {
    try {
      const savedThreads = localStorage.getItem(threadsStorageKey);
      if (savedThreads) {
        const parsedThreads = JSON.parse(savedThreads);
        if (Array.isArray(parsedThreads) && parsedThreads.length > 0) {
          setThreads(parsedThreads);
          // Set the first thread as active if no active thread is set
          setActiveThreadId(prevActiveThreadId => {
            if (!prevActiveThreadId && parsedThreads.length > 0) {
              return parsedThreads[0].id;
            }
            return prevActiveThreadId;
          });
        } else {
          // Create a default thread if none exist
          createDefaultThread();
        }
      } else {
        // Create a default thread if none exist
        createDefaultThread();
      }
    } catch (error) {
      console.error('Failed to load threads from localStorage:', error);
      // Create a default thread on error
      createDefaultThread();
    }
  }, [threadsStorageKey, createDefaultThread]);

  // Load messages for active thread
  useEffect(() => {
    if (activeThreadId) {
      try {
        const threadStorageKey = `${storageKey}-thread-${activeThreadId}`;
        const savedMessages = localStorage.getItem(threadStorageKey);
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          if (Array.isArray(parsedMessages)) {
            setMessages(parsedMessages);
          }
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Failed to load thread messages from localStorage:', error);
      }
    }
  }, [activeThreadId, storageKey]);

  // Save messages to localStorage whenever messages change (but not during streaming)
  useEffect(() => {
    if (activeThreadId && status !== 'streaming') {
      try {
        const threadStorageKey = `${storageKey}-thread-${activeThreadId}`;
        localStorage.setItem(threadStorageKey, JSON.stringify(messages));

        // Update thread's last message time
        if (messages.length > 0) {
          setThreads(prevThreads => {
            const updatedThreads = prevThreads.map(thread =>
              thread.id === activeThreadId
                ? { ...thread, lastMessageAt: new Date() }
                : thread
            );
            localStorage.setItem(threadsStorageKey, JSON.stringify(updatedThreads));
            return updatedThreads;
          });
        }
      } catch (error) {
        console.error('Failed to save thread messages to localStorage:', error);
      }
    }
  }, [messages, activeThreadId, storageKey, threadsStorageKey, status]);

  // Auto-scroll to bottom when new messages arrive (but not during streaming)
  useEffect(() => {
    // Skip auto-scroll on initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    // Only auto-scroll when not streaming to avoid infinite loops
    if (messages.length > 0 && status !== 'streaming') {
      // Use a small delay to ensure DOM is updated
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          // Use instant scroll instead of smooth scroll
          container.scrollTop = container.scrollHeight;
        }
      }, 150);
    }
  }, [messages.length, status]); // Use messages.length instead of messages array

  // Handle streaming content updates with interval
  useEffect(() => {
    if (status === 'streaming') {
      const interval = setInterval(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [status]); // Only depend on status, not messages

  // Save messages to localStorage after streaming completes
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // If we just finished streaming, save the final messages
    if (prevStatus === 'streaming' && status !== 'streaming' && activeThreadId) {
      try {
        const threadStorageKey = `${storageKey}-thread-${activeThreadId}`;
        localStorage.setItem(threadStorageKey, JSON.stringify(messages));

        // Update thread's last message time
        if (messages.length > 0) {
          setThreads(prevThreads => {
            const updatedThreads = prevThreads.map(thread =>
              thread.id === activeThreadId
                ? { ...thread, lastMessageAt: new Date() }
                : thread
            );
            localStorage.setItem(threadsStorageKey, JSON.stringify(updatedThreads));
            return updatedThreads;
          });
        }
      } catch (error) {
        console.error('Failed to save final messages to localStorage:', error);
      }
    }
  }, [status, activeThreadId, storageKey, threadsStorageKey, messages]);

  const handleSubmit = useCallback(async (inputText: string) => {
    // Get API key from localStorage
    const apiKey = localStorage.getItem('vercel-ai-gateway-key');
    
    await sendMessage({
      text: inputText,
    },
      {
        body: {
          input_file: paperUrl,
          apiKey: apiKey || undefined,
        }
      });
  }, [sendMessage, paperUrl]);

  const handleClearMessages = useCallback(() => {
    setMessages([]);
    // Also clear from localStorage for current thread
    if (activeThreadId) {
      try {
        const threadStorageKey = `${storageKey}-thread-${activeThreadId}`;
        localStorage.removeItem(threadStorageKey);
      } catch (error) {
        console.error('Failed to clear thread messages from localStorage:', error);
      }
    }
  }, [activeThreadId, storageKey, setMessages]);

  const createNewThread = useCallback(() => {
    const newThread: Thread = {
      id: Date.now().toString(),
      title: newThreadTitle.trim() || `Thread ${threads.length + 1}`,
      createdAt: new Date(),
      lastMessageAt: new Date(),
    };
    
    const updatedThreads = [...threads, newThread];
    
    setThreads(updatedThreads);
    // Automatically switch to the new thread
    setActiveThreadId(newThread.id);
    setNewThreadTitle('');
    setShowNewThreadInput(false);
    // Clear messages for the new thread (it will be empty)
    setMessages([]);
    
    try {
      localStorage.setItem(threadsStorageKey, JSON.stringify(updatedThreads));
    } catch (error) {
      console.error('Failed to save threads to localStorage:', error);
    }
  }, [newThreadTitle, threads, threadsStorageKey, setMessages]);

  const switchToThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
    // Instantly scroll to bottom when switching threads
    setTimeout(() => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }, []);

  const deleteThread = useCallback((threadId: string) => {
    // Don't allow deleting the only thread
    if (threads.length <= 1) {
      return;
    }
    
    const updatedThreads = threads.filter(thread => thread.id !== threadId);
    setThreads(updatedThreads);
    
    // If we're deleting the active thread, switch to another one
    if (activeThreadId === threadId) {
      if (updatedThreads.length > 0) {
        setActiveThreadId(updatedThreads[0].id);
      } else {
        setActiveThreadId('');
        setMessages([]);
      }
    }
    
    // Remove thread messages from localStorage
    try {
      const threadStorageKey = `${storageKey}-thread-${threadId}`;
      localStorage.removeItem(threadStorageKey);
      localStorage.setItem(threadsStorageKey, JSON.stringify(updatedThreads));
    } catch (error) {
      console.error('Failed to delete thread from localStorage:', error);
    }
  }, [threads, activeThreadId, storageKey, threadsStorageKey, setMessages]);

  const getActiveThread = useCallback(() => {
    return threads.find(thread => thread.id === activeThreadId);
  }, [threads, activeThreadId]);

  // Helper function to check if we should show typing indicator
  const shouldShowTypingIndicator = useCallback(() => {
    if (status !== 'streaming' || messages.length === 0) {
      return false;
    }

    const lastMessage = messages[messages.length - 1];
    
    // Show typing indicator if last message is from user
    if (lastMessage?.role === 'user') {
      return true;
    }
    
    // Show typing indicator if last message is from assistant but has no content
    if (lastMessage?.role === 'assistant') {
      return !lastMessage.parts || 
             lastMessage.parts.length === 0 || 
             !lastMessage.parts.some((part: any) => part.type === 'text' && part.text?.trim());
    }
    
    return false;
  }, [status, messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        {/* Tab Bar */}
        <div className="flex items-center border-b border-gray-200 dark:border-gray-800">
          <div className="flex-1 flex overflow-x-auto scrollbar-track-hide">
            {threads.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                No threads yet. Click the + button to create one.
              </div>
            ) : (
              threads.map((thread, index) => (
                <div
                  key={thread.id}
                  className={`flex items-center space-x-2 px-4 py-3 border-r border-gray-200 dark:border-gray-800 cursor-pointer transition-colors min-w-0 ${
                    thread.id === activeThreadId
                      ? 'bg-white dark:bg-black border-b-2 border-green-500'
                      : 'bg-gray-50 dark:bg-black hover:bg-gray-800 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => switchToThread(thread.id)}
                >
                  <span className={`text-sm font-medium truncate max-w-32 ${
                    thread.id === activeThreadId
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {thread.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteThread(thread.id);
                    }}
                    disabled={threads.length <= 1}
                    className={`ml-1 p-1 transition-colors rounded ${
                      threads.length <= 1 
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                        : 'text-gray-400 hover:text-red-500'
                    }`}
                    title={threads.length <= 1 ? "Cannot delete the only thread" : "Close thread"}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
            
            {/* New Tab Button */}
            <button
              onClick={() => {
                setShowNewThreadInput(true);
                setNewThreadTitle('');
              }}
              className="flex items-center space-x-2 px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="New thread"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center space-x-2 px-4 py-3 border-l border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setShowRawResponse(!showRawResponse)}
              className={`flex items-center space-x-1 px-3 py-1.5 text-sm rounded-lg transition-colors duration-200 ${
                showRawResponse
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={showRawResponse ? "Show formatted response" : "Show raw response"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>{showRawResponse ? 'Formatted' : 'Raw'}</span>
            </button>
            {messages.length > 0 && (
              <button
                onClick={handleClearMessages}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                title="Clear conversation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* New Thread Input */}
        {showNewThreadInput && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                placeholder="New thread title..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && createNewThread()}
                autoFocus
              />
              <div className="flex space-x-2 sm:space-x-2">
                <button
                  onClick={createNewThread}
                  className="flex-1 sm:flex-none px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors duration-200"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewThreadInput(false);
                    setNewThreadTitle('');
                  }}
                  className="flex-1 sm:flex-none px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 px-4 py-4 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-track-hide">
        {/* Error Message */}
        {status === 'error' && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="bg-red-100 dark:bg-red-900/20 rounded-lg px-3 py-2 flex items-center w-full max-w-2xl">
              <p className="text-sm text-red-900 dark:text-red-100">
                Error: {status === 'error' ? 'Something went wrong. Please try again.' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} showRaw={showRawResponse} />
        ))}

        {/* Loading state when streaming but no assistant message yet or assistant message is empty */}
        {shouldShowTypingIndicator() && (
          <div className="flex items-start space-x-3">
            <div className="rounded-lg px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white max-w-xs min-w-[60px]">
              <TypingIndicator />
            </div>
          </div>
        )}

        {/* Scroll anchor - positioned at the end of all messages */}
        <div ref={messagesEndRef} />

        {/* Example Questions */}
        {messages.length === 0 && (
          <div className="space-y-2">
            <button
              onClick={() => handleSubmit('What is the main contribution of this paper?')}
              className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              • What is the main contribution of this paper?
            </button>
            <button
              onClick={() => handleSubmit('Can you summarize the methodology?')}
              className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              • Can you summarize the methodology?
            </button>
            <button
              onClick={() => handleSubmit('What are the key results?')}
              className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              • What are the key results?
            </button>
            <button
              onClick={() => handleSubmit('Explain the mathematical formulas and equations used')}
              className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              • Explain the mathematical formulas and equations used
            </button>
            <button
              onClick={() => handleSubmit('Create a summary with key findings and methodology')}
              className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              • Create a summary with key findings and methodology
            </button>
          </div>
        )}
      </div>

      {/* Captured Regions Section */}
      {capturedRegions.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Captured Regions ({capturedRegions.length})
            </h3>
            <button
              onClick={onClearAllCapturedRegions}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-track-hide">
            {capturedRegions.map((region) => (
              <div key={region.id} className="relative flex-shrink-0">
                <img
                  src={region.base64}
                  alt={`Captured region ${region.id}`}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleImageClick(region.base64)}
                  title="Click to enlarge"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCapturedRegion(region.id);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  title="Remove region"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <ChatInput 
        onSubmit={handleSubmit}
        disabled={status === 'streaming'}
        placeholder="Ask about this paper..."
        onStop={stop}
        isStreaming={status === 'streaming'}
        onCaptureClick={onCaptureClick}
        isSelectionActive={isSelectionActive}
      />

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <img
              src={selectedImage}
              alt="Enlarged captured region"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-all"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
