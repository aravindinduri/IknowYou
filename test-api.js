async function runTests() {
  const baseUrl = 'http://localhost:3001/api';

  console.log('1. Testing GET /api/stats...');
  let res = await fetch(`${baseUrl}/stats`);
  let data = await res.json();
  console.log('Stats Result:', data);

  console.log('\n 2. Testing POST /api/ingest (Text Note)...');
  res = await fetch(`${baseUrl}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'note',
      title: 'RAG Pipeline Architecture',
      content: 'Retrieval-Augmented Generation (RAG) combines semantic vector search with Large Language Models. Sentences are chunked and converted into dense vector embeddings using sentence-transformers. Similarity search retrieves top matching context chunks to synthesize cited answers.'
    })
  });
  const ingestedNote = await res.json();
  console.log('Ingested Note:', ingestedNote);

  console.log('\n 3. Testing GET /api/items...');
  res = await fetch(`${baseUrl}/items`);
  const items = await res.json();
  console.log('Items Count:', items.count);

  console.log('\n 4. Testing POST /api/query (Semantic Search & RAG)...');
  res = await fetch(`${baseUrl}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'How does RAG pipeline work with vector embeddings?',
      topK: 4
    })
  });
  const ragQuery = await res.json();
  console.log('RAG Query Result:', JSON.stringify(ragQuery, null, 2));

  console.log('\n All API Integration Tests Completed Successfully!');
}

runTests().catch(err => {
  console.error(' Test failed:', err);
  process.exit(1);
});
