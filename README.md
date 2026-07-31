# AI Knowledge Inbox

A production-style, lightweight **AI Knowledge Inbox** web application for ingesting plain text notes and web page URLs, indexing them into a SQLite vector store, performing semantic similarity search, and answering questions via a Retrieval-Augmented Generation (RAG) pipeline with cited sources.

---

## Application Preview

### 1. RAG Search & Landing Page
![RAG Vector Search & Landing Page](client/public/image.png)

### 2. Conversational RAG Chat Thread & Citations
![Conversational RAG Chat Thread](client/public/chat_thread.png)

### 3. Ingest Content Modal (Notes & URLs)
![Add Ingestion Modal](client/public/add_ingestion.png)

### 4. Saved Knowledge Inbox & Chunk Inspector Modal
![Saved Knowledge Inbox Modal](client/public/knowledge_box.png)

---

## Features

- **Dual Content Ingestion**:
  - **Text Notes**: Store plain-text notes with sentence-aware chunking.
  - **Web URLs**: Server-side page fetching (HTML cleaning via `cheerio`, stripping nav/scripts, extracting main text).
- **Hugging Face & Zero-Setup Embeddings**:
  - Uses **Hugging Face Inference API** (`sentence-transformers/all-MiniLM-L6-v2` 384-dimensional vectors).
  - Includes a zero-setup local subword vectorizer fallback so the app works **100% out-of-the-box** without mandatory API keys.
- **SQLite Vector Store**:
  - Powered by WebAssembly SQLite (`sql.js`) storing dense 384-dimensional vector embeddings with in-memory/disk cosine similarity calculation.
- **Multi-Provider RAG Engine**:
  - Supports **OpenAI** (`gpt-4o-mini`), **Google Gemini** (`gemini-1.5-flash`), **Hugging Face** (`Mistral-7B-Instruct`), or a built-in **Smart RAG Synthesizer**.
  - Returns structured markdown answers with cited source snippets and similarity match confidence percentages.
- **Modern React UI**:
  - High-aesthetic dashboard built with Vite, React, Tailwind CSS v4, and Lucide icons.
  - Features real-time system metrics, note/URL tabs, filterable inbox, and vector chunk inspection modal.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher

### 2. Installation
Clone the repository and install all dependencies (backend & frontend):

```bash
npm run install:all
```

### 3. Environment Setup (Optional)
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configuration Options in `.env`:
```env
PORT=3001
NODE_ENV=development
HF_TOKEN=               # Hugging Face Inference API token (optional)
OPENAI_API_KEY=         # OpenAI API Key (optional)
GEMINI_API_KEY=         # Google Gemini API Key (optional)
DATABASE_PATH=./server/db/knowledge_inbox.db
```

*Note: If no API keys are provided, the application automatically uses the zero-dependency local vectorizer and Smart RAG Synthesizer.*

### 4. Running the Application

#### Development Mode (Concurrent Server & Client):
```bash
npm run dev
```
- Backend API running on `http://localhost:3001`
- Frontend Vite dev server running on `http://localhost:5173`

#### Production Mode:
```bash
npm run build:client
npm start
```
Access the application at `http://localhost:3001`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ingest` | Ingest note (`{ type: "note", content, title? }`) or URL (`{ type: "url", content }`) |
| `GET` | `/api/items` | Retrieve all saved inbox items with optional `search` or `type` query filters |
| `DELETE` | `/api/items/:id` | Delete item and cascade delete its vector chunks |
| `POST` | `/api/query` | Execute semantic vector search and RAG question answering (`{ question, topK? }`) |
| `GET` | `/api/stats` | System metrics, item/chunk counts, and AI provider status |

---

## System Architecture & Tradeoffs

For a complete breakdown of chunking strategy rationale, vector store trade-offs, scale limits, and production migration guidelines, read [ARCHITECTURE.md](ARCHITECTURE.md).
