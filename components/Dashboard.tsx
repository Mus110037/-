
import React, { useState, useEffect } from 'react';
import { Order, AppSettings } from '../types';
import { Wallet, Calendar as CalendarIcon, Sparkles, Star, LayoutGrid, Zap, CheckCircle2 } from 'lucide-react';
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
    .sort((a, b) => parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime())
    .slice(0, 5);

  const renderSection = (type: SectionType) => {
    const baseClass = `bg-white rounded-[2rem] border transition-all duration-300 shadow-sm overflow-hidden border-slate-200 relative`;
    
    switch (type) {
      case 'stats':
        return (
          <div key="stats" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl shadow-slate-200 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
              <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md"><Wallet className="w-5 h-5" /></div>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10">财务状况 (去费后实收)</span>
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-black tracking-tighter">¥{monthlyActual.toLocaleString()}</p>
                <p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest">当前资金池达成度: {((monthlyActual/monthlyProjected)*100 || 0).toFixed(1)}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                 <div className="text-3xl font-black text-slate-900">{orders.filter(o => getStageConfig(o).progress < 100).length}</div>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">爆肝企划</p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                 <div className="text-3xl font-black text-slate-900 opacity-30">{orders.filter(o => getStageConfig(o).progress === 100).length}</div>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">已封笔项</p>
              </div>
            </div>
          </div>
        );

      case 'upcoming':
        return (
          <div key="upcoming" className={baseClass}>
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <CalendarIcon className="w-4 h-4 text-slate-900" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">近期截止交付 (DDL)</h3>
            </div>
            <div className="p-2">
              {upcomingOrders.length > 0 ? (
                <div className="space-y-1">
                  {upcomingOrders.map(o => {
                    const stage = getStageConfig(o);
                    return (
                      <div key={o.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                        <div className="flex flex-col items-center justify-center w-10 h-10 bg-slate-900 rounded-xl shrink-0">
                          <span className="text-base font-black text-white leading-none">{format(parseISO(o.deadline), 'd')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h4 className="font-bold text-slate-900 truncate text-[12px]">{o.title}</h4>
                            {o.priority === '高' && <Zap className="w-3 h-3 text-red-600 fill-red-600" />}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full transition-all duration-700" style={{ width: `${stage.progress}%`, backgroundColor: stage.color }} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">{stage.progress}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="py-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">暂无近期 DDL</div>}
            </div>
          </div>
        );

      case 'priority':
        return (
          <div key="priority" className={baseClass}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4 text-slate-900 fill-slate-900" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">星标高优项目</h3>
              </div>
              <button onClick={() => setIsManagingPriority(!isManagingPriority)} className="text-[9px] font-bold text-slate-900 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-200 transition-all">
                {isManagingPriority ? '完成' : '设置权重'}
              </button>
            </div>
            <div className="p-4">
              {isManagingPriority ? (
                <div className="grid grid-cols-2 gap-3">
                  {orders.map(o => (
                    <button key={o.id} onClick={() => onUpdatePriorityIds(priorityOrderIds.includes(o.id) ? priorityOrderIds.filter(id => id !== o.id) : [...priorityOrderIds, o.id])} className={`p-4 rounded-2xl border text-left flex flex-col transition-all ${priorityOrderIds.includes(o.id) ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-900'}`}>
                      <span className="font-bold text-[11px] truncate">{o.title}</span>
                      <span className={`text-[8px] mt-1 font-bold ${priorityOrderIds.includes(o.id) ? 'text-slate-400' : 'text-slate-400'}`}>¥{o.totalPrice}</span>
                    </button>
                  ))}
                </div>
              ) : priorityOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {priorityOrders.map((o) => {
                    const stage = getStageConfig(o);
                    return (
                      <div key={o.id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                           <h4 className="font-bold text-slate-900 text-sm truncate w-2/3">{o.title}</h4>
                           <span className="px-2 py-1 bg-slate-900 text-white text-[8px] font-bold rounded-lg">TOP PRIORITY</span>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full transition-all" style={{ width: `${stage.progress}%`, backgroundColor: stage.color }}></div>
                           </div>
                           <span className="text-[10px] font-bold text-slate-900">{stage.progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="py-16 text-center text-slate-300 font-bold text-[10px] uppercase tracking-widest">无星标项目</div>}
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
