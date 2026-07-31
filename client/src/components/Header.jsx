import React from 'react';
import { Brain, Plus, Inbox, FileText, Cpu, Sparkles } from 'lucide-react';

export function Header({ stats, onOpenIngest, onOpenInbox }) {
  return (
    <header className="sticky top-4 z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="ref-glass-card rounded-full px-4 sm:px-6 h-14 flex items-center justify-between shadow-lg border border-white/80">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-md shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">Knowledge Inbox</h1>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              RAG Engine
            </span>
          </div>
        </div>

        {/* Stats Metrics (Center) */}
        {stats && (
          <div className="hidden lg:flex items-center space-x-3 text-xs font-medium text-slate-600">
            <div className="flex items-center space-x-1.5 bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200/80">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Items:</span>
              <span className="font-bold text-slate-900">{stats.totalItems || 0}</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200/80">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chunks:</span>
              <span className="font-bold text-slate-900">{stats.totalChunks || 0}</span>
            </div>
          </div>
        )}

        {/* Header Navigation Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Knowledge Inbox Popup Trigger */}
          <button
            onClick={onOpenInbox}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/90 text-slate-800 text-xs font-bold border border-slate-200/90 shadow-xs active:scale-95 transition-all"
          >
            <Inbox className="w-3.5 h-3.5 text-slate-700" />
            <span className="hidden sm:inline">Knowledge Inbox</span>
            <span className="sm:hidden">Inbox</span>
            {stats?.totalItems !== undefined && (
              <span className="px-1.5 py-0.2 text-[10px] bg-slate-900 text-white rounded-full font-bold ml-0.5">
                {stats.totalItems}
              </span>
            )}
          </button>

          {/* Add Ingestion Popup Trigger */}
          <button
            onClick={onOpenIngest}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Ingestion</span>
          </button>
        </div>
      </div>
    </header>
  );
}
