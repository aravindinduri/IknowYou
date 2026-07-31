import { config } from '../config.js';
import { logger } from '../logger.js';

/**
 * Sentence-aware sliding window text chunker
 */
export function chunkText(text, options = {}) {
  const targetSize = options.targetChunkSize || config.targetChunkSize || 450;
  const overlap = options.chunkOverlap || config.chunkOverlap || 80;

  if (!text || typeof text !== 'string') return [];
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length === 0) return [];

  // Short content fits in a single chunk
  if (normalized.length <= targetSize) {
    return [{
      chunkIndex: 0,
      text: normalized,
      charCount: normalized.length
    }];
  }

  // Split text into sentences
  const sentenceRegex = /[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g;
  const sentences = normalized.match(sentenceRegex) || [normalized];

  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;

    if ((currentChunk + ' ' + sentence).length > targetSize && currentChunk.length > 0) {
      chunks.push({
        chunkIndex: chunkIndex++,
        text: currentChunk.trim(),
        charCount: currentChunk.trim().length
      });

      // Calculate overlap from end of current chunk
      let overlapText = '';
      if (overlap > 0 && currentChunk.length > overlap) {
        const words = currentChunk.split(' ');
        let accumulated = '';
        for (let w = words.length - 1; w >= 0; w--) {
          accumulated = words[w] + (accumulated ? ' ' + accumulated : '');
          if (accumulated.length >= overlap) break;
        }
        overlapText = accumulated;
      }

      currentChunk = overlapText ? overlapText + ' ' + sentence : sentence;
    } else {
      currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      chunkIndex: chunkIndex++,
      text: currentChunk.trim(),
      charCount: currentChunk.trim().length
    });
  }

  logger.debug({ totalTextLen: text.length, chunkCount: chunks.length }, 'Text chunked successfully');
  return chunks;
}
