
import React, { useState, useEffect } from 'react';
import { Order, STAGE_PROGRESS_MAP } from '../types';
import { Wallet, Calendar as CalendarIcon, AlertCircle, Sparkles, Star, GripVertical, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { isWithinInterval, addDays, parseISO, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DashboardProps {
  orders: Order[];
  priorityOrderIds: string[];
  onUpdatePriorityIds: (ids: string[]) => void;
}

type SectionType = 'upcoming' | 'stats' | 'priority';

const Dashboard: React.FC<DashboardProps> = ({ orders, priorityOrderIds, onUpdatePriorityIds }) => {
  const [isManagingPriority, setIsManagingPriority] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<SectionType[]>(() => {
    const saved = localStorage.getItem('artnexus_dashboard_layout');
    return saved ? JSON.parse(saved) : ['upcoming', 'stats', 'priority'];
  });
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);

  const today = new Date();
  const getProgress = (order: Order) => STAGE_PROGRESS_MAP[order.progressStage || '未开始'];

  useEffect(() => {
    localStorage.setItem('artnexus_dashboard_layout', JSON.stringify(sectionOrder));
  }, [sectionOrder]);

  const priorityOrders = priorityOrderIds
    .map(id => orders.find(o => o.id === id))
    .filter((o): o is Order => !!o);

  const handleSectionDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSectionIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSectionIndex === null || draggedSectionIndex === index) return;
    const newOrder = [...sectionOrder];
    const draggedItem = newOrder[draggedSectionIndex];
    newOrder.splice(draggedSectionIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setDraggedSectionIndex(index);
    setSectionOrder(newOrder);
  };

  const calculateRealAmount = (o: Order) => (o.source === '米画师' || o.source === '画加') ? o.totalPrice * 0.95 : o.totalPrice;
  const monthlyProjected = orders.reduce((sum, o) => sum + calculateRealAmount(o), 0);
  const monthlyCompleted = orders.filter(o => getProgress(o) === 100).reduce((sum, o) => sum + calculateRealAmount(o), 0);

  const upcomingOrders = orders
    .filter(o => getProgress(o) < 100 && !priorityOrderIds.includes(o.id))
    .filter(o => isWithinInterval(parseISO(o.deadline), { start: today, end: addDays(today, 7) }))
    .sort((a, b) => parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime());

  const renderSection = (type: SectionType) => {
    switch (type) {
      case 'upcoming':
        return (
          <div key="upcoming" 
            className={`bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 ${isEditingLayout ? 'scale-[0.98] border-dashed border-violet-300 ring-8 ring-violet-50/50' : ''}`}
            onDragOver={(e) => isEditingLayout && handleSectionDragOver(e, sectionOrder.indexOf('upcoming'))}
            onDragStart={(e) => isEditingLayout && handleSectionDragStart(e, sectionOrder.indexOf('upcoming'))}
            draggable={isEditingLayout}
          >
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                {isEditingLayout && <GripVertical className="w-4 h-4 text-slate-300 cursor-grab active:cursor-grabbing" />}
                <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm md:text-base">近期重要 DDL</h3>
              </div>
            </div>
            <div className="p-2 min-h-[100px]">
              {upcomingOrders.length > 0 ? (
                <div className="space-y-1 px-2 pb-2">
                  {upcomingOrders.map(order => {
                    const ddl = parseISO(order.deadline);
                    const prog = getProgress(order);
                    return (
                      <div key={order.id} className="group flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100">
                        <div className="flex flex-col items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
                          <span className="text-[8px] font-bold text-rose-500 leading-none mb-0.5">{format(ddl, 'eee', { locale: zhCN })}</span>
                          <span className="text-base md:text-lg font-black text-slate-900 leading-none">{format(ddl, 'd')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 truncate text-[11px] md:text-xs mb-1">{order.title}</h4>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-400" style={{ width: `${prog}%` }} />
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-rose-500">{prog}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-300 italic text-[10px]">暂无 7 天内到期的企划</div>
              )}
            </div>
          </div>
        );

      case 'stats':
        return (
          <div key="stats" 
            className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ${isEditingLayout ? 'scale-[0.98]' : ''}`}
            onDragOver={(e) => isEditingLayout && handleSectionDragOver(e, sectionOrder.indexOf('stats'))}
            onDragStart={(e) => isEditingLayout && handleSectionDragStart(e, sectionOrder.indexOf('stats'))}
            draggable={isEditingLayout}
          >
            <div className="bg-gradient-to-br from-violet-700 to-indigo-900 p-6 rounded-[2rem] text-white shadow-xl shadow-violet-200/50 relative overflow-hidden group">
              {isEditingLayout && <div className="absolute left-2 top-2 p-1 bg-white/20 rounded-md cursor-grab"><GripVertical className="w-3 h-3" /></div>}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <span className="text-[8px] font-bold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full border border-white/5">预计实收</span>
              </div>
              <div className="relative z-10">
                <p className="text-2xl md:text-3xl font-black">¥{monthlyProjected.toLocaleString()}</p>
                <p className="text-violet-100 text-[9px] mt-1 opacity-60 font-medium">已结入账: ¥{monthlyCompleted.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 relative">
              <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                 <div className="text-xl md:text-2xl font-black text-slate-800">{orders.filter(o => getProgress(o) < 100).length}</div>
                 <p className="text-[9px] text-slate-400 font-bold uppercase">进行中</p>
              </div>
              <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                 <div className="text-xl md:text-2xl font-black text-emerald-600">{orders.filter(o => getProgress(o) === 100).length}</div>
                 <p className="text-[9px] text-slate-400 font-bold uppercase">已结项</p>
              </div>
            </div>
          </div>
        );

      case 'priority':
        return (
          <div key="priority" 
            className={`bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 ${isEditingLayout ? 'scale-[0.98] border-dashed border-violet-300 ring-8 ring-violet-50/50' : ''}`}
            onDragOver={(e) => isEditingLayout && handleSectionDragOver(e, sectionOrder.indexOf('priority'))}
            onDragStart={(e) => isEditingLayout && handleSectionDragStart(e, sectionOrder.indexOf('priority'))}
            draggable={isEditingLayout}
          >
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                {isEditingLayout && <GripVertical className="w-4 h-4 text-slate-300 cursor-grab active:cursor-grabbing" />}
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm md:text-base">正在爆肝 (优先)</h3>
              </div>
              <button 
                onClick={() => setIsManagingPriority(!isManagingPriority)}
                className="text-violet-700 text-[10px] font-black uppercase tracking-wider bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-100"
              >
                {isManagingPriority ? '完成' : '筛选'}
              </button>
            </div>
            <div className="p-4 min-h-[100px]">
              {isManagingPriority ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {orders.map(order => (
                    <button
                      key={order.id}
                      onClick={() => {
                        const newIds = priorityOrderIds.includes(order.id) ? priorityOrderIds.filter(pid => pid !== order.id) : [...priorityOrderIds, order.id].slice(0,5);
                        onUpdatePriorityIds(newIds);
                      }}
                      className={`p-2.5 rounded-xl border transition-all text-left flex flex-col ${priorityOrderIds.includes(order.id) ? 'bg-violet-50 border-violet-200 ring-2 ring-violet-600/10' : 'bg-white border-slate-100'}`}
                    >
                      <span className="font-bold text-[10px] truncate">{order.title}</span>
                      <span className="text-[8px] text-slate-400">¥{order.totalPrice}</span>
                    </button>
                  ))}
                </div>
              ) : priorityOrders.length > 0 ? (
                <div className="space-y-2">
                  {priorityOrders.map((order, idx) => (
                    <div key={order.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-50 group hover:border-violet-100 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[8px] font-black rounded uppercase">P{idx + 1}</span>
                          <h4 className="font-bold text-slate-900 truncate text-[11px] md:text-xs">{order.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-700" style={{ width: `${getProgress(order)}%` }}></div>
                          </div>
                          <span className="text-[9px] font-black text-violet-700 w-7">{getProgress(order)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-300 flex flex-col items-center gap-2">
                  <Sparkles className="w-6 h-6 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">暂未选择优先企划</p>
                </div>
              )}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsEditingLayout(!isEditingLayout)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm border ${isEditingLayout ? 'bg-violet-700 text-white border-violet-700 ring-4 ring-violet-100' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          {isEditingLayout ? '完成排序' : '编辑布局'}
        </button>
      </div>

      <div className="space-y-6">
        {sectionOrder.map(type => renderSection(type))}
      </div>
    </div>
  );
};

export default Dashboard;
