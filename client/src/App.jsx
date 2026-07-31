import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { IngestionForm } from './components/IngestionForm';
import { ItemList } from './components/ItemList';
import { ItemModal } from './components/ItemModal';
import { QuerySection } from './components/QuerySection';
import { AnswerDisplay } from './components/AnswerDisplay';
import { getItems, deleteItem, getStats } from './services/api';
import { MessageSquare, X, Plus, Inbox } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingItems, setLoadingItems] = useState(true);
  const [inspectItem, setInspectItem] = useState(null);
  
  // Modal toggle states
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [showInboxModal, setShowInboxModal] = useState(false);

  // Array of { id, question, result }
  const [chatHistory, setChatHistory] = useState([]);

  const fetchInboxData = async () => {
    try {
      setLoadingItems(true);
      const [itemsRes, statsRes] = await Promise.all([
        getItems(),
        getStats()
      ]);
      setItems(itemsRes.items || []);
      setStats(statsRes.stats || null);
    } catch (err) {
      console.error('Failed to load inbox data:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchInboxData();
  }, []);

  const handleItemIngested = () => {
    fetchInboxData();
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item and its vector index chunks?')) {
      try {
        await deleteItem(id);
        fetchInboxData();
      } catch (err) {
        alert(err.message || 'Failed to delete item');
      }
    }
  };

  const handleNewQueryResult = (result, userQuestion) => {
    setChatHistory((prev) => [
      ...prev,
      { id: Date.now().toString(), question: userQuestion, result }
    ]);

    // Smooth scroll down to newest answer
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleClearChat = () => {
    setChatHistory([]);
  };

  const isDocked = chatHistory.length > 0;

  return (
    <div className={`min-h-screen landscape-bg text-slate-900 font-sans relative selection:bg-emerald-200 selection:text-emerald-900 ${isDocked ? 'pb-32' : 'pb-16'}`}>
      {/* Soft brightness overlay */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] pointer-events-none z-0" />

      <div className="relative z-10 space-y-8">
        {/* Header Navigation */}
        <Header
          stats={stats}
          onOpenIngest={() => setShowIngestModal(true)}
          onOpenInbox={() => setShowInboxModal(true)}
        />

        {/* Main RAG Search & Chat Area */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          {/* RAG Query & Thread Section */}
          <div className="space-y-6">
            {/* If in Hero mode (no questions asked yet), render full hero query box at top */}
            {!isDocked && (
              <QuerySection
                onQueryResults={handleNewQueryResult}
                onClearResults={handleClearChat}
                isDocked={false}
              />
            )}

            {/* Answer Display Stack when questions exist */}
            {isDocked && (
              <div className="space-y-8 max-w-4xl mx-auto pt-2">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-bold text-slate-900">RAG Conversation Thread</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                      {chatHistory.length} {chatHistory.length === 1 ? 'exchange' : 'exchanges'}
                    </span>
                  </div>

                  <button
                    onClick={handleClearChat}
                    className="text-xs text-slate-500 hover:text-slate-900 font-semibold px-3 py-1 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Clear Thread
                  </button>
                </div>

                {chatHistory.map((item, idx) => (
                  <div key={item.id} className="animate-fadeIn">
                    <AnswerDisplay
                      question={item.question}
                      result={item.result}
                      onReset={idx === chatHistory.length - 1 ? handleClearChat : undefined}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Floating Attached Chat Box at Bottom (Active after first question) */}
        {isDocked && (
          <QuerySection
            onQueryResults={handleNewQueryResult}
            onClearResults={handleClearChat}
            isDocked={true}
          />
        )}

        {/* --- MODAL POPUPS --- */}

        {/* 1. Add Ingestion Popup Modal */}
        {showIngestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
            <div className="bg-white/95 rounded-3xl p-6 shadow-2xl max-w-xl w-full border border-slate-200 relative animate-scaleUp">
              <button
                onClick={() => setShowIngestModal(false)}
                className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <IngestionForm
                onItemIngested={(newItem) => {
                  handleItemIngested(newItem);
                  // Auto close modal after successful ingestion after brief pause
                  setTimeout(() => setShowIngestModal(false), 1200);
                }}
              />
            </div>
          </div>
        )}

        {/* 2. Knowledge Inbox Popup Modal */}
        {showInboxModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
            <div className="bg-white/95 rounded-3xl p-6 shadow-2xl max-w-4xl w-full border border-slate-200 relative max-h-[88vh] flex flex-col animate-scaleUp">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-4 shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                    <Inbox className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Saved Knowledge Inbox</h3>
                    <p className="text-xs text-slate-500 font-medium">Browse, search, and manage your vector index items</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowInboxModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 flex-1">
                <ItemList
                  items={items}
                  loading={loadingItems}
                  onDeleteItem={handleDeleteItem}
                  onInspectItem={(item) => setInspectItem(item)}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Chunk Inspection Modal */}
        {inspectItem && (
          <ItemModal
            item={inspectItem}
            onClose={() => setInspectItem(null)}
          />
        )}
      </div>
    </div>
  );
}
