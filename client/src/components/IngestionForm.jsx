import React, { useState } from 'react';
import { FileText, Link, Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ingestItem } from '../services/api';

export function IngestionForm({ onItemIngested }) {
  const [type, setType] = useState('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setStatus({ type: 'error', message: type === 'url' ? 'Please enter a valid URL' : 'Please enter note content' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await ingestItem({ type, content, title });
      setStatus({
        type: 'success',
        message: `Successfully ingested "${res.item.title}" (${res.chunkCount} vector chunk${res.chunkCount > 1 ? 's' : ''} generated)`
      });

      setTitle('');
      setContent('');

      if (onItemIngested) {
        onItemIngested(res.item);
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Ingestion failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ref-glass-card rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" /> Save Content to Inbox
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Ingest text notes or web URLs into SQLite vector store</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
          <button
            type="button"
            onClick={() => { setType('note'); setStatus(null); }}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
              type === 'note'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" /> Note
          </button>
          <button
            type="button"
            onClick={() => { setType('url'); setStatus(null); }}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
              type === 'url'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link className="w-3.5 h-3.5 text-slate-600" /> URL
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Title <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'url' ? 'Auto-extracted from web page if left blank' : 'Give your note a title...'}
            className="w-full ref-glass-input rounded-2xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 font-medium"
          />
        </div>

        {/* Content Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {type === 'url' ? 'Web URL' : 'Note Content'} <span className="text-rose-500">*</span>
          </label>
          {type === 'url' ? (
            <input
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="https://example.com/article"
              required
              className="w-full ref-glass-input rounded-2xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 font-mono"
            />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Type or paste your text note here... (e.g. Architectural decisions, research summaries, key findings)"
              required
              className="w-full ref-glass-input rounded-2xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 resize-y min-h-[110px]"
            />
          )}
        </div>

        {/* Status Toast */}
        {status && (
          <div className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-medium ${
            status.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}>
            {status.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>{status.message}</div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white transition-all shadow-md active:scale-98 ${
              loading
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/10'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Ingesting & Embedding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Ingest {type === 'url' ? 'URL' : 'Note'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
