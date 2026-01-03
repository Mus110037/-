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
// Added X to imports to fix 'Cannot find name X' error
import { Sparkles, BrainCircuit, Plus, FileSpreadsheet, Share2, Cloud, History, TabletSmartphone, CheckCircle2, Zap, Wand2, Download, RefreshCw, X } from 'lucide-react';
import { getSchedulingInsights } from './services/geminiService';
import { format, differenceInDays } from 'date-fns';
import * as XLSX from 'xlsx';

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

  const handleUpdateSettings = (newSettings: AppSettings) => {
    const updatedOrders = orders.map(order => {
      let updatedOrder = { ...order };
      let hasChanged = false;

      const oldStageIdx = settings.stages.findIndex(s => s.name === order.progressStage);
      if (oldStageIdx !== -1 && newSettings.stages[oldStageIdx]) {
        const newStageName = newSettings.stages[oldStageIdx].name;
        if (newStageName !== order.progressStage) {
          updatedOrder.progressStage = newStageName;
          hasChanged = true;
        }
      }

      const oldSourceIdx = settings.sources.findIndex(s => s.name === order.source);
      if (oldSourceIdx !== -1 && newSettings.sources[oldSourceIdx]) {
        const newSourceName = newSettings.sources[oldSourceIdx].name;
        if (newSourceName !== order.source) {
          updatedOrder.source = newSourceName;
          hasChanged = true;
        }
      }

      return hasChanged ? updatedOrder : order;
    });

    setOrders(updatedOrders);
    setSettings(newSettings);
  };

  const handleExportExcel = () => {
    if (orders.length === 0) return alert("当前没有可导出的企划数据。");
    const headers = ['企划', '金额', '截稿日期', '加入企划时间', '企划人数', '企划类型', '进度阶段', '来源', '实收金额(净)'];
    const data = orders.map(o => {
      const source = settings.sources.find(s => s.name === o.source) || { name: o.source, fee: 0 };
      const actualPrice = o.totalPrice * (1 - (source.fee || 0) / 100);
      return [o.title, o.totalPrice, o.deadline, o.createdAt, o.personCount, o.artType, o.progressStage, o.source, actualPrice];
    });
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "企划排单表");
    XLSX.writeFile(wb, `艺策导出_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const handleSaveOrder = (newOrder: Order) => {
    const orderWithVersion = { ...newOrder, updatedAt: new Date().toISOString(), version: (newOrder.version || 0) + 1 };
    if (editingOrder) {
      setOrders(orders.map(o => o.id === newOrder.id ? orderWithVersion : o));
    } else {
      setOrders([...orders, { ...orderWithVersion, createdAt: newOrder.createdAt || new Date().toISOString().split('T')[0] }]);
    }
    setEditingOrder(null);
  };

  /**
   * 核心导入合并逻辑
   */
  const handleImportOrders = (newOrders: Order[], mode: 'append' | 'merge' | 'replace' = 'merge') => {
    if (mode === 'replace') {
      setOrders(newOrders);
      setMergeSummary({ updated: 0, added: newOrders.length, replaced: true });
    } else if (mode === 'merge') {
      let updatedCount = 0;
      let addedCount = 0;
      
      // 使用 名称+日期 作为唯一键
      // Fix: Explicitly type existingKeyMap to avoid 'unknown' type errors during merge
      const existingKeyMap = new Map<string, Order>(orders.map(o => [`${o.title.trim()}-${o.deadline}`, o]));
      const resultOrders = [...orders];

      newOrders.forEach(newO => {
        const key = `${newO.title.trim()}-${newO.deadline}`;
        const existing = existingKeyMap.get(key);
        
        if (existing) {
          // 智能合并：更新关键字段，保留 ID 和 初始创建时间
          const idx = resultOrders.findIndex(o => o.id === existing.id);
          if (idx !== -1) {
            resultOrders[idx] = { 
              ...existing, 
              ...newO, 
              id: existing.id, 
              createdAt: existing.createdAt,
              priority: existing.priority, // 保留本地设置的优先级
              updatedAt: new Date().toISOString(),
              version: (existing.version || 0) + 1
            };
            updatedCount++;
          }
        } else {
          // 全新项：直接追加
          resultOrders.push(newO);
          addedCount++;
        }
      });

      setOrders(resultOrders);
      setMergeSummary({ updated: updatedCount, added: addedCount, replaced: false });
    } else {
      setOrders([...orders, ...newOrders]);
      setMergeSummary({ updated: 0, added: newOrders.length, replaced: false });
    }
    
    // 5秒后清除同步摘要
    setTimeout(() => setMergeSummary(null), 5000);
  };

  const handleStartEdit = (order: Order) => {
    setEditingOrder(order);
    setIsCreateModalOpen(true);
  };

  const handleDeleteOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
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
            <button onClick={() => setIsImportModalOpen(true)} className="hidden md:flex items-center gap-2 px-5 py-3 bg-[#EDF1EE] text-[#3A5A40] border border-[#D1D9D3] rounded-xl hover:bg-[#D1D9D3] transition-all group">
              <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="font-bold text-[11px] uppercase tracking-widest">排单助手</span>
            </button>
            <button onClick={handleExportExcel} className="hidden md:flex items-center gap-2 px-5 py-3 bg-white text-[#4F6D58] border border-[#D1D9D3] rounded-xl hover:bg-slate-50 transition-all">
              <Download className="w-4 h-4" />
              <span className="font-bold text-[11px] uppercase tracking-widest">导出报表</span>
            </button>
            <button onClick={() => setIsSyncModalOpen(true)} className="flex items-center justify-center gap-2 px-3 py-3 md:px-5 bg-[#3A5A40] text-white rounded-xl hover:opacity-90 shadow-md">
              <FileSpreadsheet className="w-4 h-4" /> 
              <span className="hidden md:inline font-bold text-[11px] uppercase tracking-widest">同步中心</span>
            </button>
            <button onClick={() => setIsCreateModalOpen(true)} className="p-3 bg-white text-[#3A5A40] border border-[#E2E8E4] rounded-xl shadow-sm">
              <Plus className="w-4 h-4" /> 
            </button>
          </div>
        </header>

        {/* 导入结果反馈条 */}
        {mergeSummary && (
          <div className="mb-6 p-4 bg-[#2D3A30] text-white rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-emerald-500 rounded-lg"><RefreshCw className="w-4 h-4 text-white" /></div>
               <div>
                 <p className="text-[11px] font-black uppercase tracking-widest">智能合并成功</p>
                 <p className="text-[9px] text-[#A3B18A] font-bold mt-0.5">
                   {mergeSummary.replaced ? '全量替换了所有数据' : `更新了 ${mergeSummary.updated} 项已有企划，追加了 ${mergeSummary.added} 项新企划`}
                 </p>
               </div>
             </div>
             <button onClick={() => setMergeSummary(null)} className="text-[#A3B18A] hover:text-white transition-colors p-1"><X className="w-4 h-4" /></button>
          </div>
        )}

        {insights && (
          <div className="mb-8 p-5 bg-white border border-[#E2E8E4] rounded-2xl text-[#2D3A30] flex items-start gap-4 shadow-sm">
            <Sparkles className="w-4 h-4 mt-1 flex-shrink-0 text-[#3A5A40]" />
            <p className="text-[11px] font-bold leading-relaxed tracking-wide">{insights}</p>
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard orders={orders} priorityOrderIds={priorityOrderIds} onUpdatePriorityIds={setPriorityOrderIds} onEditOrder={handleStartEdit} settings={settings} />}
        {activeTab === 'calendar' && <CalendarView orders={orders} onEditOrder={handleStartEdit} settings={settings} />}
        {activeTab === 'orders' && <OrderList orders={orders} onEditOrder={handleStartEdit} settings={settings} />}
        {activeTab === 'finance' && <FinanceView orders={orders} settings={settings} />}
        {activeTab === 'settings' && <SettingsView settings={settings} setSettings={handleUpdateSettings} />}
        {activeTab === 'ai-assistant' && (
          <div className="bg-[#EDF1EE] rounded-[2rem] p-12 border border-[#D1D9D3] max-w-2xl mx-auto mt-4 text-center">
            <div className="bg-[#3A5A40] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-4 text-[#2D3A30] tracking-tight">AI 调度分析助手</h2>
            <button onClick={() => getSchedulingInsights(orders).then(setInsights)} className="w-full bg-[#3A5A40] text-white py-4 rounded-xl font-bold hover:opacity-95 shadow-lg">
              <Sparkles className="w-4 h-4 inline mr-2" /> 立即分析
            </button>
          </div>
        )}
      </main>

      <CreateOrderModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingOrder(null); }} onSave={handleSaveOrder} onDelete={handleDeleteOrder} initialOrder={editingOrder} settings={settings} />
      <SyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} orders={orders} onImportOrders={handleImportOrders} />
      <SocialShareModal isOpen={isSocialModalOpen} onClose={() => setIsSocialModalOpen(false)} orders={orders} />
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={(newOnes) => handleImportOrders(newOnes, 'merge')} />
    </div>
  );
};

export default App;