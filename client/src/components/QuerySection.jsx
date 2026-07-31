import React, { useState } from 'react';
import { ArrowRight, Info, RefreshCw, Sliders, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import { queryRAG } from '../services/api';

export function QuerySection({ onQueryResults, onClearResults, isDocked }) {
  const [question, setQuestion] = useState('');
  const [topK, setTopK] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sampleQueries = [
    "What are the main concepts in my notes?",
    "Summarize the key architectural decisions.",
    "What URLs or references were saved?"
  ];

  const handleQuery = async (qText = question) => {
    if (!qText || !qText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await queryRAG({ question: qText, topK });
      onQueryResults(res, qText);
      setQuestion(''); // Clear input for next query in chat view
    } catch (err) {
      setError(err.message || 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  // Docked Floating Bottom Bar Mode (Active after first query)
  if (isDocked) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 bg-white/85 backdrop-blur-2xl border-t border-slate-200/90 shadow-[0_-10px_40px_rgba(0,0,0,0.12)] transition-all duration-300 animate-slideUp">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Top Bar Controls inside Dock */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-700">RAG Chat Mode</span>
              {error && <span className="text-rose-600 font-medium">• {error}</span>}
            </div>

            <div className="flex items-center space-x-3">
              {/* Top K Selector */}
              <div className="flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Top Chunks:</span>
                <select
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="bg-slate-100 border border-slate-300 text-slate-800 rounded-md px-1.5 py-0.5 font-bold focus:outline-none text-xs"
                >
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                </select>
              </div>

              {/* Reset to Hero Button */}
              {onClearResults && (
                <button
                  type="button"
                  onClick={onClearResults}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors text-xs"
                  title="Clear chat and return to top"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Floating Input Row */}
          <form onSubmit={(e) => { e.preventDefault(); handleQuery(); }} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleQuery();
                  }
                }}
                placeholder="Ask a follow-up question about your saved notes or URLs..."
                className="w-full bg-slate-50/90 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 rounded-2xl px-4 py-3 pr-12 shadow-inner"
              />

              <button
                type="submit"
                disabled={loading || !question.trim()}
                className={`absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-xl flex items-center justify-center transition-all ${
                  loading || !question.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md active:scale-95'
                }`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>

          {/* Quick Prompt Chips in Dock */}
          <div className="hidden sm:flex items-center gap-2 overflow-x-auto pt-0.5 pb-0.5 no-scrollbar">
            <span className="text-[11px] text-slate-400 font-medium shrink-0">Quick ask:</span>
            {sampleQueries.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setQuestion(sq); handleQuery(sq); }}
                className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-600 font-medium whitespace-nowrap border border-slate-200/80 transition-colors"
              >
                "{sq}"
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Hero Standalone Mode (Before first query)
  return (
    <div className="flex flex-col items-center text-center pt-6 pb-4 max-w-4xl mx-auto px-4">
      {/* Eyebrow Pill Badge */}
      <div className="ref-glass-pill rounded-full px-4 py-1.5 flex items-center space-x-2 text-xs font-semibold text-slate-700 mb-6 shadow-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>RAG — Semantic Vector Search</span>
      </div>

      {/* Main Display Headline with "never" highlighted in RED */}
      <h2 className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-slate-900 leading-[1.1] mb-4">
        You Saved it for <span className="font-serif-italic font-normal text-slate-800">Later</span>.
        <br />
        AI <span className="font-serif-italic text-rose-600 font-bold">never</span> forgot the detail.
      </h2>

      {/* Subtitle */}
      <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed mb-8">
        ChatGPT, Gemini, and local models read your saved notes and web URLs differently. Search across your vector inbox instantly.
      </p>

      {/* Main Floating White Glass Input Card */}
      <div className="w-full ref-glass-card rounded-3xl p-4 sm:p-6 shadow-2xl relative">
        <form onSubmit={(e) => { e.preventDefault(); handleQuery(); }} className="space-y-4">
          <div className="relative flex items-center">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuery();
                }
              }}
              rows={2}
              placeholder="Ask anything about your saved notes or URLs..."
              className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-base sm:text-lg font-medium focus:outline-none resize-none pr-16 pl-2 pt-1"
            />

            {/* Dark Submit Arrow Button */}
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className={`absolute right-2 bottom-2 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                loading || !question.trim()
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg active:scale-95'
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Sub-caption Info Bar Inside Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-200/60 text-xs text-slate-500 gap-2">
            <div className="flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Similarity scores above 40% mean vector chunks fully match your query.</span>
            </div>

            {/* Top K Selector */}
            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>Chunks:</span>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="bg-slate-100 border border-slate-300 text-slate-800 rounded-lg px-2 py-0.5 font-semibold focus:outline-none"
              >
                <option value={2}>Top 2</option>
                <option value={4}>Top 4</option>
                <option value={6}>Top 6</option>
                <option value={8}>Top 8</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mt-4 p-3 rounded-2xl bg-rose-100 border border-rose-200 text-rose-800 text-xs font-medium w-full">
          {error}
        </div>
      )}

      {/* Bottom Status Counter Pill */}
      <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 mt-4">
        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
        <span>Average sub-10ms semantic retrieval across all vector chunks</span>
      </div>

      {/* Suggested Prompts */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-slate-500 font-medium">Try asking:</span>
        {sampleQueries.map((sq, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setQuestion(sq); handleQuery(sq); }}
            className="ref-glass-pill px-3 py-1 rounded-full text-xs text-slate-700 hover:text-slate-900 hover:border-slate-400 transition-colors shadow-sm"
          >
            "{sq}"
          </button>
        ))}
      </div>
    </div>
  );
}
