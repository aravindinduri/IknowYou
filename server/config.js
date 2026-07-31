import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databasePath: process.env.DATABASE_PATH || path.join(__dirname, 'db', 'knowledge_inbox.db'),
  
  // AI Keys
  hfToken: process.env.HF_TOKEN || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  
  // Model selection
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  hfModel: process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.3',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  hfEmbeddingModel: process.env.HF_EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',

  // Settings
  llmProvider: process.env.LLM_PROVIDER || 'auto',
  embeddingProvider: process.env.EMBEDDING_PROVIDER || 'auto',
  
  // Vector search parameters
  defaultTopK: 4,
  similarityThreshold: 0.15,
  
  // Chunker settings
  targetChunkSize: 450,
  chunkOverlap: 80
};
