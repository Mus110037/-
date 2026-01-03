
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
import { Sparkles, BrainCircuit, Plus, FileSpreadsheet, Share2, Cloud, History, TabletSmartphone, CheckCircle2, Zap } from 'lucide-react';
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [syncState, setSyncState] = useState<'active' | 'mobile' | 'manual'>('manual');
  const fileHandleRef = useRef<any>(null);

  useEffect(() => {
    const checkFileSupport = async () => {
      if ('showSaveFilePicker' in window) {
        const hasLinked = localStorage.getItem('artnexus_linked_active');
        if (hasLinked) setSyncState('active');
      } else {
        setSyncState('mobile');
      }
    };
    checkFileSupport();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    if (syncState === 'active') {
      window.dispatchEvent(new CustomEvent('artnexus_auto_save', { detail: orders }));
    }
    const timer = setTimeout(() => {
      const savedSnapshots = localStorage.getItem(SNAPSHOT_KEY);
      let snaps = savedSnapshots ? JSON.parse(savedSnapshots) : [];
      const newSnap = {
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        data: orders
      };
      if (snaps.length > 0 && JSON.stringify(snaps[snaps.length - 1].data) === JSON.stringify(orders)) return;
      snaps.push(newSnap);
      if (snaps.length > 5) snaps.shift();
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snaps));
    }, 2000);
    return () => clearTimeout(timer);
  }, [orders, syncState]);

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
    if (editingOrder) {
      setOrders(orders.map(o => o.id === newOrder.id ? newOrder : o));
    } else {
      const orderWithTime = { ...newOrder, createdAt: newOrder.createdAt || new Date().toISOString().split('T')[0] };
      setOrders([...orders, orderWithTime]);
    }
    setEditingOrder(null);
  };

  const handleImportOrders = (newOrders: Order[]) => {
    setOrders([...orders, ...newOrders]);
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
          <div className="bg-[#EDF1EE] rounded-[2rem] p-12 border border-[#D1D9D3] max-w-2xl mx-auto mt-4 text-center">
            <div className="bg-[#3A5A40] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-4 text-[#2D3A30] tracking-tight">AI 调度分析助手</h2>
            <p className="text-[11px] text-[#4F6D58] mb-10 leading-relaxed font-bold uppercase tracking-widest">基于当前企划状态，为您提供最优生产建议</p>
            <button 
              onClick={() => getSchedulingInsights(orders).then(setInsights)}
              className="w-full bg-[#3A5A40] text-white py-4 rounded-xl font-bold hover:opacity-95 transition-all shadow-lg"
            >
              <Sparkles className="w-4 h-4 inline mr-2" /> 立即生成分析报告
            </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F2F4F0] text-[#2D3A30]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-10 pb-24 lg:pb-10 overflow-y-auto custom-scrollbar">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
               {syncState === 'active' ? (
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    <Cloud className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-black uppercase tracking-wider">自动同步中</span>
                 </div>
               ) : syncState === 'mobile' ? (
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#DAD7CD] text-[#3A5A40] rounded-full">
                    <TabletSmartphone className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-black uppercase tracking-wider">移动端模式</span>
                 </div>
               ) : (
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#D1D9D3] text-[#3A5A40] rounded-full">
                    <History className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-black uppercase tracking-wider">本地存储</span>
                 </div>
               )}
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[#1B241D] truncate tracking-tight uppercase">
              {activeTab === 'dashboard' ? 'Overview' : 
               activeTab === 'calendar' ? 'Schedule' : 
               activeTab === 'orders' ? 'Projects' : 
               activeTab === 'finance' ? 'Finance' : 
               activeTab === 'settings' ? 'Settings' : 'AI Assistant'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex-1 md:flex-none p-3 bg-white text-[#3A5A40] border border-[#E2E8E4] rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#EDF1EE] transition-all shadow-sm"
            >
              <Zap className="w-4 h-4" /> 
              <span>米画师同步</span>
            </button>
            <button onClick={() => setIsSocialModalOpen(true)} className="p-3 bg-white text-[#4F6D58] border border-[#E2E8E4] rounded-xl hover:text-[#2D3A30] transition-all shadow-sm">
              <Share2 className="w-4 h-4" /> 
            </button>
            <button onClick={() => setIsSyncModalOpen(true)} className="p-3 bg-white text-[#4F6D58] border border-[#E2E8E4] rounded-xl hover:text-[#2D3A30] transition-all shadow-sm relative group">
              <FileSpreadsheet className="w-4 h-4" />
              {syncState === 'active' && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500"></div>}
            </button>
            <button onClick={() => setIsCreateModalOpen(true)} className="p-3 bg-[#3A5A40] text-white rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-md">
              <Plus className="w-4 h-4" /> 
              <span className="hidden md:inline font-bold text-[11px] uppercase tracking-widest">新建企划</span>
            </button>
          </div>
        </header>

        {insights && (
          <div className="mb-8 p-5 bg-white border border-[#E2E8E4] rounded-2xl text-[#2D3A30] flex items-start gap-4 shadow-sm">
            <Sparkles className="w-4 h-4 mt-1 flex-shrink-0 text-[#3A5A40]" />
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
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImportOrders} />
    </div>
  );
};

export default App;
