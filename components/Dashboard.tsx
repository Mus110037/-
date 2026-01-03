
import React, { useState, useEffect } from 'react';
import { Order, AppSettings } from '../types';
import { Wallet, Calendar as CalendarIcon, ChevronUp, ChevronDown, Plus, Star, X, Settings2, Trash2, CalendarPlus } from 'lucide-react';
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

  const moveModule = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...moduleOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    [newOrder[index], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[index]];
    setModuleOrder(newOrder);
  };

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

  const removeFromFocus = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      onUpdateOrder({ ...order, priority: '中' });
      onUpdatePriorityIds(priorityOrderIds.filter(id => id !== orderId));
    }
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
        <div className="bg-[#2D3A30] px-6 py-5 rounded-xl text-[#F2F1EA] shadow-md flex items-center justify-between col-span-1 md:col-span-2">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white/10 rounded-lg"><Wallet className="w-5 h-5 text-[#A3B18A]" /></div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">本月预估实收 Revenue</p>
              <p className="text-3xl font-black tracking-tight">¥{monthlyActual.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FAFAF5] p-4 rounded-xl border border-[#D1D6D1] flex flex-col items-center justify-center shadow-sm">
             <div className="text-2xl font-black text-[#2D3A30]">{orders.filter(o => getStageConfig(o).progress < 100).length}</div>
             <p className="text-[10px] text-[#4F6D58] font-black uppercase mt-1">进行中</p>
          </div>
          <div className="bg-[#FAFAF5] p-4 rounded-xl border border-[#D1D6D1] flex flex-col items-center justify-center opacity-70 shadow-sm">
             <div className="text-2xl font-black text-[#2D3A30] opacity-30">{orders.filter(o => getStageConfig(o).progress === 100).length}</div>
             <p className="text-[10px] text-[#4F6D58] font-black uppercase mt-1">已完成</p>
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
            <div className="w-1.5 h-4 bg-red-500 rounded-full" />
            <h3 className="font-black text-[#2D3A30] text-sm uppercase tracking-widest">Focus Track 关键焦点</h3>
          </div>
          <button onClick={() => setIsSelectionModalOpen(true)} className="text-[10px] font-black px-4 py-2 rounded-lg border border-[#D1D6D1] bg-white text-[#4F6D58] hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> 添加
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
                  className="bg-[#FAFAF5] p-5 rounded-xl border border-[#D1D6D1] shadow-sm hover:border-[#3A5A40] transition-all cursor-pointer flex items-center gap-4 group/item relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-2 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); movePriorityItem(idx, 'up'); }} className="p-1 bg-white border rounded shadow-sm hover:bg-slate-50"><ChevronUp className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); movePriorityItem(idx, 'down'); }} className="p-1 bg-white border rounded shadow-sm hover:bg-slate-50"><ChevronDown className="w-3 h-3" /></button>
                    <button onClick={(e) => handleExportSingleICS(o, e)} className="p-1 bg-white border border-[#D1D6D1] text-[#3A5A40] rounded shadow-sm hover:bg-slate-50"><CalendarPlus className="w-3 h-3" /></button>
                    <button onClick={(e) => removeFromFocus(o.id, e)} className="p-1 bg-white border border-red-100 text-red-400 rounded shadow-sm hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
                  </div>

                  <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: stageConfig.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <h4 className="font-black text-[#2D3A30] text-[15px] md:text-lg truncate tracking-tight">{o.title}</h4>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200/40 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-700" style={{ width: `${stageConfig.progress}%`, backgroundColor: stageConfig.color }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm md:text-base font-black text-[#2D3A30]">¥{o.totalPrice.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase mt-0.5 tracking-widest">{stageConfig.progress}%</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-1 md:col-span-2 py-12 text-center border-2 border-dashed border-[#D1D6D1] rounded-2xl bg-white/20 flex flex-col items-center justify-center gap-3">
              <Star className="w-6 h-6 text-[#D1D6D1]" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">暂无关键任务，点击上方按钮挑选</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderUpcomingModule = (index: number) => (
    <div key="upcoming" className="relative group animate-in fade-in duration-500">
      <div className="bg-[#FAFAF5] rounded-xl border border-[#D1D6D1] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-4 h-4 text-[#3A5A40]" />
            <h3 className="font-black text-[#2D3A30] text-sm uppercase tracking-widest">最近截止项目</h3>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {upcomingOrders.map(o => (
            <div key={o.id} onClick={() => onEditOrder(o)} className="flex items-center gap-5 p-5 hover:bg-[#FDFDFB] transition-all cursor-pointer group">
              <div className="flex flex-col items-center justify-center w-11 h-11 bg-[#2D3A30] rounded-lg shrink-0">
                <span className="text-base font-black text-white">{format(new Date(o.deadline.replace(/-/g, '/')), 'dd')}</span>
                <span className="text-[10px] font-bold text-[#A3B18A] uppercase">{format(new Date(o.deadline.replace(/-/g, '/')), 'MMM', { locale: zhCN })}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${o.priority === '高' ? 'bg-red-500' : 'bg-slate-200'} shrink-0`} />
                  <h4 className="font-black text-[#2D362E] truncate text-[15px] md:text-base tracking-tight leading-tight">{o.title}</h4>
                </div>
                <div className="w-32 h-1 bg-slate-200/50 rounded-full overflow-hidden">
                   <div className="h-full bg-[#3A5A40]" style={{ width: `${getStageConfig(o).progress}%` }} />
                </div>
              </div>
              <div className="text-right flex items-center gap-2 md:gap-3">
                <button onClick={(e) => handleExportSingleICS(o, e)} className="p-2 border border-[#D1D6D1] rounded-lg text-[#3A5A40] hover:bg-slate-50 shrink-0"><CalendarPlus className="w-4 h-4" /></button>
                <div className="flex flex-col items-end">
                  <p className="text-sm md:text-base font-black text-[#2D362E]">¥{o.totalPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-end px-1">
        <button onClick={() => setIsEditMode(!isEditMode)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${isEditMode ? 'bg-[#3A5A40] text-white border-[#3A5A40]' : 'bg-white text-slate-400 border-[#D1D6D1] hover:border-slate-400 shadow-sm'}`}>
          <Settings2 className="w-4 h-4" />
          {isEditMode ? '退出布局模式' : '排版布局模式'}
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

      {isSelectionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1B241D]/60 backdrop-blur-sm" onClick={() => setIsSelectionModalOpen(false)}>
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h4 className="font-black text-[#2D362E] uppercase tracking-tight text-sm">提升至 Focus Track</h4>
              <button onClick={() => setIsSelectionModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 max-h-[50vh] overflow-y-auto custom-scrollbar space-y-2 bg-[#FAFAF5]">
              {nonHighPriorityOrders.length > 0 ? (
                nonHighPriorityOrders.map(o => (
                  <button 
                    key={o.id}
                    onClick={() => {
                      onUpdateOrder({ ...o, priority: '高' });
                      onUpdatePriorityIds([...priorityOrderIds, o.id]);
                      setIsSelectionModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-transparent hover:border-[#3A5A40] transition-all text-left shadow-sm group"
                  >
                    <span className="font-bold text-sm text-[#2D362E] truncate">{o.title}</span>
                    <Plus className="w-4 h-4 text-slate-300 group-hover:text-[#3A5A40]" />
                  </button>
                ))
              ) : (
                <p className="text-center py-12 text-xs font-bold text-slate-400 uppercase tracking-widest">当前暂无可选的进行中企划</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
