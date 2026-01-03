
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import CalendarView from './components/CalendarView';
import FinanceView from './components/FinanceView';
import CreateOrderModal from './components/CreateOrderModal';
import SyncModal from './components/SyncModal';
import { Order, OrderStatus } from './types';
import { Sparkles, BrainCircuit, Plus, FileSpreadsheet } from 'lucide-react';
import { getSchedulingInsights } from './services/geminiService';

const STORAGE_KEY = 'artnexus_orders_data';

const INITIAL_ORDERS: Order[] = [
  { id: 'o-1', title: '示例：全彩插画委托', priority: '中', duration: 8, deadline: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], createdAt: '2025-05-01', status: OrderStatus.PENDING, progressStage: '色稿', commissionType: '商用', personCount: '单人', artType: '全身', source: '米画师', totalPrice: 2400, description: '首次使用请删除此示例' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
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

  const handleImportOrders = (imported: Order[]) => {
    setOrders(imported);
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

  const handleUpdatePriorityIds = (ids: string[]) => {
    setPriorityOrderIds(ids);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingOrder(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return <Dashboard 
          orders={orders} 
          priorityOrderIds={priorityOrderIds} 
          onUpdatePriorityIds={handleUpdatePriorityIds} 
        />;
      case 'calendar': return <CalendarView orders={orders} onEditOrder={handleStartEdit} />;
      case 'orders': return <OrderList orders={orders} onAddNew={() => setIsCreateModalOpen(true)} onEditOrder={handleStartEdit} />;
      case 'finance': return <FinanceView orders={orders} />;
      case 'ai-assistant':
        return (
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 max-w-2xl mx-auto mt-4 text-center shadow-sm">
            <div className="bg-violet-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <BrainCircuit className="w-10 h-10 text-violet-600" />
            </div>
            <h2 className="text-2xl font-black mb-4 text-slate-800 tracking-tight">AI 排单管家</h2>
            <p className="text-xs text-slate-400 mb-10 leading-relaxed font-bold uppercase tracking-widest">
              深度算法分析稿件周期，让创作更自由
            </p>
            <button 
              onClick={() => getSchedulingInsights(orders).then(setInsights)}
              className="w-full bg-violet-600 text-white py-4 rounded-2xl font-black hover:bg-violet-700 transition-all shadow-xl shadow-violet-100"
            >
              <Sparkles className="w-5 h-5 inline mr-2" /> 重新分析调度
            </button>
          </div>
        );
      default: return <Dashboard orders={orders} priorityOrderIds={priorityOrderIds} onUpdatePriorityIds={handleUpdatePriorityIds} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-8 pb-24 lg:pb-8 overflow-y-auto custom-scrollbar">
        <header className="flex items-center justify-between mb-8">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-slate-800 truncate tracking-tight uppercase">
              {activeTab === 'dashboard' ? 'Overview' : 
               activeTab === 'calendar' ? 'Schedule' : 
               activeTab === 'orders' ? 'Projects' : 
               activeTab === 'finance' ? 'Finance' : 'AI Assistant'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse"></span>
               <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black">Professional Creative Flow</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSyncModalOpen(true)}
              className="p-3 bg-white text-slate-400 border border-slate-100 rounded-2xl hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" /> 
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="p-3 bg-violet-600 text-white rounded-2xl flex items-center gap-2 hover:bg-violet-700 transition-all shadow-lg shadow-violet-100"
            >
              <Plus className="w-4 h-4" /> 
              <span className="hidden md:inline font-black text-[10px] uppercase tracking-widest">录入企划</span>
            </button>
          </div>
        </header>

        {insights && (
          <div className="mb-8 p-5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[2.2rem] text-white flex items-start gap-4 shadow-xl shadow-violet-100 relative overflow-hidden">
            <Sparkles className="w-4 h-4 mt-1 flex-shrink-0 text-violet-200" />
            <p className="text-[11px] font-bold leading-relaxed tracking-wide z-10">{insights}</p>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          </div>
        )}

        {renderContent()}
      </main>

      <CreateOrderModal isOpen={isCreateModalOpen} onClose={handleCloseModal} onSave={handleSaveOrder} onDelete={handleDeleteOrder} initialOrder={editingOrder} />
      <SyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} orders={orders} onImportOrders={handleImportOrders} />
    </div>
  );
};

export default App;
