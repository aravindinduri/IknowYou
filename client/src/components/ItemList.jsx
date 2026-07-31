import React, { useState } from 'react';
import { FileText, Link, Search, Trash2, Layers, ExternalLink, Inbox } from 'lucide-react';

export function ItemList({ items, loading, onDeleteItem, onInspectItem }) {
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const filteredItems = items.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="ref-glass-card rounded-3xl p-6 shadow-xl flex flex-col h-full relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Inbox className="w-4 h-4 text-emerald-600" /> Saved Knowledge Inbox
          </h3>
          <p className="text-xs text-slate-500 font-medium">Browse ingested notes, web pages, and vector chunk counts</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-full border border-slate-200 self-start sm:self-auto">
          {['all', 'note', 'url'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all ${
                filterType === t
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter saved content..."
          className="w-full ref-glass-input rounded-2xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 font-medium"
        />
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[300px] max-h-[520px]">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 text-xs font-medium">
            Loading inbox items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <Inbox className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">No saved items found</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Ingest a note or URL to build your RAG knowledge base</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white/90 border border-slate-200/80 rounded-2xl p-4 hover:border-emerald-300 transition-all shadow-sm group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 border ${
                    item.type === 'url' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    {item.type === 'url' ? <Link className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                        {item.title}
                      </h4>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-cyan-700 transition-colors"
                          title="Open original URL"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 font-normal leading-relaxed">
                      {item.content}
                    </p>

                    {/* Metadata Footer */}
                    <div className="flex items-center space-x-3 mt-2.5 text-[10px] text-slate-500 font-medium">
                      <span>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        <Layers className="w-3 h-3 text-emerald-600" />
                        {item.chunk_count} chunk{item.chunk_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => onInspectItem(item)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Inspect vector chunks"
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
