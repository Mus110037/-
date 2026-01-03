
import React, { useState, useEffect } from 'react';
import { Order, AppSettings } from '../types';
import { Wallet, Calendar as CalendarIcon, Zap, GripVertical, Tag, Briefcase, User, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

interface DashboardProps {
  orders: Order[];
  priorityOrderIds: string[];
  onUpdatePriorityIds: (ids: string[]) => void;
  onEditOrder: (order: Order) => void;
  settings: AppSettings;
}

type SectionType = 'upcoming' | 'stats' | 'priority';

const Dashboard: React.FC<DashboardProps> = ({ orders, priorityOrderIds, onUpdatePriorityIds, onEditOrder, settings }) => {
  const [isManagingPriority, setIsManagingPriority] = useState(false);
  const [draggedPriorityIdx, setDraggedPriorityIdx] = useState<number | null>(null);
  const [sectionOrder] = useState<SectionType[]>(() => {
    const saved = localStorage.getItem('artnexus_dashboard_layout_v5');
    return saved ? JSON.parse(saved) : ['stats', 'upcoming', 'priority'];
  });

  const getStageConfig = (order: Order) => {
    return settings.stages.find(s => s.name === (order.progressStage || '未开始')) || settings.stages[0];
  };

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

  const handlePriorityDragStart = (idx: number) => setDraggedPriorityIdx(idx);

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
    const baseClass = `bg-white rounded-[2.5rem] border transition-all duration-300 shadow-sm overflow-hidden border-[#E2E8E4] relative`;
    
    switch (type) {
      case 'stats':
        return (
          <div key="stats" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#2D3A30] p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
              <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md"><Wallet className="w-5 h-5 text-[#A3B18A]" /></div>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10">实收金额 (扣费后)</span>
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-black tracking-tighter">¥{monthlyActual.toLocaleString()}</p>
                <p className="text-[#A3B18A] text-[10px] mt-1 font-bold uppercase tracking-widest">总体完成率: {((monthlyActual/monthlyProjected)*100 || 0).toFixed(1)}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2.5rem] border border-[#E2E8E4] shadow-sm flex flex-col justify-center items-center text-center">
                 <div className="text-3xl font-black text-[#2D3A30]">{orders.filter(o => getStageConfig(o).progress < 100).length}</div>
                 <p className="text-[9px] text-[#4F6D58] font-bold uppercase tracking-widest mt-1">正在进行</p>
              </div>
              <div className="bg-[#EDF1EE] p-6 rounded-[2.5rem] border border-[#D1D9D3] shadow-sm flex flex-col justify-center items-center text-center">
                 <div className="text-3xl font-black text-[#2D3A30] opacity-30">{orders.filter(o => getStageConfig(o).progress === 100).length}</div>
                 <p className="text-[9px] text-[#4F6D58] font-bold uppercase tracking-widest mt-1">已经完成</p>
              </div>
            </div>
          </div>
        );

      case 'upcoming':
        return (
          <div key="upcoming" className={`${baseClass}`}>
            <div className="p-6 border-b border-[#E2E8E4] flex items-center gap-3">
              <CalendarIcon className="w-4 h-4 text-[#3A5A40]" />
              <h3 className="font-bold text-[#2D3A30] text-sm uppercase tracking-tight">即将到期企划</h3>
            </div>
            <div className="p-2">
              {upcomingOrders.length > 0 ? (
                <div className="space-y-1">
                  {upcomingOrders.map(o => {
                    const stage = getStageConfig(o);
                    const deadlineDate = new Date(o.deadline.replace(/-/g, '/'));
                    return (
                      <div key={o.id} onClick={() => onEditOrder(o)} className="flex items-center gap-4 p-4 hover:bg-[#F2F4F0] rounded-2xl transition-all border border-transparent hover:border-[#D1D9D3] cursor-pointer group">
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-[#2D3A30] rounded-2xl shrink-0 shadow-lg border border-white/5 transition-transform group-hover:scale-105">
                          <span className="text-[16px] font-black text-white leading-none tracking-tighter">{format(deadlineDate, 'dd')}</span>
                          <span className="text-[9px] font-bold text-[#A3B18A] leading-none mt-1.5 uppercase tracking-widest">{format(deadlineDate, 'MMM', { locale: zhCN })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-bold text-[#2D3A30] truncate text-[12px] group-hover:text-[#3A5A40] transition-colors">{o.title}</h4>
                            {o.priority === '高' && <Zap className="w-3 h-3 text-red-600 fill-red-600" />}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* 核心进度条 - 颜色关联 stage.color */}
                            <div className="w-20 h-2 bg-[#E2E8E4] rounded-full overflow-hidden shrink-0 border border-slate-200">
                              <div className="h-full transition-all duration-700" style={{ width: `${stage.progress}%`, backgroundColor: stage.color }} />
                            </div>
                            <span className="px-2 py-0.5 bg-[#EDF1EE] text-[#3A5A40] text-[8px] font-black rounded-lg border border-[#D1D9D3] uppercase tracking-tighter">
                              {stage.progress}%
                            </span>
                            {/* 性质标签 */}
                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[8px] font-bold text-slate-500 flex items-center gap-1">
                              {o.commissionType === '商用' ? <Briefcase className="w-2 h-2 text-amber-500" /> : <User className="w-2 h-2 text-blue-500" />}
                              {o.commissionType?.substring(0, 1)}
                            </span>
                            {/* 分类 */}
                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[8px] font-bold text-slate-500 flex items-center gap-1">
                              <Tag className="w-2 h-2" />
                              {o.artType}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="py-12 text-center text-[10px] text-[#4F6D58] font-bold uppercase tracking-widest">暂无紧迫企划</div>}
            </div>
          </div>
        );

      case 'priority':
        return (
          <div key="priority" className={`${baseClass}`}>
            <div className="p-6 border-b border-[#E2E8E4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 text-[#3A5A40] fill-[#3A5A40]">★</span>
                <h3 className="font-bold text-[#2D3A30] text-sm uppercase tracking-tight">高优先级企划</h3>
              </div>
              <button onClick={() => setIsManagingPriority(!isManagingPriority)} className="text-[9px] font-bold text-[#3A5A40] uppercase tracking-widest bg-[#EDF1EE] px-4 py-2 rounded-xl border border-[#D1D9D3] hover:bg-[#D1D9D3] transition-all">
                {isManagingPriority ? '完成' : '调整排序'}
              </button>
            </div>
            <div className="p-4">
              {isManagingPriority ? (
                <div className="grid grid-cols-2 gap-3">
                  {orders.map(o => (
                    <button key={o.id} onClick={() => onUpdatePriorityIds(priorityOrderIds.includes(o.id) ? priorityOrderIds.filter(id => id !== o.id) : [...priorityOrderIds, o.id])} className={`p-4 rounded-2xl border text-left flex flex-col transition-all ${priorityOrderIds.includes(o.id) ? 'bg-[#3A5A40] border-[#3A5A40] text-white shadow-lg' : 'bg-white border-[#E2E8E4] text-[#2D3A30]'}`}>
                      <span className="font-bold text-[11px] truncate">{o.title}</span>
                      <span className={`text-[8px] mt-1 font-bold ${priorityOrderIds.includes(o.id) ? 'text-white/60' : 'text-[#4F6D58]'}`}>¥{o.totalPrice}</span>
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
                        onClick={() => onEditOrder(o)}
                        onDragStart={() => handlePriorityDragStart(idx)}
                        onDragOver={(e) => handlePriorityDragOver(e, idx)}
                        onDragEnd={() => setDraggedPriorityIdx(null)}
                        className={`p-5 bg-white rounded-3xl border border-[#E2E8E4] shadow-sm cursor-grab active:cursor-grabbing hover:border-[#3A5A40] transition-colors group relative ${draggedPriorityIdx === idx ? 'opacity-40 grayscale' : ''}`}
                      >
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-3.5 h-3.5 text-[#D1D9D3]" />
                        </div>
                        <div className="flex justify-between items-start mb-4 pl-2">
                           <h4 className="font-bold text-[#2D3A30] text-[12px] truncate w-2/3 group-hover:text-[#3A5A40] transition-colors">{o.title}</h4>
                           <span className="px-2 py-1 bg-[#4F6D58] text-white text-[8px] font-bold rounded-lg shrink-0 uppercase tracking-tighter shadow-sm">P{idx + 1}</span>
                        </div>
                        <div className="flex items-center gap-3 pl-2">
                           {/* 进度条颜色关联 stage.color */}
                           <div className="w-16 h-2 bg-[#F2F4F0] rounded-full overflow-hidden border border-slate-100 shrink-0">
                              <div className="h-full transition-all" style={{ width: `${stage.progress}%`, backgroundColor: stage.color }}></div>
                           </div>
                           <span className="text-[10px] font-black text-[#4F6D58]">{stage.progress}%</span>
                           <span className="ml-auto text-[10px] font-black text-slate-900">¥{o.totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="py-16 text-center text-[#D1D9D3] font-bold text-[10px] uppercase tracking-widest">暂无高优企划</div>}
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
