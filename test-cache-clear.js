// Test script to verify cache clearing functionality
// Run this in the browser console on your arc app

console.log('=== Cache Clear Test ===');

// First, let's see current cache stats
console.log('Before clearing:');
const beforeStats = CacheManager.getStats();
console.log('Cache stats:', beforeStats);

// Test clearing all cache
console.log('Clearing all cache...');
const clearResult = CacheManager.clearAll();
console.log('Clear result:', clearResult);

// Check cache stats after clearing
console.log('After clearing:');
const afterStats = CacheManager.getStats();
console.log('Cache stats:', afterStats);

// Verify localStorage is actually cleared
console.log('Checking localStorage directly:');
let cacheKeysFound = 0;
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.startsWith('paper-metadata-') || key.startsWith('chat-threads-') || key.startsWith('chat-history-'))) {
    console.log('Found cache key:', key);
    cacheKeysFound++;
  }
}
console.log('Total cache keys remaining:', cacheKeysFound);

console.log('=== Test Complete ===');

// Test the custom event
console.log('Testing custom event dispatch...');
const testEvent = new CustomEvent('cacheCleared', { detail: { papers: 5, chats: 3, total: 8 } });
window.dispatchEvent(testEvent);
console.log('Custom event dispatched');
