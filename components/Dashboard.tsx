
import React, { useState, useEffect } from 'react';
import { Order, STAGE_PROGRESS_MAP, AppSettings } from '../types';
import { Wallet, Calendar as CalendarIcon, Sparkles, Star, GripVertical, LayoutGrid, Zap } from 'lucide-react';
import { isWithinInterval, addDays, parseISO, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DashboardProps {
  orders: Order[];
  priorityOrderIds: string[];
  onUpdatePriorityIds: (ids: string[]) => void;
  settings: AppSettings;
}

type SectionType = 'upcoming' | 'stats' | 'priority';

const Dashboard: React.FC<DashboardProps> = ({ orders, priorityOrderIds, onUpdatePriorityIds, settings }) => {
  const [isManagingPriority, setIsManagingPriority] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<SectionType[]>(() => {
    const saved = localStorage.getItem('artnexus_dashboard_layout_v3');
    return saved ? JSON.parse(saved) : ['upcoming', 'stats', 'priority'];
  });
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const today = new Date();
  const getStageConfig = (order: Order) => {
    return settings.stages.find(s => s.name === (order.progressStage || '未开始')) || settings.stages[0];
  };

  useEffect(() => {
    localStorage.setItem('artnexus_dashboard_layout_v3', JSON.stringify(sectionOrder));
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
  const monthlyCompleted = orders.filter(o => getStageConfig(o).progress === 100).reduce((sum, o) => sum + calculateRealAmount(o), 0);

  const upcomingOrders = orders
    .filter(o => getStageConfig(o).progress < 100 && !priorityOrderIds.includes(o.id))
    .filter(o => isWithinInterval(parseISO(o.deadline), { start: today, end: addDays(today, 7) }))
    .sort((a, b) => parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime());

  const renderSection = (type: SectionType) => {
    const baseClass = `bg-white rounded-[2.5rem] border transition-all duration-300 shadow-sm overflow-hidden relative ${isEditingLayout ? 'scale-[0.98] border-dashed border-sky-300 ring-8 ring-sky-50' : 'border-slate-100'}`;
    
    switch (type) {
      case 'upcoming':
        return (
          <div key="upcoming" draggable={isEditingLayout} onDragStart={() => handleDragStart(sectionOrder.indexOf('upcoming'))} onDragOver={(e) => isEditingLayout && handleDragOver(e, sectionOrder.indexOf('upcoming'))} className={baseClass}>
            <div className="p-6 border-b border-slate-50 flex items-center gap-3">
              <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center"><CalendarIcon className="w-4 h-4 text-rose-400" /></div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">近期重要 DDLS</h3>
            </div>
            <div className="p-4">
              {upcomingOrders.length > 0 ? (
                <div className="space-y-1.5">
                  {upcomingOrders.map(o => {
                    const stage = getStageConfig(o);
                    return (
                      <div key={o.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-[1.5rem] transition-all">
                        <div className="flex flex-col items-center justify-center w-10 h-10 bg-white border border-slate-100 rounded-xl shrink-0 shadow-sm">
                          <span className="text-[7px] font-black text-rose-400 leading-none mb-0.5">{format(parseISO(o.deadline), 'eee', { locale: zhCN })}</span>
                          <span className="text-base font-black text-slate-700 leading-none">{format(parseISO(o.deadline), 'd')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h4 className="font-bold text-slate-700 truncate text-[11px]">{o.title}</h4>
                            <span className="text-[7px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-md">{o.artType}</span>
                          </div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full transition-all" style={{ width: `${stage.progress}%`, backgroundColor: stage.color }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="py-12 text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest">暂无近期 DDL</div>}
            </div>
          </div>
        );

      case 'stats':
        return (
          <div key="stats" draggable={isEditingLayout} onDragStart={() => handleDragStart(sectionOrder.indexOf('stats'))} onDragOver={(e) => isEditingLayout && handleDragOver(e, sectionOrder.indexOf('stats'))} className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ${isEditingLayout ? 'scale-[0.98]' : ''}`}>
            <div className="bg-gradient-to-br from-sky-400 to-cyan-400 p-8 rounded-[2.5rem] text-white shadow-xl shadow-sky-100 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md"><Wallet className="w-5 h-5 text-white" /></div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10">实收分析 (CNY)</span>
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-black">¥{monthlyProjected.toLocaleString()}</p>
                <p className="text-white/70 text-[10px] mt-1.5 font-bold">已入账: ¥{monthlyCompleted.toLocaleString()}</p>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 relative">
              <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                 <div className="text-2xl font-black text-slate-800">{orders.filter(o => getStageConfig(o).progress < 100).length}</div>
                 <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest mt-1">爆肝中</p>
              </div>
              <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                 <div className="text-2xl font-black text-emerald-400">{orders.filter(o => getStageConfig(o).progress === 100).length}</div>
                 <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest mt-1">已封笔</p>
              </div>
            </div>
          </div>
        );

      case 'priority':
        return (
          <div key="priority" draggable={isEditingLayout} onDragStart={() => handleDragStart(sectionOrder.indexOf('priority'))} onDragOver={(e) => isEditingLayout && handleDragOver(e, sectionOrder.indexOf('priority'))} className={baseClass}>
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center"><Star className="w-4 h-4 text-sky-400 fill-sky-400" /></div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">P0 级重点企划</h3>
              </div>
              <button onClick={() => setIsManagingPriority(!isManagingPriority)} className="text-sky-500 text-[9px] font-black uppercase tracking-widest bg-sky-50 px-4 py-2 rounded-xl border border-sky-100 transition-all hover:bg-sky-100">
                {isManagingPriority ? '完成筛选' : '管理权重'}
              </button>
            </div>
            <div className="p-4">
              {isManagingPriority ? (
                <div className="grid grid-cols-2 gap-3">
                  {orders.map(o => (
                    <button key={o.id} onClick={() => onUpdatePriorityIds(priorityOrderIds.includes(o.id) ? priorityOrderIds.filter(id => id !== o.id) : [...priorityOrderIds, o.id].slice(0,5))} className={`p-4 rounded-2xl border text-left flex flex-col transition-all ${priorityOrderIds.includes(o.id) ? 'bg-sky-50 border-sky-200 ring-2 ring-sky-500/10' : 'bg-white border-slate-50'}`}>
                      <span className="font-bold text-[10px] text-slate-700 truncate">{o.title}</span>
                      <span className="text-[8px] text-slate-400 mt-1 uppercase font-black tracking-widest">¥{o.totalPrice} · {o.source}</span>
                    </button>
                  ))}
                </div>
              ) : priorityOrders.length > 0 ? (
                <div className="space-y-2.5">
                  {priorityOrders.map((o, i) => {
                    const stage = getStageConfig(o);
                    return (
                      <div key={o.id} className="flex items-center gap-4 bg-white p-4 rounded-[1.8rem] border border-slate-50 hover:border-sky-100 transition-all shadow-sm">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-slate-800 text-white text-[8px] font-black rounded-md">P{i + 1}</span>
                            <h4 className="font-bold text-slate-700 truncate text-[12px]">{o.title}</h4>
                            {o.priority === '高' && <Zap className="w-3 h-3 text-rose-400 fill-rose-400" />}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
                              <div className="h-full transition-all" style={{ width: `${stage.progress}%`, backgroundColor: stage.color }}></div>
                            </div>
                            <span className="text-[10px] font-black" style={{ color: stage.color }}>{stage.progress}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="py-16 text-center text-slate-200 flex flex-col items-center gap-3"><Sparkles className="w-8 h-8 opacity-20" /><p className="text-[10px] font-black uppercase tracking-widest">还没有设置高优企划</p></div>}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-end">
        <button onClick={() => setIsEditingLayout(!isEditingLayout)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isEditingLayout ? 'bg-sky-500 text-white border-sky-500 shadow-xl shadow-sky-100' : 'bg-white text-slate-400 border-slate-100 hover:text-slate-600'}`}>
          <LayoutGrid className="w-4 h-4" /> {isEditingLayout ? '锁定布局' : '配置工作台'}
        </button>
      </div>
      <div className="space-y-6">{sectionOrder.map(t => renderSection(t))}</div>
    </div>
  );
};

export default Dashboard;
