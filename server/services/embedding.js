import { HfInference } from '@huggingface/inference';
import { config } from '../config.js';
import { logger } from '../logger.js';

const getEmbeddingModel = () => config.hfEmbeddingModel || 'sentence-transformers/all-MiniLM-L6-v2';
let hfClient = null;

function getHfClient() {
  if (!hfClient) {
    hfClient = new HfInference(config.hfToken || undefined);
  }
  return hfClient;
}

/**
 * Generate 384-dimensional normalized embedding vector using Hugging Face Inference API,
 * with a deterministic fallback vectorizer if HF endpoint is unreachable or lacks token.
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return new Array(384).fill(0);
  }

  const cleanText = text.trim();

  // Try Hugging Face Inference API
  try {
    const client = getHfClient();
    const modelName = getEmbeddingModel();
    logger.debug({ textLength: cleanText.length, model: modelName }, 'Requesting embedding from Hugging Face Inference API');

    const result = await client.featureExtraction({
      model: modelName,
      inputs: cleanText,
      provider: 'hf-inference'
    });

    if (Array.isArray(result)) {
      // Flatten if nested
      let vector = result;
      if (Array.isArray(vector[0])) {
        // Mean pooling over token embeddings if 2D array returned
        const numTokens = vector.length;
        const dim = vector[0].length;
        const pooled = new Array(dim).fill(0);
        for (let t = 0; t < numTokens; t++) {
          for (let d = 0; d < dim; d++) {
            pooled[d] += vector[t][d];
          }
        }
        vector = pooled.map(val => val / numTokens);
      }
      if (vector.length === 384) {
        return normalizeVector(vector);
      }
    }
  } catch (err) {
    logger.warn({ error: err.message }, 'Hugging Face Inference API unavailable or failed, using fallback vectorizer');
  }

  // Fallback: Deterministic 384-dimensional subword/n-gram hashing vectorizer
  return generateFallbackEmbedding(cleanText);
}

/**
 * Fast subword/n-gram hashing vectorizer that projects text onto 384-dimensional space
 */
function generateFallbackEmbedding(text, dimensions = 384) {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const words = normalized.split(/\s+/).filter(Boolean);

  // Word-level and character n-gram hashing
  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Hash word
    let hash = 5381;
    for (let c = 0; c < word.length; c++) {
      hash = ((hash << 5) + hash) + word.charCodeAt(c);
      hash = hash & hash; // Convert to 32bit integer
    }

    const idx = Math.abs(hash) % dimensions;
    const weight = 1.0 + (1.0 / (i + 1)); // Position weighting
    vector[idx] += weight;

    // Character tri-grams
    if (word.length >= 3) {
      for (let j = 0; j <= word.length - 3; j++) {
        const tri = word.slice(j, j + 3);
        let triHash = 0;
        for (let k = 0; k < tri.length; k++) {
          triHash = ((triHash << 5) - triHash) + tri.charCodeAt(k);
        }
        const triIdx = Math.abs(triHash) % dimensions;
        vector[triIdx] += 0.4;
      }
    }
  }

  return normalizeVector(vector);
}

function normalizeVector(vector) {
  let norm = 0;
  for (let i = 0; i < vector.length; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm === 0) return vector;

  return vector.map(v => v / norm);
}
