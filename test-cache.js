// Test script to verify paper metadata caching
// Run this in the browser console on your arc app

// Test the PaperMetadataStorage utility
console.log('=== Paper Metadata Cache Test ===');

// Test storing metadata
const testMetadata = {
  title: 'Test Paper Title',
  authors: ['Author One', 'Author Two'],
  abstract: 'This is a test abstract for caching functionality.',
  url: 'https://arxiv.org/pdf/1234.5678',
  displayUrl: 'arXiv:1234.5678',
  fetchedAt: new Date()
};

console.log('Storing test metadata...');
PaperMetadataStorage.store(testMetadata);

// Test retrieving metadata
console.log('Retrieving test metadata...');
const retrieved = PaperMetadataStorage.get(testMetadata.url);
console.log('Retrieved:', retrieved);

// Test cache validation
console.log('Testing cache validity...');
const isValid = PaperMetadataStorage.hasValidCache(testMetadata.url);
console.log('Cache is valid:', isValid);

// Test getting all recent papers
console.log('Getting all recent papers...');
const allRecent = PaperMetadataStorage.getAllRecent();
console.log('All recent papers:', allRecent);

// Check localStorage directly
console.log('Direct localStorage check:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('paper-metadata-')) {
    console.log('Found key:', key);
    console.log('Value:', localStorage.getItem(key));
  }
}

console.log('=== Test Complete ===');
