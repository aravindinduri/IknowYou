import { searchVectorStore } from './vectorStore.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { GoogleGenAI } from '@google/genai';

/**
 * @typedef {Object} RagSource
 * @property {string} itemTitle
 * @property {string} itemType
 * @property {string} snippet
 * @property {number} similarity
 */

/**
 * @typedef {Object} RagAnswer
 * @property {string} answer
 * @property {RagSource[]} sources
 * @property {number} timingMs
 * @property {string} providerUsed
 */

const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_TOKENS = 600;

const PROVIDERS = {
  NONE: 'none',
  OPENAI: 'OpenAI (gpt-4o-mini)',
  GEMINI: 'Google Gemini API',
  HUGGING_FACE: 'Hugging Face Inference',
  EXTRACTIVE: 'Built-in Smart RAG Synthesizer'
};

/**
 * Answers a question using retrieval-augmented generation over the user's
 * saved notes/URLs, trying configured LLM providers in order and falling
 * back to a deterministic extractive synthesizer if none succeed.
 *
 * @param {{ question: string, topK?: number }} params
 * @returns {Promise<RagAnswer>}
 */
export async function answerQuestion({ question, topK = config.defaultTopK }) {
  const startTime = Date.now();

  const trimmedQuestion = typeof question === 'string' ? question.trim() : '';
  if (!trimmedQuestion) {
    throw new Error('answerQuestion: "question" must be a non-empty string');
  }

  logger.info({ question: trimmedQuestion, topK }, 'RAG pipeline initiated');

  const sources = await searchVectorStore(trimmedQuestion, topK);

  if (sources.length === 0) {
    return {
      answer:
        "I couldn't find any relevant notes or saved URLs in your inbox to answer this question. Please try adding notes or ingestion items first.",
      sources: [],
      timingMs: Date.now() - startTime,
      providerUsed: PROVIDERS.NONE
    };
  }

  const contextText = buildContextText(sources);
  const systemPrompt = buildSystemPrompt();
  const userPrompt = `Context:\n${contextText}\n\nQuestion: ${trimmedQuestion}`;

  const { answer, providerUsed } = await getAnswerFromProviders(systemPrompt, userPrompt, sources, trimmedQuestion);

  const timingMs = Date.now() - startTime;
  logger.info({ durationMs: timingMs, providerUsed }, 'RAG pipeline execution completed');

  return { answer, sources, timingMs, providerUsed };
}

function buildContextText(sources) {
  return sources
    .map((src, idx) => `[Source ${idx + 1}: ${src.itemTitle} (${src.itemType})]\n"${src.snippet}"`)
    .join('\n\n');
}

function buildSystemPrompt() {
  return [
    "You are an intelligent knowledge assistant answering questions based STRICTLY on the user's saved notes and URLs provided in the Context below.",
    'Rules:',
    '1. Answer the question accurately using ONLY information found in the Context snippets.',
    '2. Cite your sources using [Source 1], [Source 2], etc. matching the provided snippets.',
    '3. If the context does not contain enough information to answer fully, clearly state what is known from the sources and what is missing.',
    '4. Keep the response concise, clear, and structured.'
  ].join('\n');
}

/**
 * Tries each configured provider in priority order, falling back to the
 * extractive synthesizer if all fail or none are configured.
 */
async function getAnswerFromProviders(systemPrompt, userPrompt, sources, question) {
  const attempts = [
    { name: PROVIDERS.OPENAI, enabled: Boolean(config.openaiApiKey), fn: queryOpenAI },
    { name: PROVIDERS.GEMINI, enabled: Boolean(config.geminiApiKey), fn: queryGemini },
    { name: PROVIDERS.HUGGING_FACE, enabled: Boolean(config.hfToken), fn: queryHuggingFace }
  ];

  for (const attempt of attempts) {
    if (!attempt.enabled) continue;
    try {
      const answer = await attempt.fn(systemPrompt, userPrompt);
      if (answer && answer.trim()) {
        return { answer: answer.trim(), providerUsed: attempt.name };
      }
    } catch (err) {
      logger.warn({ error: err.message, provider: attempt.name }, 'LLM provider call failed, falling back');
    }
  }

  return {
    answer: generateExtractiveAnswer(question, sources),
    providerUsed: PROVIDERS.EXTRACTIVE
  };
}

async function queryOpenAI(systemPrompt, userPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(8000),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openaiApiKey}`
    },
    body: JSON.stringify({
      model: config.openaiModel || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: DEFAULT_MAX_TOKENS
    })
  });

  if (!res.ok) {
    throw new Error(`OpenAI HTTP ${res.status}: ${await safeReadError(res)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Query Gemini using the official @google/genai SDK.
 * The SDK reads GEMINI_API_KEY from the environment automatically;
 * we also pass it explicitly for safety.
 */
async function queryGemini(systemPrompt, userPrompt) {
  const model = config.geminiModel || 'gemini-2.5-flash';

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

  const response = await ai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: DEFAULT_TEMPERATURE,
      maxOutputTokens: DEFAULT_MAX_TOKENS
    }
  });

  const text = response.text;
  if (!text || !text.trim()) throw new Error('Gemini SDK returned no usable text');
  return text.trim();
}

async function queryHuggingFace(systemPrompt, userPrompt) {
  const model = config.hfModel || 'mistralai/Mistral-7B-Instruct-v0.3';

  // Use the newer Inference API router endpoint for better availability
  const endpoint = `https://api-inference.huggingface.co/models/${model}/v1/chat/completions`;

  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      signal: AbortSignal.timeout(20000), // cold-start can take ~15s on free tier
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.hfToken}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: DEFAULT_TEMPERATURE,
        stream: false
      })
    });
  } catch (err) {
    throw new Error(`Hugging Face fetch failed: ${err.message}`);
  }

  if (res.status === 404 || res.status === 503) {
    // Model may be loading or not available via chat endpoint — try legacy API
    return queryHuggingFaceLegacy(model, systemPrompt, userPrompt);
  }

  if (!res.ok) {
    throw new Error(`Hugging Face HTTP ${res.status}: ${await safeReadError(res)}`);
  }

  const data = await res.json();
  // OpenAI-compatible chat response
  const text = data.choices?.[0]?.message?.content;
  if (text && text.trim()) return text.trim();

  throw new Error('Hugging Face returned no usable text');
}

/** Legacy text-generation endpoint fallback for models that don't support chat API. */
async function queryHuggingFaceLegacy(model, systemPrompt, userPrompt) {
  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    signal: AbortSignal.timeout(20000),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.hfToken}`
    },
    body: JSON.stringify({
      inputs: `<s>[INST] ${systemPrompt}\n\n${userPrompt} [/INST]`,
      parameters: { max_new_tokens: 500, temperature: DEFAULT_TEMPERATURE, return_full_text: false }
    })
  });

  if (!res.ok) {
    throw new Error(`Hugging Face legacy HTTP ${res.status}: ${await safeReadError(res)}`);
  }

  const data = await res.json();
  const fullText = Array.isArray(data) ? (data[0]?.generated_text ?? '') : '';
  if (!fullText.trim()) return '';

  const instIdx = fullText.lastIndexOf('[/INST]');
  return instIdx !== -1 ? fullText.slice(instIdx + '[/INST]'.length).trim() : fullText.trim();
}

/** Reads an error response body defensively, never throwing. */
async function safeReadError(res) {
  try {
    const text = await res.text();
    return text.slice(0, 500);
  } catch {
    return '<unreadable error body>';
  }
}

/**
 * Deterministic, dependency-free extractive synthesizer used when no
 * external LLM provider is configured or all providers fail.
 */
function generateExtractiveAnswer(question, sources) {
  if (sources.length === 0) return 'No relevant information found.';

  const mainSource = sources[0];
  const scoreText = Number.isFinite(mainSource.similarity)
    ? `${(mainSource.similarity * 100).toFixed(0)}%`
    : 'n/a';

  let summary = `Based on your saved content in **${mainSource.itemTitle}** [Source 1] (Relevance score: ${scoreText}):\n\n`;

  sources.forEach((src, idx) => {
    summary += `> **[Source ${idx + 1}: ${src.itemTitle}]**\n> "${src.snippet}"\n\n`;
  });

  summary +=
    '\n*Note: Running in zero-dependency local synthesizer mode. Add an OpenAI, Gemini, or Hugging Face key in .env for dynamic generative answers.*';
  return summary;
}