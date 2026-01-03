
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
import { Order, OrderStatus, DEFAULT_STAGES, DEFAULT_SOURCES, DEFAULT_ART_TYPES, DEFAULT_PERSON_COUNTS, AppSettings } from './types';
import { Sparkles, BrainCircuit, Plus, FileSpreadsheet, Palette } from 'lucide-react';
import { getSchedulingInsights } from './services/geminiService';

const STORAGE_KEY = 'artnexus_orders_data_v4';
const SETTINGS_KEY = 'artnexus_app_settings_v4';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
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
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

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
        return <Dashboard 
          orders={orders} 
          priorityOrderIds={priorityOrderIds} 
          onUpdatePriorityIds={setPriorityOrderIds}
          settings={settings}
        />;
      case 'calendar': return <CalendarView orders={orders} onEditOrder={handleStartEdit} settings={settings} />;
      case 'orders': return <OrderList orders={orders} onEditOrder={handleStartEdit} settings={settings} />;
      case 'finance': return <FinanceView orders={orders} settings={settings} />;
      case 'settings': return <SettingsView settings={settings} setSettings={setSettings} />;
      case 'ai-assistant':
        return (
          <div className="bg-white rounded-[3rem] p-12 border border-slate-100 max-w-2xl mx-auto mt-4 text-center shadow-sm">
            <div className="bg-sky-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <BrainCircuit className="w-12 h-12 text-sky-300" />
            </div>
            <h2 className="text-2xl font-black mb-4 text-slate-800 tracking-tight">AI 排单管家</h2>
            <p className="text-xs text-slate-400 mb-10 leading-relaxed font-bold uppercase tracking-widest">
              分析创作周期，优化交付方案
            </p>
            <button 
              onClick={() => getSchedulingInsights(orders).then(setInsights)}
              className="w-full bg-[#BEE3F8] text-sky-800 py-4 rounded-2xl font-black hover:bg-sky-200 transition-all shadow-lg shadow-sky-50"
            >
              <Sparkles className="w-5 h-5 inline mr-2" /> 生成智能见解
            </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FDFDFD]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-10 pb-24 lg:pb-10 overflow-y-auto custom-scrollbar">
        <header className="flex items-center justify-between mb-10">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 truncate tracking-tight uppercase">
              {activeTab === 'dashboard' ? 'Overview' : 
               activeTab === 'calendar' ? 'Schedule' : 
               activeTab === 'orders' ? 'Projects' : 
               activeTab === 'finance' ? 'Finance' : 
               activeTab === 'settings' ? 'Workspace' : 'AI Assistant'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="w-2 h-2 rounded-full bg-sky-200 animate-pulse"></span>
               <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em] font-black">Creator's Personal Studio</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSyncModalOpen(true)} className="p-3.5 bg-white text-slate-300 border border-slate-100 rounded-2xl hover:text-emerald-300 hover:bg-emerald-50 transition-all shadow-sm">
              <FileSpreadsheet className="w-5 h-5" /> 
            </button>
            <button onClick={() => setIsCreateModalOpen(true)} className="p-3.5 bg-[#BEE3F8] text-sky-800 rounded-2xl flex items-center gap-2 hover:bg-sky-200 transition-all shadow-lg shadow-sky-100/50">
              <Plus className="w-5 h-5" /> 
              <span className="hidden md:inline font-black text-[11px] uppercase tracking-widest">录入企划</span>
            </button>
          </div>
        </header>

        {insights && (
          <div className="mb-10 p-6 bg-white border border-sky-100 rounded-[2.5rem] text-sky-800 flex items-start gap-4 shadow-sm relative overflow-hidden">
            <Sparkles className="w-5 h-5 mt-1 flex-shrink-0 text-sky-300" />
            <p className="text-[12px] font-bold leading-relaxed tracking-wide z-10">{insights}</p>
            <div className="absolute top-0 right-0 w-48 h-48 bg-sky-50 rounded-full blur-3xl -mr-20 -mt-20"></div>
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
    </div>
  );
};

export default App;
