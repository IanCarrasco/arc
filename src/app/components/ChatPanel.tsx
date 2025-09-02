'use client';

import React, { useState, useRef, useEffect } from 'react';
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

interface ChatPanelProps {
  paperUrl: string;
  displayUrl: string;
}

// Utility function to render markdown with built-in LaTeX support
const renderMarkdown = (text: string) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
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
          if (isInline) {
            return <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
          }
          return (
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto scrollbar-track-hide mb-2">
              <code className="text-sm font-mono text-gray-900 dark:text-white">{children}</code>
            </pre>
          );
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

export default function ChatPanel({ paperUrl }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const isInitialRender = useRef(true);
  const prevStatusRef = useRef<string>('');
  
  // Thread management state
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [showNewThreadInput, setShowNewThreadInput] = useState(false);

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
          // Try multiple scrolling approaches for better reliability
          try {
            // First try smooth scrolling
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'smooth'
            });
          } catch (error) {
            // Fallback to instant scroll
            container.scrollTop = container.scrollHeight;
          }
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      // Get API key from localStorage
      const apiKey = localStorage.getItem('vercel-ai-gateway-key');
      
      await sendMessage({
        text: input,
      },
        {
          body: {
            input_file: paperUrl,
            apiKey: apiKey || undefined,
          }
        });
      setInput('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleClearMessages = () => {
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
  };

  const createNewThread = () => {
    const newThread: Thread = {
      id: Date.now().toString(),
      title: newThreadTitle.trim() || `Thread ${threads.length + 1}`,
      createdAt: new Date(),
      lastMessageAt: new Date(),
    };
    
    const updatedThreads = [...threads, newThread];
    
    setThreads(updatedThreads);
    setActiveThreadId(newThread.id);
    setNewThreadTitle('');
    setShowNewThreadInput(false);
    setMessages([]);
    
    try {
      localStorage.setItem(threadsStorageKey, JSON.stringify(updatedThreads));
    } catch (error) {
      console.error('Failed to save threads to localStorage:', error);
    }
  };

  const switchToThread = (threadId: string) => {
    setActiveThreadId(threadId);
  };

  const deleteThread = (threadId: string) => {
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
  };

  const getActiveThread = () => {
    return threads.find(thread => thread.id === activeThreadId);
  };

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
                      : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
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
                    className="ml-1 p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
                    title="Close thread"
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
        {messages.map((message) => {
          // Calculate message content length for dynamic width
          const messageText = message.parts?.find(part => part.type === 'text')?.text || '';
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
            <div key={message.id} className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`rounded-lg px-3 py-2 ${getWidthClass(contentLength)} overflow-hidden ${message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}>
                <div className="text-sm break-words">
                  {message.parts?.map((part, index) => {
                    switch (part.type) {
                      case 'text':
                        return <div key={index}>{renderMarkdown(part.text)}</div>;
                      default:
                        return null;
                    }
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {status === 'streaming' && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 flex items-center w-full max-w-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor - positioned at the end of all messages */}
        <div ref={messagesEndRef} />

        {/* Example Questions */}
        {messages.length === 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setInput('What is the main contribution of this paper?')}
              className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              • What is the main contribution of this paper?
            </button>
            <button
              onClick={() => setInput('Can you summarize the methodology?')}
              className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              • Can you summarize the methodology?
            </button>
            <button
              onClick={() => setInput('What are the key results?')}
              className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              • What are the key results?
            </button>
            <button
              onClick={() => setInput('Explain the mathematical formulas and equations used')}
              className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              • Explain the mathematical formulas and equations used
            </button>
            <button
              onClick={() => setInput('Create a summary with key findings and methodology')}
              className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              • Create a summary with key findings and methodology
            </button>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about this paper..."
            disabled={status === 'streaming'}
            className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'streaming' || !input.trim()}
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
        </form>
      </div>
    </div>
  );
}
