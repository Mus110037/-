
import React, { useState, useEffect } from 'react';
import { Order, STAGE_PROGRESS_MAP } from '../types';
import { Wallet, Calendar as CalendarIcon, AlertCircle, Sparkles, Star, GripVertical, LayoutGrid } from 'lucide-react';
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
    const saved = localStorage.getItem('artnexus_dashboard_layout_v2');
    return saved ? JSON.parse(saved) : ['upcoming', 'stats', 'priority'];
  });
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const today = new Date();
  const getProgress = (order: Order) => STAGE_PROGRESS_MAP[order.progressStage || '未开始'];

  useEffect(() => {
    localStorage.setItem('artnexus_dashboard_layout_v2', JSON.stringify(sectionOrder));
  }, [sectionOrder]);

  const priorityOrders = priorityOrderIds.map(id => orders.find(o => o.id === id)).filter((o): o is Order => !!o);

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    const newOrder = [...sectionOrder];
    const item = newOrder[draggedIdx];
    newOrder.splice(draggedIdx, 1);
    newOrder.splice(idx, 0, item);
    setDraggedIdx(idx);
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
    const baseClass = `bg-white rounded-[2.5rem] border transition-all duration-300 shadow-sm overflow-hidden relative ${isEditingLayout ? 'scale-[0.98] border-dashed border-violet-300 ring-8 ring-violet-50' : 'border-slate-100'}`;
    
    switch (type) {
      case 'upcoming':
        return (
          <div key="upcoming" draggable={isEditingLayout} onDragStart={() => handleDragStart(sectionOrder.indexOf('upcoming'))} onDragOver={(e) => isEditingLayout && handleDragOver(e, sectionOrder.indexOf('upcoming'))} className={baseClass}>
            <div className="p-5 md:p-6 border-b border-slate-50 flex items-center gap-3">
              {isEditingLayout && <GripVertical className="w-4 h-4 text-slate-300" />}
              <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center"><CalendarIcon className="w-4 h-4 text-rose-500" /></div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">近期重要 DDL</h3>
            </div>
            <div className="p-3">
              {upcomingOrders.length > 0 ? (
                <div className="space-y-1">
                  {upcomingOrders.map(o => (
                    <div key={o.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all">
                      <div className="flex flex-col items-center justify-center w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl shrink-0">
                        <span className="text-[7px] font-black text-rose-500 leading-none mb-0.5">{format(parseISO(o.deadline), 'eee', { locale: zhCN })}</span>
                        <span className="text-base font-black text-slate-700 leading-none">{format(parseISO(o.deadline), 'd')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-700 truncate text-[11px] mb-1">{o.title}</h4>
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-rose-400" style={{ width: `${getProgress(o)}%` }} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="py-12 text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest">暂无近期 DDL</div>}
            </div>
          </div>
        );

      case 'stats':
        return (
          <div key="stats" draggable={isEditingLayout} onDragStart={() => handleDragStart(sectionOrder.indexOf('stats'))} onDragOver={(e) => isEditingLayout && handleDragOver(e, sectionOrder.indexOf('stats'))} className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ${isEditingLayout ? 'scale-[0.98]' : ''}`}>
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-violet-100/50 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10"><Wallet className="w-4 h-4 text-white" /></div>
                <span className="text-[8px] font-black uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full border border-white/5">预计实收</span>
              </div>
              <div className="relative z-10">
                <p className="text-2xl md:text-3xl font-black">¥{monthlyProjected.toLocaleString()}</p>
                <p className="text-violet-100 text-[9px] mt-1 opacity-60">已入账: ¥{monthlyCompleted.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 relative">
              <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                 <div className="text-xl font-black text-slate-800">{orders.filter(o => getProgress(o) < 100).length}</div>
                 <p className="text-[9px] text-slate-400 font-black uppercase">进行中</p>
              </div>
              <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                 <div className="text-xl font-black text-emerald-500">{orders.filter(o => getProgress(o) === 100).length}</div>
                 <p className="text-[9px] text-slate-400 font-black uppercase">已结项</p>
              </div>
            </div>
          </div>
        );

      case 'priority':
        return (
          <div key="priority" draggable={isEditingLayout} onDragStart={() => handleDragStart(sectionOrder.indexOf('priority'))} onDragOver={(e) => isEditingLayout && handleDragOver(e, sectionOrder.indexOf('priority'))} className={baseClass}>
            <div className="p-5 md:p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isEditingLayout && <GripVertical className="w-4 h-4 text-slate-300" />}
                <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /></div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">正在爆肝</h3>
              </div>
              <button onClick={() => setIsManagingPriority(!isManagingPriority)} className="text-violet-600 text-[9px] font-black uppercase tracking-widest bg-violet-50 px-3 py-1.5 rounded-xl border border-violet-100">
                {isManagingPriority ? '完成' : '筛选'}
              </button>
            </div>
            <div className="p-4">
              {isManagingPriority ? (
                <div className="grid grid-cols-2 gap-2">
                  {orders.map(o => (
                    <button key={o.id} onClick={() => onUpdatePriorityIds(priorityOrderIds.includes(o.id) ? priorityOrderIds.filter(id => id !== o.id) : [...priorityOrderIds, o.id].slice(0,5))} className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${priorityOrderIds.includes(o.id) ? 'bg-violet-50 border-violet-200 ring-2 ring-violet-500/10' : 'bg-white border-slate-100'}`}>
                      <span className="font-bold text-[10px] truncate">{o.title}</span>
                      <span className="text-[8px] text-slate-400">¥{o.totalPrice}</span>
                    </button>
                  ))}
                </div>
              ) : priorityOrders.length > 0 ? (
                <div className="space-y-2">
                  {priorityOrders.map((o, i) => (
                    <div key={o.id} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-50 hover:border-violet-100 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[8px] font-black rounded">P{i + 1}</span>
                          <h4 className="font-bold text-slate-700 truncate text-[11px]">{o.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-violet-600" style={{ width: `${getProgress(o)}%` }}></div></div>
                          <span className="text-[9px] font-black text-violet-600">{getProgress(o)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="py-12 text-center text-slate-300 flex flex-col items-center gap-2"><Sparkles className="w-6 h-6 opacity-20" /><p className="text-[10px] font-black uppercase tracking-widest">暂未选择优先企划</p></div>}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-end">
        <button onClick={() => setIsEditingLayout(!isEditingLayout)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isEditingLayout ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-100' : 'bg-white text-slate-500 border-slate-100'}`}>
          <LayoutGrid className="w-3.5 h-3.5" /> {isEditingLayout ? '确认排序' : '编辑工作台'}
        </button>
      </div>
      <div className="space-y-6">{sectionOrder.map(t => renderSection(t))}</div>
    </div>
  );
};

export default Dashboard;
