
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav'; // 引入移动端导航
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import CalendarView from './components/CalendarView';
import FinanceView from './components/FinanceView';
import CreateOrderModal from './components/CreateOrderModal';
import SyncModal from './components/SyncModal';
import { Order, OrderStatus } from './types';
import { Sparkles, BrainCircuit, Plus, FileSpreadsheet } from 'lucide-react';
import { getSchedulingInsights } from './services/geminiService';

const INITIAL_ORDERS: Order[] = [
  { id: 'o-1', title: '《星际穿越》全彩插画', priority: '中', duration: 8, deadline: '2025-05-20', createdAt: '2025-05-01', status: OrderStatus.PENDING, progressStage: '色稿', commissionType: '商用', personCount: '单人', artType: '全身', source: '米画师', totalPrice: 2400, description: '商业授权' },
  { id: 'o-2', title: '游戏立绘包-角色A', priority: '高', duration: 15, deadline: '2025-05-25', createdAt: '2025-05-05', status: OrderStatus.PENDING, progressStage: '细化', commissionType: '商用', personCount: '单人', artType: '半身', source: '画加', totalPrice: 5000, description: '加急件' },
  { id: 'o-3', title: 'Q版头像委托', priority: '低', duration: 4, deadline: '2025-05-28', createdAt: '2025-05-10', status: OrderStatus.PENDING, progressStage: '未开始', commissionType: '私用', personCount: '多人', artType: '头像', source: 'QQ', totalPrice: 800, description: '自用不买断' },
  { id: 'o-4', title: '角色设定集插页', priority: '高', duration: 12, deadline: '2025-06-15', createdAt: '2025-05-12', status: OrderStatus.PENDING, progressStage: '草稿', commissionType: '商用', personCount: '单人', artType: '全身', source: '米画师', totalPrice: 3500, description: '项目二期' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [priorityOrderIds, setPriorityOrderIds] = useState<string[]>(['o-2', 'o-1']);
  const [insights, setInsights] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loadInsights = async () => {
      const text = await getSchedulingInsights(orders);
      setInsights(text);
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
          <div className="bg-white rounded-[2.5rem] p-12 border border-slate-200 max-w-2xl mx-auto mt-4 text-center shadow-sm">
            <div className="bg-violet-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner shadow-violet-100">
              <BrainCircuit className="w-10 h-10 text-violet-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-slate-900">AI 排单管家</h2>
            <p className="text-slate-500 mb-10 leading-relaxed">
              根据您的创作效率、各平台截稿时间以及稿费权重，为您规划最佳的创作次序。
            </p>
            <button 
              className="w-full bg-violet-600 text-white py-5 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 hover:bg-violet-700 transition-all shadow-xl shadow-violet-100"
            >
              <Sparkles className="w-5 h-5" />
              分析现有排单并提供建议
            </button>
          </div>
        );
      default: return <Dashboard orders={orders} priorityOrderIds={priorityOrderIds} onUpdatePriorityIds={handleUpdatePriorityIds} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* 底部导航栏在桌面端隐藏，手机端显示 */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-8 pb-24 lg:pb-8 overflow-y-auto custom-scrollbar">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {activeTab === 'dashboard' ? '工作台' : 
               activeTab === 'calendar' ? '排单日历' : 
               activeTab === 'orders' ? '稿件清单' : 
               activeTab === 'finance' ? '财务统计' : 'AI 助手'}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">插画师专属创作看板</p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => setIsSyncModalOpen(true)}
              className="p-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all font-bold text-sm"
              title="数据同步中心"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> 
              <span className="hidden md:inline">同步中心</span>
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="p-2.5 bg-violet-600 text-white rounded-xl flex items-center gap-2 hover:bg-violet-700 transition-all shadow-lg shadow-violet-100 font-bold text-sm"
            >
              <Plus className="w-4 h-4" /> 
              <span className="hidden md:inline">快速接稿</span>
            </button>
          </div>
        </header>

        {insights && (
          <div className="mb-8 p-4 md:p-5 bg-violet-600 rounded-[2rem] text-white flex items-start gap-4 shadow-xl shadow-violet-100 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-125 duration-500"></div>
            <Sparkles className="w-5 h-5 mt-1 flex-shrink-0 text-violet-200" />
            <div className="relative z-10">
              <p className="font-bold text-violet-100 text-[10px] uppercase tracking-[0.2em] mb-1">AI 经营简报</p>
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
