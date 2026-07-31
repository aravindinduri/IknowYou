import express from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { repository } from '../db/repository.js';
import { fetchAndParseUrl } from '../services/scraper.js';
import { chunkText } from '../services/chunker.js';
import { generateEmbedding } from '../services/embedding.js';
import { answerQuestion } from '../services/rag.js';
import { logger } from '../logger.js';

const router = express.Router();

// Input Schemas
const IngestSchema = z.object({
  type: z.enum(['note', 'url']),
  content: z.string().trim().min(3, 'Content must be at least 3 characters'),
  title: z.string().trim().optional()
});

const QuerySchema = z.object({
  question: z.string().trim().min(2, 'Question must be at least 2 characters'),
  topK: z.number().int().min(1).max(10).optional().default(4)
});

/**
 * POST /api/ingest
 * Ingest plain text note or fetch & ingest web URL
 */
router.post('/ingest', async (req, res, next) => {
  const startTime = Date.now();
  try {
    const body = IngestSchema.parse(req.body);
    const itemId = `item_${crypto.randomUUID().slice(0, 8)}`;

    let title = body.title;
    let rawContent = body.content;
    let sourceUrl = null;

    if (body.type === 'url') {
      sourceUrl = body.content;
      if (!sourceUrl.startsWith('http://') && !sourceUrl.startsWith('https://')) {
        sourceUrl = 'https://' + sourceUrl;
      }

      const scraped = await fetchAndParseUrl(sourceUrl);
      title = body.title || scraped.title;
      rawContent = scraped.content;
    } else {
      title = body.title || (rawContent.slice(0, 45).trim() + (rawContent.length > 45 ? '...' : ''));
    }

    const textChunks = chunkText(rawContent);

    if (textChunks.length === 0) {
      return res.status(400).json({ error: 'No valid text could be extracted for chunking' });
    }

    const preparedChunks = [];
    for (const chunk of textChunks) {
      const embedding = await generateEmbedding(chunk.text);
      preparedChunks.push({
        id: `chk_${crypto.randomUUID().slice(0, 8)}`,
        itemId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        embedding,
        charCount: chunk.charCount
      });
    }

    // Step 4: Persist in SQLite
    const item = await repository.createItem({
      id: itemId,
      type: body.type,
      title,
      content: rawContent,
      url: sourceUrl,
      chunkCount: preparedChunks.length
    });

    await repository.insertChunks(preparedChunks);

    const timingMs = Date.now() - startTime;
    logger.info({ itemId, type: body.type, chunkCount: preparedChunks.length, timingMs }, 'Item ingested and vector index updated');

    return res.status(201).json({
      success: true,
      item,
      chunkCount: preparedChunks.length,
      timingMs
    });

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/items
 * Retrieve all ingested inbox items with optional filter
 */
router.get('/items', async (req, res, next) => {
  try {
    const { type, search } = req.query;
    const items = await repository.getAllItems({ type, search });
    res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/items/:id
 * Delete an item and its associated vector chunks
 */
router.delete('/items/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await repository.getItemById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await repository.deleteItem(id);
    logger.info({ itemId: id }, 'Item and associated chunks deleted');
    res.json({ success: true, deletedId: id });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/query
 * Semantic vector search + RAG question answering
 */
router.post('/query', async (req, res, next) => {
  try {
    const { question, topK } = QuerySchema.parse(req.body);
    const result = await answerQuestion({ question, topK });
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/stats
 * System & Vector Store operational metrics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await repository.getStats();
    res.json({
      success: true,
      stats,
      config: {
        hfTokenConfigured: !!process.env.HF_TOKEN,
        openaiConfigured: !!process.env.OPENAI_API_KEY,
        geminiConfigured: !!process.env.GEMINI_API_KEY
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
