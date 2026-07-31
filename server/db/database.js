import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';
import { logger } from '../logger.js';

let dbInstance = null;
let SQL = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  if (!SQL) {
    SQL = await initSqlJs();
  }

  const dbDir = path.dirname(config.databasePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  let fileBuffer = null;
  if (fs.existsSync(config.databasePath)) {
    logger.info({ path: config.databasePath }, 'Loading existing SQLite database from disk');
    fileBuffer = fs.readFileSync(config.databasePath);
  } else {
    logger.info({ path: config.databasePath }, 'Creating new SQLite database');
  }

  dbInstance = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();
  initSchema(dbInstance);
  saveDb();
  return dbInstance;
}

export function saveDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    const dbDir = path.dirname(config.databasePath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    fs.writeFileSync(config.databasePath, buffer);
    logger.debug({ path: config.databasePath }, 'SQLite database written to disk');
  } catch (err) {
    logger.error({ error: err.message }, 'Failed to save SQLite database to disk');
  }
}

function initSchema(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('note', 'url')),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      chunk_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      text TEXT NOT NULL,
      embedding TEXT NOT NULL,
      char_count INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_chunks_item_id ON chunks(item_id);
    CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
  `);
}

export function closeDb() {
  if (dbInstance) {
    saveDb();
    dbInstance.close();
    dbInstance = null;
    logger.info('SQLite database saved and closed');
  }
}
