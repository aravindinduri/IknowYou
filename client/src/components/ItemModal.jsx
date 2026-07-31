import React from 'react';
import { X, FileText, Link, ExternalLink } from 'lucide-react';

export function ItemModal({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="ref-glass-card rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative border border-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-white/60">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              item.type === 'url' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              {item.type === 'url' ? <Link className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
              <p className="text-[11px] text-slate-500 font-mono">ID: {item.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/80 p-3 rounded-2xl border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Type</span>
              <span className="text-slate-900 font-semibold capitalize mt-0.5 block">{item.type}</span>
            </div>
            <div className="bg-white/80 p-3 rounded-2xl border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Vector Chunks</span>
              <span className="text-emerald-700 font-semibold mt-0.5 block">{item.chunk_count} Chunks</span>
            </div>
            <div className="bg-white/80 p-3 rounded-2xl border border-slate-200/80 col-span-2 sm:col-span-1">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Ingested At</span>
              <span className="text-slate-700 mt-0.5 block font-mono">{new Date(item.created_at).toLocaleString()}</span>
            </div>
          </div>

          {/* URL link if present */}
          {item.url && (
            <div className="bg-white/80 p-3 rounded-2xl border border-slate-200/80 text-xs flex items-center justify-between">
              <span className="text-slate-600 font-mono truncate">{item.url}</span>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-emerald-700 hover:underline shrink-0 ml-2 font-semibold"
              >
                Visit <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Full Content */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Extracted Raw Content
            </h4>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-800 font-sans leading-relaxed max-h-52 overflow-y-auto whitespace-pre-wrap">
              {item.content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200/80 bg-white/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
