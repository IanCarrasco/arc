// Test script to verify arXiv API route
// Run this in the browser console on your arc app

console.log('=== Testing arXiv API ===');

// Test a known valid arXiv ID
const testArxivId = '2301.12345'; // You can change this to any valid arXiv ID

console.log('Testing API with ID:', testArxivId);

// Test the API endpoint directly
fetch(`/api/arxiv?id=${testArxivId}`)
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    return response.json();
  })
  .then(data => {
    console.log('API Response:', data);

    if (data.error) {
      console.error('API Error:', data.error);
    } else {
      console.log('✅ API Success!');
      console.log('Title:', data.title);
      console.log('Authors:', data.authors);
      console.log('Abstract preview:', data.abstract?.substring(0, 200) + '...');
    }
  })
  .catch(error => {
    console.error('Fetch error:', error);
  });

// Also test with an invalid ID
setTimeout(() => {
  console.log('\n=== Testing with invalid ID ===');
  fetch('/api/arxiv?id=invalid')
    .then(response => response.json())
    .then(data => console.log('Invalid ID response:', data))
    .catch(error => console.error('Invalid ID error:', error));
}, 1000);

// Test with no ID
setTimeout(() => {
  console.log('\n=== Testing with no ID ===');
  fetch('/api/arxiv')
    .then(response => response.json())
    .then(data => console.log('No ID response:', data))
    .catch(error => console.error('No ID error:', error));
}, 2000);

console.log('=== Test initiated - check console for results ===');
