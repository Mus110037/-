
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import CalendarView from './components/CalendarView';
import FinanceView from './components/FinanceView';
import CreateOrderModal from './components/CreateOrderModal';
import SyncModal from './components/SyncModal';
import SettingsView from './components/SettingsView';
import SocialShareModal from './components/SocialShareModal';
import ImportModal from './components/ImportModal';
import { Order, OrderStatus, DEFAULT_STAGES, DEFAULT_SOURCES, DEFAULT_ART_TYPES, DEFAULT_PERSON_COUNTS, SAMPLE_ORDERS, AppSettings } from './types';
import { Sparkles, BrainCircuit, Plus, FileSpreadsheet, Share2, Cloud, History, TabletSmartphone, CheckCircle2, Zap, Wand2 } from 'lucide-react';
import { getSchedulingInsights } from './services/geminiService';

const STORAGE_KEY = 'artnexus_orders_v5';
const SETTINGS_KEY = 'artnexus_settings_v5';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : SAMPLE_ORDERS;
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : { 
      stages: DEFAULT_STAGES, 
      sources: DEFAULT_SOURCES,
      artTypes: DEFAULT_ART_TYPES,
      personCounts: DEFAULT_PERSON_COUNTS
    };
  });
  const [priorityOrderIds, setPriorityOrderIds] = useState<string[]>([]);
  const [insights, setInsights] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [mergeSummary, setMergeSummary] = useState<{updated: number, added: number, replaced: boolean} | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const loadInsights = async () => {
      if (orders.length > 0) {
        const text = await getSchedulingInsights(orders);
        setInsights(text);
      }
    };
    loadInsights();
  }, [orders]);

  const handleSaveOrder = (newOrder: Order) => {
    const orderWithVersion = { 
      ...newOrder, 
      updatedAt: new Date().toISOString(),
      version: (newOrder.version || 0) + 1 
    };
    
    if (editingOrder) {
      setOrders(orders.map(o => o.id === newOrder.id ? orderWithVersion : o));
    } else {
      setOrders([...orders, { ...orderWithVersion, createdAt: newOrder.createdAt || new Date().toISOString().split('T')[0] }]);
    }
    setEditingOrder(null);
  };

  /**
   * 统一导入处理
   * @param mode 'append' (追加), 'merge' (基于版本的合并), 'replace' (清空并替换)
   */
  const handleImportOrders = (newOrders: Order[], mode: 'append' | 'merge' | 'replace' = 'append') => {
    if (mode === 'replace') {
      // 全量替换模式：直接清空并应用
      setOrders(newOrders);
      setMergeSummary({ updated: 0, added: newOrders.length, replaced: true });
    } else if (mode === 'merge') {
      // 智能融合模式
      let updated = 0;
      let added = 0;
      const mergedMap = new Map<string, Order>();
      orders.forEach(o => mergedMap.set(o.id, o));

      newOrders.forEach(incoming => {
        const existing = mergedMap.get(incoming.id);
        if (existing) {
          const existingScore = (existing.version || 0) * 1000 + new Date(existing.updatedAt).getTime() / 1000000;
          const incomingScore = (incoming.version || 0) * 1000 + new Date(incoming.updatedAt).getTime() / 1000000;
          
          if (incomingScore > existingScore) {
            mergedMap.set(incoming.id, incoming);
            updated++;
          }
        } else {
          mergedMap.set(incoming.id, incoming);
          added++;
        }
      });
      setOrders(Array.from(mergedMap.values()));
      setMergeSummary({ updated, added, replaced: false });
    } else {
      // 标准追加模式
      setOrders([...orders, ...newOrders]);
      setMergeSummary({ updated: 0, added: newOrders.length, replaced: false });
    }
    
    setTimeout(() => setMergeSummary(null), 5000);
  };

  const handleStartEdit = (order: Order) => {
    setEditingOrder(order);
    setIsCreateModalOpen(true);
  };

  const handleDeleteOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
    setPriorityOrderIds(priorityOrderIds.filter(pid => pid !== id));
    setEditingOrder(null);
  };

  return (
    <div className="flex min-h-screen bg-[#F2F4F0] text-[#2D3A30]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-10 pb-24 lg:pb-10 overflow-y-auto custom-scrollbar">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-[#1B241D] truncate tracking-tight uppercase">
              {activeTab === 'dashboard' ? 'Overview' : activeTab === 'calendar' ? 'Schedule' : activeTab === 'orders' ? 'Projects' : activeTab === 'finance' ? 'Finance' : activeTab === 'settings' ? 'Settings' : 'AI Assistant'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {mergeSummary && (
              <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border animate-in fade-in slide-in-from-right-4 ${mergeSummary.replaced ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">
                  {mergeSummary.replaced 
                    ? `重载成功：已清空并载入 ${mergeSummary.added} 项` 
                    : `融合成功：更新 ${mergeSummary.updated} 项 / 新增 ${mergeSummary.added} 项`}
                </span>
              </div>
            )}
            
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-5 py-3 bg-[#EDF1EE] text-[#3A5A40] border border-[#D1D9D3] rounded-xl hover:bg-[#D1D9D3] transition-all group"
              title="AI 截图排单"
            >
              <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="font-bold text-[11px] uppercase tracking-widest">AI 识图排单</span>
            </button>

            <button 
              onClick={() => setIsSyncModalOpen(true)} 
              className="flex items-center justify-center gap-2 px-3 py-3 md:px-5 bg-[#3A5A40] text-white rounded-xl hover:opacity-90 transition-all shadow-md"
              title="同步中心"
            >
              <FileSpreadsheet className="w-4 h-4" /> 
              <span className="hidden md:inline font-bold text-[11px] uppercase tracking-widest">同步中心</span>
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)} 
              className="p-3 bg-white text-[#3A5A40] border border-[#E2E8E4] rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
              title="创建新项目"
            >
              <Plus className="w-4 h-4" /> 
            </button>
          </div>
        </header>

        {insights && (
          <div className="mb-8 p-5 bg-white border border-[#E2E8E4] rounded-2xl text-[#2D3A30] flex items-start gap-4 shadow-sm">
            <Sparkles className="w-4 h-4 mt-1 flex-shrink-0 text-[#3A5A40]" />
            <p className="text-[11px] font-bold leading-relaxed tracking-wide">{insights}</p>
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard orders={orders} priorityOrderIds={priorityOrderIds} onUpdatePriorityIds={setPriorityOrderIds} settings={settings} />}
        {activeTab === 'calendar' && <CalendarView orders={orders} onEditOrder={handleStartEdit} settings={settings} />}
        {activeTab === 'orders' && <OrderList orders={orders} onEditOrder={handleStartEdit} settings={settings} />}
        {activeTab === 'finance' && <FinanceView orders={orders} settings={settings} />}
        {activeTab === 'settings' && <SettingsView settings={settings} setSettings={setSettings} />}
        {activeTab === 'ai-assistant' && (
          <div className="bg-[#EDF1EE] rounded-[2rem] p-12 border border-[#D1D9D3] max-w-2xl mx-auto mt-4 text-center">
            <div className="bg-[#3A5A40] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-4 text-[#2D3A30] tracking-tight">AI 调度分析助手</h2>
            <button onClick={() => getSchedulingInsights(orders).then(setInsights)} className="w-full bg-[#3A5A40] text-white py-4 rounded-xl font-bold hover:opacity-95 transition-all shadow-lg">
              <Sparkles className="w-4 h-4 inline mr-2" /> 立即分析
            </button>
          </div>
        )}
      </main>

      <CreateOrderModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingOrder(null); }} onSave={handleSaveOrder} onDelete={handleDeleteOrder} initialOrder={editingOrder} settings={settings} />
      <SyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} orders={orders} onImportOrders={handleImportOrders} />
      <SocialShareModal isOpen={isSocialModalOpen} onClose={() => setIsSocialModalOpen(false)} orders={orders} />
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={(newOnes) => handleImportOrders(newOnes, 'append')} />
    </div>
  );
};

export default App;
