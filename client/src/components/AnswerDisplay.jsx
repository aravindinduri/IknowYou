import React, { useState } from 'react';
import { Bot, Clock, ExternalLink, ShieldCheck, X, BookOpen, User } from 'lucide-react';

export function AnswerDisplay({ question, result, onReset }) {
  const [showCitations, setShowCitations] = useState(false);
  const [highlightedSourceIdx, setHighlightedSourceIdx] = useState(null);

  if (!result) return null;

  const { answer, sources, timingMs, providerUsed } = result;
  const hasSources = sources && sources.length > 0;

  const handleOpenSource = (idx) => {
    setHighlightedSourceIdx(idx);
    setShowCitations(true);
  };

  /**
   * Parses answer text and converts citation tokens like [Source 1], [Source 2, Source 4]
   * into interactive, clickable citation buttons!
   */
  const renderFormattedAnswer = (text) => {
    if (!text) return null;

    const citationRegex = /(\[Source\s+\d+(?:,\s*Source\s+\d+)*\])/gi;
    const parts = text.split(citationRegex);

    return parts.map((part, i) => {
      // Re-check if this segment is a citation marker
      if (part.match(/^\[Source\s+\d+(?:,\s*Source\s+\d+)*\]$/i)) {
        const nums = part.match(/\d+/g);
        if (!nums || nums.length === 0) return part;

        return (
          <span key={i} className="inline-flex items-center gap-1 mx-0.5">
            {nums.map((numStr, nIdx) => {
              const srcIdx = parseInt(numStr, 10) - 1;
              const source = sources && sources[srcIdx];

              return (
                <button
                  key={nIdx}
                  type="button"
                  onClick={() => handleOpenSource(srcIdx)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold text-xs border border-emerald-300 shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer"
                  title={source ? `Click to view source snippet for "${source.itemTitle}"` : `View Source ${numStr}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Source {numStr}</span>
                </button>
              );
            })}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-4 animate-fadeIn">
      {/* 1. User Question Chat Bubble (Right-aligned / Top) */}
      {question && (
        <div className="flex justify-end items-start gap-2.5 pl-8 sm:pl-16">
          <div className="bg-slate-900 text-white rounded-3xl rounded-tr-sm px-5 py-3.5 shadow-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1">
              <User className="w-3 h-3 text-emerald-400" />
              <span>You asked</span>
            </div>
            <p className="text-sm sm:text-base font-medium leading-relaxed">
              {question}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shrink-0 mt-1">
            <User className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      )}

      {/* 2. AI Response Chat Bubble (Left-aligned / Bottom) */}
      <div className="flex justify-start items-start gap-2.5 pr-4 sm:pr-8">
        <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md shrink-0 mt-1">
          <Bot className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="flex-1 ref-glass-card rounded-3xl rounded-tl-sm p-6 sm:p-7 shadow-xl space-y-4 border border-white/90 relative">
          {/* Answer Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900">AI Knowledge Assistant</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Clock className="w-3 h-3 text-slate-400" /> {timingMs}ms
              </span>
              <span className="text-slate-300">•</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold">
                {providerUsed || 'RAG Engine'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* View Citations Button */}
              {hasSources && (
                <button
                  onClick={() => handleOpenSource(null)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-md active:scale-95 transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Citations ({sources.length})</span>
                </button>
              )}

              {onReset && (
                <button
                  onClick={onReset}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                  title="Clear Answer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Answer Body Text with Clickable [Source X] Badges */}
          <div className="prose max-w-none text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal">
            {renderFormattedAnswer(answer)}
          </div>

          {/* Bottom Sources Link */}
          {hasSources && (
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Click any [Source X] tag above to view exact citation snippet</span>
              </div>

              <button
                onClick={() => handleOpenSource(null)}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-800 hover:text-emerald-700 transition-colors bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 px-2.5 py-0.5 rounded-lg"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>View All Citations</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Popup Modal for Citations */}
      {showCitations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
          <div className="bg-white/95 rounded-3xl p-5 sm:p-6 shadow-2xl max-w-xl w-full border border-slate-200 max-h-[85vh] flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Cited Sources ({sources.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Matched via vector cosine similarity
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowCitations(false);
                  setHighlightedSourceIdx(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Compact Citations List */}
            <div className="overflow-y-auto pr-1 space-y-3 max-h-[60vh]">
              {sources.map((src, idx) => {
                const isHighlighted = highlightedSourceIdx === idx;

                return (
                  <div
                    key={src.id || idx}
                    className={`rounded-xl p-3 transition-all ${
                      isHighlighted
                        ? 'bg-emerald-50/90 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-slate-50/80 border border-slate-200/90 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Top Line */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center shrink-0 ${
                          isHighlighted ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                        }`}>
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {src.itemTitle}
                        </span>

                        {isHighlighted && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white shrink-0">
                            Selected Citation
                          </span>
                        )}
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 border ${
                        src.similarity > 0.4
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : src.similarity > 0.2
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {(src.similarity * 100).toFixed(0)}% match
                      </span>
                    </div>

                    {/* Compact Snippet */}
                    <p className={`text-[11px] leading-relaxed font-sans p-2.5 rounded-lg border line-clamp-4 ${
                      isHighlighted
                        ? 'bg-white text-slate-900 border-emerald-200 font-medium'
                        : 'bg-white text-slate-600 border-slate-200/60'
                    }`}>
                      "{src.snippet}"
                    </p>

                    {/* External Link */}
                    {src.itemUrl && (
                      <div className="mt-1.5 flex justify-end">
                        <a
                          href={src.itemUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                        >
                          Source Link <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setShowCitations(false);
                  setHighlightedSourceIdx(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
