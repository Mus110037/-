
import React, { useState, useEffect } from 'react';
import { Order, AppSettings } from '../types';
import { Wallet, Calendar as CalendarIcon, ChevronUp, ChevronDown, Plus, Star, X, Settings2, Trash2, CalendarPlus, Target, Brush, MinusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

interface DashboardProps {
  orders: Order[];
  priorityOrderIds: string[];
  onUpdatePriorityIds: (ids: string[]) => void;
  onEditOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  settings: AppSettings;
  onQuickAdd: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, priorityOrderIds, onUpdatePriorityIds, onEditOrder, onUpdateOrder, settings, onQuickAdd }) => {
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [moduleOrder, setModuleOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('artnexus_dashboard_layout');
    return saved ? JSON.parse(saved) : ['stats', 'priority', 'upcoming'];
  });

  useEffect(() => {
    localStorage.setItem('artnexus_dashboard_layout', JSON.stringify(moduleOrder));
  }, [moduleOrder]);

  const handleExportSingleICS = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ArtNexus//Pro//CN\nMETHOD:PUBLISH\n";
    const deadline = order.deadline.replace(/-/g, '');
    icsContent += "BEGIN:VEVENT\n";
    icsContent += `UID:${order.id}@artnexus.pro\n`;
    icsContent += `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}\n`;
    icsContent += `DTSTART;VALUE=DATE:${deadline}\n`;
    icsContent += `DTEND;VALUE=DATE:${deadline}\n`;
    icsContent += `SUMMARY:[艺策] ${order.title}\n`;
    icsContent += `DESCRIPTION:进度: ${order.progressStage}\\n金额: ¥${order.totalPrice}\n`;
    icsContent += "END:VEVENT\nEND:VCALENDAR";
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${order.title}_日程.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStageConfig = (order: Order) => {
    return settings.stages.find(s => s.name === (order.progressStage || '未开始')) || settings.stages[0];
  };

  const highPriorityOrdersRaw = orders.filter(o => o.priority === '高' && getStageConfig(o).progress < 100);
  const sortedPriorityOrders = [...highPriorityOrdersRaw].sort((a, b) => {
    const idxA = priorityOrderIds.indexOf(a.id);
    const idxB = priorityOrderIds.indexOf(b.id);
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const movePriorityItem = (idx: number, direction: 'up' | 'down') => {
    const newIds = sortedPriorityOrders.map(o => o.id);
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= newIds.length) return;
    [newIds[idx], newIds[target]] = [newIds[target], newIds[idx]];
    onUpdatePriorityIds(newIds);
  };

  const handleRemoveFromPriority = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateOrder({ ...order, priority: '中' });
    onUpdatePriorityIds(priorityOrderIds.filter(id => id !== order.id));
  };

  const calculateActual = (o: Order) => {
    const source = settings.sources.find(s => s.name === o.source) || { name: o.source, fee: 0 };
    return o.totalPrice * (1 - source.fee / 100);
  };

  const monthlyActual = orders.filter(o => getStageConfig(o).progress === 100).reduce((sum, o) => sum + calculateActual(o), 0);
  const upcomingOrders = orders
    .filter(o => getStageConfig(o).progress < 100)
    .sort((a, b) => new Date(a.deadline.replace(/-/g, '/')).getTime() - new Date(b.deadline.replace(/-/g, '/')).getTime())
    .slice(0, 5);

  const nonHighPriorityOrders = orders.filter(o => o.priority !== '高' && getStageConfig(o).progress < 100);

  const renderStatsModule = (index: number) => (
    <div key="stats" className="relative group animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#3D4C41] px-6 py-5 rounded-xl text-[#FDFBF7] shadow-md flex items-center justify-between col-span-1 md:col-span-2">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white/10 rounded-lg"><Wallet className="w-5 h-5 text-[#B2B7A5]" /></div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">本月预估实收 Revenue</p>
              <p className="text-2xl md:text-3xl font-black tracking-tight tabular-nums">¥{monthlyActual.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FDFBF7] p-4 rounded-xl border border-[#D6D2C4] flex flex-col items-center justify-center shadow-sm">
             <div className="text-2xl font-black text-[#3D4C41] tabular-nums">{orders.filter(o => getStageConfig(o).progress < 100).length}</div>
             <p className="text-[10px] text-[#7A8B7C] font-black uppercase mt-1">进行中</p>
          </div>
          <div className="bg-[#FDFBF7] p-4 rounded-xl border border-[#D6D2C4] flex flex-col items-center justify-center opacity-70 shadow-sm">
             <div className="text-2xl font-black text-[#3D4C41] opacity-30 tabular-nums">{orders.filter(o => getStageConfig(o).progress === 100).length}</div>
             <p className="text-[10px] text-[#7A8B7C] font-black uppercase mt-1">已完成</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPriorityModule = (index: number) => (
    <div key="priority" className="relative group animate-in fade-in duration-500">
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Brush className="w-4 h-4 text-[#D4A373]" />
            <h3 className="font-black text-[#2C332D] text-sm uppercase tracking-widest">创作重心 | Priority Focus</h3>
          </div>
          <button onClick={() => setIsSelectionModalOpen(true)} className="text-[10px] font-black px-4 py-2 rounded-lg border border-[#D6D2C4] bg-[#FDFBF7] text-[#4B5E4F] hover:bg-[#FDFBF7] hover:border-[#4B5E4F] transition-all uppercase tracking-widest shadow-sm flex items-center gap-1.5 active:scale-95">
            <Plus className="w-3.5 h-3.5" /> 提升
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedPriorityOrders.length > 0 ? (
            sortedPriorityOrders.map((o, idx) => {
              const stageConfig = getStageConfig(o);
              return (
                <div 
                  key={o.id} 
                  onClick={() => onEditOrder(o)} 
                  className="bg-[#FDFBF7] p-4 md:p-5 rounded-xl border border-[#D6D2C4] shadow-sm hover:border-[#4B5E4F] transition-all cursor-pointer flex items-center gap-3 md:gap-4 group/item relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-2 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); movePriorityItem(idx, 'up'); }} className="p-1 bg-[#FDFBF7] border rounded shadow-sm hover:bg-slate-50"><ChevronUp className="w-3 h-3 text-[#7A8B7C]" /></button>
                    <button onClick={(e) => { e.stopPropagation(); movePriorityItem(idx, 'down'); }} className="p-1 bg-[#FDFBF7] border rounded shadow-sm hover:bg-slate-50"><ChevronDown className="w-3 h-3 text-[#7A8B7C]" /></button>
                    <button onClick={(e) => handleRemoveFromPriority(o, e)} className="p-1 bg-[#FDFBF7] border rounded shadow-sm hover:bg-rose-50 text-rose-400 hover:text-rose-600 border-[#D6D2C4] transition-colors" title="移出重心"><MinusCircle className="w-3 h-3" /></button>
                  </div>

                  <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: stageConfig.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#D4A373] animate-pulse shrink-0" />
                      <h4 className="font-black text-[#2C332D] text-[12px] md:text-[17px] break-words tracking-tight leading-tight">{o.title}</h4>
                    </div>
                    <div className="w-full h-1.5 bg-[#E8E6DF] rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-700" style={{ width: `${stageConfig.progress}%`, backgroundColor: stageConfig.color }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end min-w-[70px]">
                    <p className="text-[14px] md:text-base font-black text-[#2C332D] tabular-nums tracking-tighter leading-none">¥{o.totalPrice.toLocaleString()}</p>
                    <p className="text-[9px] md:text-[10px] font-bold text-[#A8A291] uppercase mt-1 tracking-widest">{stageConfig.progress}%</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-1 md:col-span-2 py-10 text-center border-2 border-dashed border-[#D6D2C4] rounded-2xl bg-white/20 flex flex-col items-center justify-center gap-2">
              <Star className="w-5 h-5 text-[#D6D2C4]" />
              <p className="text-[10px] font-black text-[#A8A291] uppercase tracking-widest">点击“提升”将关键企划移至此处</p>
            </div>
          )}
        </div>
      </div>

      {isSelectionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1B241D]/60 backdrop-blur-sm" onClick={() => setIsSelectionModalOpen(false)}>
          <div className="bg-[#FDFBF7] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#D6D2C4] flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                 <Target className="w-4 h-4 text-[#D4A373]" />
                 <h4 className="font-black text-[#2C332D] uppercase tracking-tight text-xs">选取企划至重心</h4>
              </div>
              <button onClick={() => setIsSelectionModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 max-h-[50vh] overflow-y-auto custom-scrollbar space-y-2">
              {nonHighPriorityOrders.length > 0 ? (
                nonHighPriorityOrders.map(o => (
                  <button 
                    key={o.id}
                    onClick={() => {
                      onUpdateOrder({ ...o, priority: '高' });
                      onUpdatePriorityIds([...priorityOrderIds, o.id]);
                      setIsSelectionModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-[#D6D2C4] hover:border-[#4B5E4F] transition-all text-left shadow-sm group"
                  >
                    <div className="min-w-0">
                       <p className="font-black text-xs text-[#2C332D] break-words mb-1">{o.title}</p>
                       <p className="text-[9px] font-bold text-[#A8A291] uppercase tracking-widest">¥{o.totalPrice.toLocaleString()} · {o.progressStage}</p>
                    </div>
                    <Plus className="w-4 h-4 text-[#A8A291] group-hover:text-[#4B5E4F] shrink-0" />
                  </button>
                ))
              ) : (
                <div className="py-10 text-center">
                   <Star className="w-6 h-6 text-[#D6D2C4] mx-auto mb-2" />
                   <p className="text-[10px] font-black text-[#A8A291] uppercase tracking-widest">暂无进行中的普通企划</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderUpcomingModule = (index: number) => (
    <div key="upcoming" className="relative group animate-in fade-in duration-500">
      <div className="bg-[#FDFBF7] rounded-xl border border-[#D6D2C4] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#D6D2C4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-4 h-4 text-[#4B5E4F]" />
            <h3 className="font-black text-[#2C332D] text-sm uppercase tracking-widest">最近截止项目</h3>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {upcomingOrders.map(o => (
            <div key={o.id} onClick={() => onEditOrder(o)} className="flex items-center gap-3 md:gap-5 p-4 md:p-5 hover:bg-[#FAF9F5] transition-all cursor-pointer group">
              <div className="flex flex-col items-center justify-center w-10 h-10 md:w-11 md:h-11 bg-[#3D4C41] rounded-lg shrink-0">
                <span className="text-sm md:text-base font-black text-[#FDFBF7] leading-none">{format(new Date(o.deadline.replace(/-/g, '/')), 'dd')}</span>
                <span className="text-[8px] md:text-[10px] font-bold text-[#B2B7A5] uppercase mt-0.5">{format(new Date(o.deadline.replace(/-/g, '/')), 'MMM', { locale: zhCN })}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${o.priority === '高' ? 'bg-[#D4A373]' : 'bg-[#E8E6DF]'} shrink-0`} />
                  <h4 className="font-black text-[#2C332D] break-words text-[12px] md:text-base tracking-tight leading-tight">{o.title}</h4>
                </div>
                <div className="w-full max-w-[120px] h-1 bg-[#E8E6DF] rounded-full overflow-hidden">
                   <div className="h-full bg-[#4B5E4F]" style={{ width: `${getStageConfig(o).progress}%` }} />
                </div>
              </div>
              <div className="text-right flex items-center gap-2 md:gap-3 shrink-0">
                <button onClick={(e) => handleExportSingleICS(o, e)} className="p-2 border border-[#D6D2C4] rounded-lg text-[#4B5E4F] hover:bg-slate-50 shrink-0 hidden sm:block"><CalendarPlus className="w-4 h-4" /></button>
                <div className="flex flex-col items-end min-w-[75px] md:min-w-[90px]">
                  <p className="text-[14px] md:text-base font-black text-[#2C332D] tabular-nums tracking-tighter leading-none">¥{o.totalPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
          {upcomingOrders.length === 0 && (
            <div className="p-10 text-center text-xs font-bold text-[#A8A291] uppercase tracking-widest">暂无截止项目</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-end px-1">
        <button onClick={() => setIsEditMode(!isEditMode)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${isEditMode ? 'bg-[#4B5E4F] text-white border-[#4B5E4F]' : 'bg-[#FDFBF7] text-[#A8A291] border-[#D6D2C4] hover:border-[#7A8B7C] shadow-sm'}`}>
          <Settings2 className="w-4 h-4" />
          {isEditMode ? '完成自定义' : '自定义看板布局'}
        </button>
      </div>

      <div className="space-y-8">
        {moduleOrder.map((moduleId, index) => {
          if (moduleId === 'stats') return renderStatsModule(index);
          if (moduleId === 'priority') return renderPriorityModule(index);
          if (moduleId === 'upcoming') return renderUpcomingModule(index);
          return null;
        })}
      </div>
    </div>
  );
};

export default Dashboard;
