import { repository } from '../db/repository.js';
import { generateEmbedding } from './embedding.js';
import { config } from '../config.js';
import { logger } from '../logger.js';

/**
 * Calculate Dot Product / Cosine Similarity between two normalized vectors
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

/**
 * Search stored vector chunks for top K relevant items matching query
 */
export async function searchVectorStore(queryText, topK = config.defaultTopK) {
  logger.info({ queryText, topK }, 'Executing vector similarity search');
  const startTime = Date.now();

  const queryEmbedding = await generateEmbedding(queryText);
  const allChunks = await repository.getAllChunks();

  if (allChunks.length === 0) {
    logger.info('Vector store is empty, returning zero results');
    return [];
  }

  const scoredChunks = allChunks.map(chunk => {
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    return {
      id: chunk.id,
      itemId: chunk.item_id,
      itemTitle: chunk.item_title,
      itemType: chunk.item_type,
      itemUrl: chunk.item_url,
      chunkIndex: chunk.chunk_index,
      snippet: chunk.text,
      similarity: parseFloat(similarity.toFixed(4))
    };
  });

  // Sort descending by similarity score
  scoredChunks.sort((a, b) => b.similarity - a.similarity);

  // Return top K chunks above threshold
  const topResults = scoredChunks
    .slice(0, topK);

  const durationMs = Date.now() - startTime;
  logger.info({ totalSearched: allChunks.length, returned: topResults.length, durationMs }, 'Vector search completed');

  return topResults;
}
