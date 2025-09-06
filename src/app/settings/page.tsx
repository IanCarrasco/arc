'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CacheManager } from '../utils/cacheManager';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const router = useRouter();

  // Load API key from localStorage on component mount
  useEffect(() => {
    try {
      const savedApiKey = localStorage.getItem('vercel-ai-gateway-key');
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }
    } catch (error) {
      console.error('Failed to load API key from localStorage:', error);
    }
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');
    setMessageType('');

    try {
      // Basic validation - check if it looks like a valid API key
      if (!apiKey.trim()) {
        throw new Error('API key cannot be empty');
      }

      if (apiKey.length < 10) {
        throw new Error('API key appears to be too short');
      }

      // Save to localStorage
      localStorage.setItem('vercel-ai-gateway-key', apiKey.trim());
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('apiKeyUpdated'));
      
      setMessage('API key saved successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save API key');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem('vercel-ai-gateway-key');
      setApiKey('');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('apiKeyUpdated'));
      
      setMessage('API key cleared successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage('Failed to clear API key');
      setMessageType('error');
    }
  };

  const handleClearCache = () => {
    try {
      const result = CacheManager.clearAll();
      console.log('Cache cleared successfully:', result);
      setShowClearConfirm(false);

      // Dispatch custom event to notify components that cache was cleared
      window.dispatchEvent(new CustomEvent('cacheCleared', { detail: result }));

      setMessage('Cache cleared successfully!');
      setMessageType('success');

      // Refresh the page to update all components
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      setShowClearConfirm(false);
      setMessage('Failed to clear cache');
      setMessageType('error');
    }
  };

  const getCacheStats = () => {
    return CacheManager.getStats();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black pt-16">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button 
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure your API keys and preferences
          </p>
        </div>

        {/* API Key Section */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Vercel AI Gateway Key
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Enter your Vercel AI Gateway API key to use your own quota and models. 
            This key will be stored locally in your browser and used for all AI requests.
          </p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Vercel AI Gateway API key"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-3 rounded-lg ${
                messageType === 'success' 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-900 dark:text-green-100' 
                  : 'bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-100'
              }`}>
                {message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={isLoading || !apiKey.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Key'}
              </button>
              <button
                onClick={handleClear}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
              >
                Clear Key
              </button>
            </div>
          </div>
        </div>

        {/* Cache Management Section */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Cache Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Clear cached paper metadata and chat conversations to free up storage space or resolve issues.
          </p>
          
          <div className="space-y-4">
            {/* Cache Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cache Statistics
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {(() => {
                  const stats = getCacheStats();
                  return (
                    <div className="space-y-1">
                      <div>Paper metadata: {stats.papers} entries</div>
                      <div>Chat threads: {stats.chats} entries</div>
                      <div>Total storage: {stats.total}</div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Clear Cache Button */}
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 border border-red-200 dark:border-red-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear All Cache</span>
            </button>
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            How to get your Vercel AI Gateway Key
          </h3>
          <div className="text-blue-800 dark:text-blue-200 space-y-2">
            <p>1. Go to <a href="https://vercel.com/ai" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Vercel AI</a></p>
            <p>2. Sign up or log in to your Vercel account</p>
            <p>3. Navigate to the AI Gateway section</p>
            <p>4. Create a new API key</p>
            <p>5. Copy the key and paste it above</p>
          </div>
        </div>
      </div>

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
