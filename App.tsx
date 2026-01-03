
import React, { useState, useEffect } from 'react';
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
import { Order, OrderStatus, DEFAULT_STAGES, DEFAULT_SOURCES, DEFAULT_ART_TYPES, DEFAULT_PERSON_COUNTS, SAMPLE_ORDERS, AppSettings } from './types';
import { Sparkles, BrainCircuit, Plus, FileSpreadsheet, Share2, CloudSync, Cloud, CloudOff, History } from 'lucide-react';
import { getSchedulingInsights } from './services/geminiService';

const STORAGE_KEY = 'artnexus_orders_v5';
const SETTINGS_KEY = 'artnexus_settings_v5';
const SNAPSHOT_KEY = 'artnexus_auto_snapshots';

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
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [syncState, setSyncState] = useState<'active' | 'manual' | 'disconnected'>('disconnected');

  useEffect(() => {
    const hasLinked = localStorage.getItem('artnexus_linked_file');
    const supportsAPI = 'showSaveFilePicker' in window && window.self === window.top;
    if (hasLinked && supportsAPI) setSyncState('active');
    else if (!supportsAPI) setSyncState('manual');
    else setSyncState('disconnected');
  }, [isSyncModalOpen]);

  // 本地存储同步 + 自动快照
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    
    // 自动快照：每当数据变动，保存当前版本（最多保留 5 个）
    const timer = setTimeout(() => {
      const savedSnapshots = localStorage.getItem(SNAPSHOT_KEY);
      let snaps = savedSnapshots ? JSON.parse(savedSnapshots) : [];
      
      const newSnap = {
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        data: orders
      };

      // 避免重复保存相同数据
      if (snaps.length > 0 && JSON.stringify(snaps[snaps.length - 1].data) === JSON.stringify(orders)) {
        return;
      }

      snaps.push(newSnap);
      if (snaps.length > 5) snaps.shift();
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snaps));
    }, 2000); // 延迟 2 秒保存，避免输入时的频繁写入

    return () => clearTimeout(timer);
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

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
    if (editingOrder) {
      setOrders(orders.map(o => o.id === newOrder.id ? newOrder : o));
    } else {
      const orderWithTime = { ...newOrder, createdAt: newOrder.createdAt || new Date().toISOString().split('T')[0] };
      setOrders([...orders, orderWithTime]);
    }
    setEditingOrder(null);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return <Dashboard orders={orders} priorityOrderIds={priorityOrderIds} onUpdatePriorityIds={setPriorityOrderIds} settings={settings} />;
      case 'calendar': return <CalendarView orders={orders} onEditOrder={handleStartEdit} settings={settings} />;
      case 'orders': return <OrderList orders={orders} onEditOrder={handleStartEdit} settings={settings} />;
      case 'finance': return <FinanceView orders={orders} settings={settings} />;
      case 'settings': return <SettingsView settings={settings} setSettings={setSettings} />;
      case 'ai-assistant':
        return (
          <div className="bg-[#EAE8E0] rounded-[2rem] p-12 border border-[#D9D5CB] max-w-2xl mx-auto mt-4 text-center">
            <div className="bg-[#333333] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <BrainCircuit className="w-8 h-8 text-[#F5F5F0]" />
            </div>
            <h2 className="text-xl font-bold mb-4 text-[#333333] tracking-tight uppercase">AI 排单管家</h2>
            <p className="text-[11px] text-[#8E8B82] mb-10 leading-relaxed font-bold uppercase tracking-widest">分析创作周期，优化交付方案</p>
            <button 
              onClick={() => getSchedulingInsights(orders).then(setInsights)}
              className="w-full bg-[#333333] text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
            >
              <Sparkles className="w-4 h-4 inline mr-2" /> 运行智能分析
            </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F0] text-[#333333]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-10 pb-24 lg:pb-10 overflow-y-auto custom-scrollbar">
        <header className="flex items-center justify-between mb-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
               {syncState === 'active' ? (
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                    <Cloud className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-black uppercase">Live Sync</span>
                 </div>
               ) : (
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-200 text-slate-500 rounded-full">
                    <History className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-black uppercase">Auto-Snapshot</span>
                 </div>
               )}
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[#2D2D2A] truncate tracking-tight uppercase">
              {activeTab === 'dashboard' ? 'Overview' : 
               activeTab === 'calendar' ? 'Schedule' : 
               activeTab === 'orders' ? 'Projects' : 
               activeTab === 'finance' ? 'Finance' : 
               activeTab === 'settings' ? 'Workspace' : 'AI Assistant'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSocialModalOpen(true)} className="p-3 bg-white text-[#8E8B82] border border-[#E0DDD5] rounded-xl hover:text-[#2D2D2A] transition-all shadow-sm">
              <Share2 className="w-4 h-4" /> 
            </button>
            <button onClick={() => setIsSyncModalOpen(true)} className="p-3 bg-white text-[#8E8B82] border border-[#E0DDD5] rounded-xl hover:text-[#2D2D2A] transition-all shadow-sm relative group">
              <FileSpreadsheet className="w-4 h-4" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-[#A3B18A]"></div>
            </button>
            <button onClick={() => setIsCreateModalOpen(true)} className="p-3 bg-[#333333] text-white rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-md">
              <Plus className="w-4 h-4" /> 
              <span className="hidden md:inline font-bold text-[11px] uppercase tracking-widest">录入企划</span>
            </button>
          </div>
        </header>

        {insights && (
          <div className="mb-8 p-5 bg-white border border-[#E0DDD5] rounded-2xl text-[#2D2D2A] flex items-start gap-4 shadow-sm">
            <Sparkles className="w-4 h-4 mt-1 flex-shrink-0 text-[#A3B18A]" />
            <p className="text-[11px] font-bold leading-relaxed tracking-wide">{insights}</p>
          </div>
        )}

        {renderContent()}
      </main>

      <CreateOrderModal 
        isOpen={isCreateModalOpen} 
        onClose={() => { setIsCreateModalOpen(false); setEditingOrder(null); }} 
        onSave={handleSaveOrder} 
        onDelete={handleDeleteOrder} 
        initialOrder={editingOrder}
        settings={settings}
      />
      <SyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} orders={orders} onImportOrders={setOrders} />
      <SocialShareModal isOpen={isSocialModalOpen} onClose={() => setIsSocialModalOpen(false)} orders={orders} />
    </div>
  );
};

export default App;
