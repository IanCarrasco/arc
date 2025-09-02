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
        h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 dark:text-white">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-semibold text-gray-900 dark:text-white">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{children}</h3>,
        p: ({ children }) => <p className="mb-2 text-gray-900 dark:text-white">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside text-gray-900 dark:text-white">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside text-gray-900 dark:text-white">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
          }
          return (
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto mb-2">
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
          <div className="overflow-x-auto mb-2">
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

export default function ChatPanel({ paperUrl }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  const {
    messages,
    status,
    sendMessage,
    setMessages,
  } = useChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      await sendMessage({
        text: input,
      },
        {
          body: {
            input_file: paperUrl,
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
  };

  return (
    <div className="flex flex-col h-full">
      {/* Clear Button */}
      {messages.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex justify-end">
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
          </div>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {/* Welcome Message */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 flex items-center w-full max-w-2xl">
            <div className="text-sm text-gray-900 dark:text-white">
              {renderMarkdown("Hi! I can help you understand this paper. What would you like to know?")}
            </div>
          </div>
        </div>

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
            <div key={message.id} className={`flex items-center space-x-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              )}
              <div className={`rounded-lg px-3 py-2 flex items-center ${getWidthClass(contentLength)} ${message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}>
              <div className="text-sm">
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
            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
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

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
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
