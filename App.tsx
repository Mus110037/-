
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
import { Sparkles, BrainCircuit, Plus, FileSpreadsheet, Share2 } from 'lucide-react';
import { getSchedulingInsights } from './services/geminiService';

const STORAGE_KEY = 'artnexus_orders_v5';
const SETTINGS_KEY = 'artnexus_settings_v5';
const THEME_KEY = 'artnexus_theme_v5';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
          <div className="bg-[#EAE8E0] dark:bg-[#1A1D23] rounded-[2rem] p-12 border border-[#D9D5CB] dark:border-[#2D3139] max-w-2xl mx-auto mt-4 text-center">
            <div className="bg-[#333333] dark:bg-[#E0E0E0] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <BrainCircuit className="w-8 h-8 text-[#F5F5F0] dark:text-[#0F1115]" />
            </div>
            <h2 className="text-xl font-bold mb-4 text-[#333333] dark:text-[#E0E0E0] tracking-tight uppercase">AI 排单管家</h2>
            <p className="text-[11px] text-[#8E8B82] dark:text-[#8E9AAF] mb-10 leading-relaxed font-bold uppercase tracking-widest">分析创作周期，优化交付方案</p>
            <button 
              onClick={() => getSchedulingInsights(orders).then(setInsights)}
              className="w-full bg-[#333333] dark:bg-[#E0E0E0] text-white dark:text-[#0F1115] py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg"
            >
              <Sparkles className="w-4 h-4 inline mr-2" /> 运行智能分析
            </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0F1115] text-[#E0E0E0]' : 'bg-[#F5F5F0] text-[#333333]'}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-10 pb-24 lg:pb-10 overflow-y-auto custom-scrollbar">
        <header className="flex items-center justify-between mb-8">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-[#333333] dark:text-[#E0E0E0] truncate tracking-tight uppercase">
              {activeTab === 'dashboard' ? 'Overview' : 
               activeTab === 'calendar' ? 'Schedule' : 
               activeTab === 'orders' ? 'Projects' : 
               activeTab === 'finance' ? 'Finance' : 
               activeTab === 'settings' ? 'Workspace' : 'AI Assistant'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSocialModalOpen(true)} className="p-3 bg-white dark:bg-[#1A1D23] text-[#8E8B82] dark:text-[#8E9AAF] border border-[#E0DDD5] dark:border-[#2D3139] rounded-xl hover:text-[#333333] dark:hover:text-[#E0E0E0] transition-all shadow-sm">
              <Share2 className="w-4 h-4" /> 
            </button>
            <button onClick={() => setIsSyncModalOpen(true)} className="p-3 bg-white dark:bg-[#1A1D23] text-[#8E8B82] dark:text-[#8E9AAF] border border-[#E0DDD5] dark:border-[#2D3139] rounded-xl hover:text-[#333333] dark:hover:text-[#E0E0E0] transition-all shadow-sm">
              <FileSpreadsheet className="w-4 h-4" /> 
            </button>
            <button onClick={() => setIsCreateModalOpen(true)} className="p-3 bg-[#333333] dark:bg-[#E0E0E0] text-white dark:text-[#0F1115] rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-md">
              <Plus className="w-4 h-4" /> 
              <span className="hidden md:inline font-bold text-[11px] uppercase tracking-widest">录入企划</span>
            </button>
          </div>
        </header>

        {insights && (
          <div className="mb-8 p-5 bg-white dark:bg-[#1A1D23] border border-[#E0DDD5] dark:border-[#2D3139] rounded-2xl text-[#333333] dark:text-[#E0E0E0] flex items-start gap-4 shadow-sm">
            <Sparkles className="w-4 h-4 mt-1 flex-shrink-0 text-[#A3B18A] dark:text-[#A3B18A]" />
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
