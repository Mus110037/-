
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
    // 初始化时尝试从本地存储读取
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });
  const [priorityOrderIds, setPriorityOrderIds] = useState<string[]>([]);
  const [insights, setInsights] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // 每当 orders 改变时，自动保存到本地存储
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
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-200 max-w-2xl mx-auto mt-4 text-center shadow-sm">
            <div className="bg-violet-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner shadow-violet-100">
              <BrainCircuit className="w-10 h-10 text-violet-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900">AI 排单管家</h2>
            <p className="text-sm md:text-base text-slate-500 mb-10 leading-relaxed">
              分析您的待办稿件，并根据 DDL 紧张程度提供调度建议。
            </p>
            <button 
              onClick={() => getSchedulingInsights(orders).then(setInsights)}
              className="w-full bg-violet-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-violet-700 transition-all shadow-xl shadow-violet-100"
            >
              <Sparkles className="w-5 h-5" />
              重新生成 AI 建议
            </button>
          </div>
        );
      default: return <Dashboard orders={orders} priorityOrderIds={priorityOrderIds} onUpdatePriorityIds={handleUpdatePriorityIds} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-8 pb-24 lg:pb-8 overflow-y-auto custom-scrollbar">
        <header className="flex items-center justify-between mb-6 md:mb-8">
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-slate-900 truncate">
              {activeTab === 'dashboard' ? '工作台' : 
               activeTab === 'calendar' ? '排单日历' : 
               activeTab === 'orders' ? '稿件清单' : 
               activeTab === 'finance' ? '财务统计' : 'AI 助手'}
            </h1>
            <p className="text-[10px] md:text-sm text-slate-500 mt-1 uppercase tracking-wider font-bold opacity-70">ArtNexus Pro</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSyncModalOpen(true)}
              className="p-3 bg-white text-slate-600 border border-slate-200 rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
              title="同步中心"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> 
              <span className="hidden md:inline font-bold text-sm">同步</span>
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="p-3 bg-violet-600 text-white rounded-2xl flex items-center gap-2 hover:bg-violet-700 transition-all shadow-lg shadow-violet-100"
            >
              <Plus className="w-4 h-4" /> 
              <span className="hidden md:inline font-bold text-sm">接稿</span>
            </button>
          </div>
        </header>

        {insights && (
          <div className="mb-6 md:mb-8 p-4 md:p-5 bg-violet-600 rounded-[2rem] text-white flex items-start gap-4 shadow-xl shadow-violet-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <Sparkles className="w-5 h-5 mt-1 flex-shrink-0 text-violet-200" />
            <div className="relative z-10">
              <p className="text-xs md:text-sm font-medium leading-relaxed">{insights}</p>
            </div>
          </div>
        )}

        {renderContent()}
      </main>

      <CreateOrderModal 
        isOpen={isCreateModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveOrder} 
        onDelete={handleDeleteOrder}
        initialOrder={editingOrder}
      />

      <SyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
        orders={orders} 
      />
    </div>
  );
};

export default App;
