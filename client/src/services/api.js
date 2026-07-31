/**
 * Client API service for communicating with backend.
 * Safe JSON parsing — handles empty or non-JSON server responses.
 */

async function safeJson(res) {
  const text = await res.text();
  if (!text || !text.trim()) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    // Server returned non-JSON body (HTML error page, network issue, etc.)
    throw new Error(`Server returned a non-JSON response (HTTP ${res.status}). Check that the backend server is running on port 3001.`);
  }
}

export async function ingestItem({ type, content, title }) {
  let res;
  try {
    res = await fetch('/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content, title: title || undefined })
    });
  } catch (err) {
    throw new Error('Could not reach the backend server. Is it running on port 3001?');
  }

  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data?.error || `Ingestion failed (HTTP ${res.status})`);
  }
  return data;
}

export async function getItems({ type, search } = {}) {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (search) params.append('search', search);

  let res;
  try {
    res = await fetch(`/api/items?${params.toString()}`);
  } catch {
    throw new Error('Could not reach the backend server. Is it running on port 3001?');
  }

  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data?.error || `Failed to fetch items (HTTP ${res.status})`);
  }
  return data;
}

export async function deleteItem(id) {
  let res;
  try {
    res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
  } catch {
    throw new Error('Could not reach the backend server. Is it running on port 3001?');
  }

  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data?.error || `Failed to delete item (HTTP ${res.status})`);
  }
  return data;
}

export async function queryRAG({ question, topK = 4 }) {
  let res;
  try {
    res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, topK })
    });
  } catch {
    throw new Error('Could not reach the backend server. Is it running on port 3001?');
  }

  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data?.error || `Query failed (HTTP ${res.status})`);
  }
  return data;
}

export async function getStats() {
  let res;
  try {
    res = await fetch('/api/stats');
  } catch {
    return null; // Stats are non-critical, fail silently
  }

  const data = await safeJson(res);
  if (!res.ok) return null;
  return data;
}
