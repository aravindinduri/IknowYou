import { getDb, saveDb } from './database.js';
import { logger } from '../logger.js';

export const repository = {
  // Items CRUD
  async createItem({ id, type, title, content, url = null, chunkCount = 0 }) {
    const db = await getDb();
    const sql = `
      INSERT INTO items (id, type, title, content, url, chunk_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    db.run(sql, [id, type, title, content, url, chunkCount]);
    saveDb();
    return this.getItemById(id);
  },

  async getItemById(id) {
    const db = await getDb();
    const stmt = db.prepare(`SELECT * FROM items WHERE id = ?`);
    stmt.bind([id]);
    let row = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    return row;
  },

  async getAllItems({ type, search } = {}) {
    const db = await getDb();
    let query = `SELECT * FROM items`;
    const params = [];
    const conditions = [];

    if (type) {
      conditions.push(`type = ?`);
      params.push(type);
    }
    if (search) {
      conditions.push(`(title LIKE ? OR content LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at DESC`;
    const stmt = db.prepare(query);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  },

  async deleteItem(id) {
    const db = await getDb();
    // Cascade delete chunks manually just in case
    db.run(`DELETE FROM chunks WHERE item_id = ?`, [id]);
    db.run(`DELETE FROM items WHERE id = ?`, [id]);
    saveDb();
    return true;
  },

  // Chunks CRUD
  async insertChunks(chunks) {
    const db = await getDb();
    const sql = `
      INSERT INTO chunks (id, item_id, chunk_index, text, embedding, char_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    for (const chunk of chunks) {
      db.run(sql, [
        chunk.id,
        chunk.itemId,
        chunk.chunkIndex,
        chunk.text,
        JSON.stringify(chunk.embedding),
        chunk.charCount
      ]);
    }
    saveDb();
  },

  async getAllChunks() {
    const db = await getDb();
    const sql = `
      SELECT c.id, c.item_id, c.chunk_index, c.text, c.embedding, c.char_count,
             i.title as item_title, i.type as item_type, i.url as item_url
      FROM chunks c
      JOIN items i ON c.item_id = i.id
    `;
    const stmt = db.prepare(sql);
    const rows = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      rows.push({
        ...row,
        embedding: JSON.parse(row.embedding)
      });
    }
    stmt.free();
    return rows;
  },

  async getStats() {
    const db = await getDb();
    
    const getCount = (sql) => {
      const stmt = db.prepare(sql);
      let count = 0;
      if (stmt.step()) {
        const obj = stmt.getAsObject();
        count = obj.cnt || 0;
      }
      stmt.free();
      return count;
    };

    return {
      totalItems: getCount(`SELECT COUNT(*) as cnt FROM items`),
      totalChunks: getCount(`SELECT COUNT(*) as cnt FROM chunks`),
      totalNotes: getCount(`SELECT COUNT(*) as cnt FROM items WHERE type = 'note'`),
      totalUrls: getCount(`SELECT COUNT(*) as cnt FROM items WHERE type = 'url'`)
    };
  }
};
