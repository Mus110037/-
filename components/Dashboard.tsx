
import React, { useState, useEffect } from 'react';
import { Order, AppSettings } from '../types';
import { Wallet, Calendar as CalendarIcon, Sparkles, Star, LayoutGrid, Zap, CheckCircle2, GripVertical } from 'lucide-react';
// Fix: Removed parseISO which was reported as missing; using native Date parsing instead.
import { isWithinInterval, addDays, format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

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
  const [draggedPriorityIdx, setDraggedPriorityIdx] = useState<number | null>(null);
  const [sectionOrder, setSectionOrder] = useState<SectionType[]>(() => {
    const saved = localStorage.getItem('artnexus_dashboard_layout_v5');
    return saved ? JSON.parse(saved) : ['stats', 'upcoming', 'priority'];
  });

  const today = new Date();
  const getStageConfig = (order: Order) => {
    return settings.stages.find(s => s.name === (order.progressStage || '未开始')) || settings.stages[0];
  };

  useEffect(() => {
    localStorage.setItem('artnexus_dashboard_layout_v5', JSON.stringify(sectionOrder));
  }, [sectionOrder]);

  const priorityOrders = priorityOrderIds.map(id => orders.find(o => o.id === id)).filter((o): o is Order => !!o);

  const calculateActual = (o: Order) => {
    const source = settings.sources.find(s => s.name === o.source) || { name: o.source, fee: 0 };
    return o.totalPrice * (1 - source.fee / 100);
  };

  const monthlyProjected = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const monthlyActual = orders.filter(o => getStageConfig(o).progress === 100).reduce((sum, o) => sum + calculateActual(o), 0);

  const upcomingOrders = orders
    .filter(o => getStageConfig(o).progress < 100)
    .sort((a, b) => new Date(a.deadline.replace(/-/g, '/')).getTime() - new Date(b.deadline.replace(/-/g, '/')).getTime())
    .slice(0, 5);

  const handlePriorityDragStart = (idx: number) => {
    setDraggedPriorityIdx(idx);
  };

  const handlePriorityDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedPriorityIdx === null || draggedPriorityIdx === idx) return;
    
    const newOrder = [...priorityOrderIds];
    const item = newOrder[draggedPriorityIdx];
    newOrder.splice(draggedPriorityIdx, 1);
    newOrder.splice(idx, 0, item);
    
    setDraggedPriorityIdx(idx);
    onUpdatePriorityIds(newOrder);
  };

  const renderSection = (type: SectionType) => {
    const baseClass = `bg-white dark:bg-[#1A1D23] rounded-[2rem] border transition-all duration-300 shadow-sm overflow-hidden border-[#E0DDD5] dark:border-[#2D3139] relative`;
    
    switch (type) {
      case 'stats':
        return (
          <div key="stats" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#333333] dark:bg-[#0A0C0E] p-8 rounded-[2rem] text-[#F5F5F0] shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
              <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md"><Wallet className="w-5 h-5 text-[#A3B18A]" /></div>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10">财务状况 (实收)</span>
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-black tracking-tighter">¥{monthlyActual.toLocaleString()}</p>
                <p className="text-[#8E8B82] dark:text-[#8E9AAF] text-[10px] mt-1 font-bold uppercase tracking-widest">达成度: {((monthlyActual/monthlyProjected)*100 || 0).toFixed(1)}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#EAE8E0] dark:bg-[#1A1D23] p-6 rounded-[2rem] border border-[#D9D5CB] dark:border-[#2D3139] shadow-sm flex flex-col justify-center items-center text-center">
                 <div className="text-3xl font-black text-[#333333] dark:text-[#E0E0E0]">{orders.filter(o => getStageConfig(o).progress < 100).length}</div>
                 <p className="text-[9px] text-[#8E8B82] dark:text-[#8E9AAF] font-bold uppercase tracking-widest mt-1">爆肝企划</p>
              </div>
              <div className="bg-[#E0DDD5] dark:bg-[#14171C] p-6 rounded-[2rem] border border-[#D9D5CB] dark:border-[#2D3139] shadow-sm flex flex-col justify-center items-center text-center">
                 <div className="text-3xl font-black text-[#333333] dark:text-[#E0E0E0] opacity-30 dark:opacity-50">{orders.filter(o => getStageConfig(o).progress === 100).length}</div>
                 <p className="text-[9px] text-[#8E8B82] dark:text-[#8E9AAF] font-bold uppercase tracking-widest mt-1">已封笔项</p>
              </div>
            </div>
          </div>
        );

      case 'upcoming':
        return (
          <div key="upcoming" className={`${baseClass}`}>
            <div className="p-6 border-b border-[#E0DDD5] dark:border-[#2D3139] flex items-center gap-3">
              <CalendarIcon className="w-4 h-4 text-[#A3B18A]" />
              <h3 className="font-bold text-[#333333] dark:text-[#E0E0E0] text-sm uppercase tracking-tight">近期截止交付 (DDL)</h3>
            </div>
            <div className="p-2">
              {upcomingOrders.length > 0 ? (
                <div className="space-y-1">
                  {upcomingOrders.map(o => {
                    const stage = getStageConfig(o);
                    return (
                      <div key={o.id} className="flex items-center gap-4 p-4 hover:bg-[#F5F5F0] dark:hover:bg-[#252931] rounded-2xl transition-all border border-transparent hover:border-[#E0DDD5] dark:hover:border-[#3A3F48]">
                        <div className="flex flex-col items-center justify-center w-10 h-10 bg-[#333333] dark:bg-[#E0E0E0] rounded-xl shrink-0">
                          <span className="text-base font-black text-white dark:text-[#0F1115] leading-none">{format(new Date(o.deadline.replace(/-/g, '/')), 'd')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h4 className="font-bold text-[#333333] dark:text-[#E0E0E0] truncate text-[12px]">{o.title}</h4>
                            {o.priority === '高' && <Zap className="w-3 h-3 text-[#B5838D] fill-[#B5838D]" />}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-[#E0DDD5] dark:bg-[#2D3139] rounded-full overflow-hidden">
                              <div className="h-full transition-all duration-700" style={{ width: `${stage.progress}%`, backgroundColor: stage.color }} />
                            </div>
                            <span className="text-[9px] font-bold text-[#8E8B82]">{stage.progress}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="py-12 text-center text-[10px] text-[#8E8B82] font-bold uppercase tracking-widest">暂无近期 DDL</div>}
            </div>
          </div>
        );

      case 'priority':
        return (
          <div key="priority" className={`${baseClass}`}>
            <div className="p-6 border-b border-[#E0DDD5] dark:border-[#2D3139] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 text-[#A3B18A] fill-[#A3B18A]">★</span>
                <h3 className="font-bold text-[#333333] dark:text-[#E0E0E0] text-sm uppercase tracking-tight">星标高优项目</h3>
              </div>
              <button onClick={() => setIsManagingPriority(!isManagingPriority)} className="text-[9px] font-bold text-[#333333] dark:text-[#E0E0E0] uppercase tracking-widest bg-[#F5F5F0] dark:bg-[#2D3139] px-4 py-2 rounded-xl border border-[#E0DDD5] dark:border-[#3A3F48] hover:bg-[#EAE8E0] transition-all">
                {isManagingPriority ? '完成' : '设置权重'}
              </button>
            </div>
            <div className="p-4">
              {isManagingPriority ? (
                <div className="grid grid-cols-2 gap-3">
                  {orders.map(o => (
                    <button key={o.id} onClick={() => onUpdatePriorityIds(priorityOrderIds.includes(o.id) ? priorityOrderIds.filter(id => id !== o.id) : [...priorityOrderIds, o.id])} className={`p-4 rounded-2xl border text-left flex flex-col transition-all ${priorityOrderIds.includes(o.id) ? 'bg-[#333333] dark:bg-[#E0E0E0] border-[#333333] dark:border-[#E0E0E0] text-white dark:text-[#0F1115] shadow-lg' : 'bg-white dark:bg-[#1A1D23] border-[#E0DDD5] dark:border-[#2D3139] text-[#333333] dark:text-[#E0E0E0]'}`}>
                      <span className="font-bold text-[11px] truncate">{o.title}</span>
                      <span className={`text-[8px] mt-1 font-bold ${priorityOrderIds.includes(o.id) ? 'text-[#8E8B82] dark:text-[#8E9AAF]' : 'text-[#8E8B82]'}`}>¥{o.totalPrice}</span>
                    </button>
                  ))}
                </div>
              ) : priorityOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {priorityOrders.map((o, idx) => {
                    const stage = getStageConfig(o);
                    return (
                      <div 
                        key={o.id} 
                        draggable
                        onDragStart={() => handlePriorityDragStart(idx)}
                        onDragOver={(e) => handlePriorityDragOver(e, idx)}
                        onDragEnd={() => setDraggedPriorityIdx(null)}
                        className={`p-5 bg-white dark:bg-[#1A1D23] rounded-3xl border border-[#E0DDD5] dark:border-[#2D3139] shadow-sm cursor-grab active:cursor-grabbing hover:border-[#A3B18A] transition-colors group relative ${draggedPriorityIdx === idx ? 'opacity-40 grayscale' : ''}`}
                      >
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-3.5 h-3.5 text-[#D9D5CB] dark:text-[#2D3139]" />
                        </div>
                        <div className="flex justify-between items-start mb-4 pl-2">
                           <h4 className="font-bold text-[#333333] dark:text-[#E0E0E0] text-sm truncate w-2/3">{o.title}</h4>
                           <span className="px-2 py-1 bg-[#A3B18A] text-white text-[8px] font-bold rounded-lg shrink-0 uppercase tracking-tighter">TOP {idx + 1}</span>
                        </div>
                        <div className="flex items-center gap-4 pl-2">
                           <div className="flex-1 h-2 bg-[#F5F5F0] dark:bg-[#0F1115] rounded-full overflow-hidden">
                              <div className="h-full transition-all" style={{ width: `${stage.progress}%`, backgroundColor: stage.color }}></div>
                           </div>
                           <span className="text-[10px] font-bold text-[#333333] dark:text-[#8E9AAF]">{stage.progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="py-16 text-center text-[#D9D5CB] dark:text-[#2D3139] font-bold text-[10px] uppercase tracking-widest">无星标项目</div>}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="space-y-6">{sectionOrder.map(t => renderSection(t))}</div>
    </div>
  );
};

export default Dashboard;
