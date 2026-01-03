
import React, { useState, useRef } from 'react';
import { Order, AppSettings, OrderStatus } from '../types';
import { Trash2, X, CheckSquare, Square, ArrowUpDown, Star, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

interface OrderListProps {
  orders: Order[];
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onUpdateOrder: (order: Order) => void;
  settings: AppSettings;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onEditOrder, onDeleteOrder, onUpdateOrder, settings }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [sortMethod, setSortMethod] = useState<'deadline' | 'createdAt'>('deadline');
  
  const getShortSource = (name: string) => {
    const map: Record<string, string> = { '米画师': 'MHS', '画加': 'HJ', '小红书': 'XHS', '推特': 'X', 'QQ': 'QQ' };
    return map[name] || name.slice(0, 3).toUpperCase();
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
    icsContent += `DESCRIPTION:进度: ${order.progressStage}\\n金额: ¥${order.totalPrice}\\n备注: ${order.description}\n`;
    icsContent += "END:VEVENT\nEND:VCALENDAR";
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${order.title}_日程.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`确定要删除选中的 ${selectedIds.length} 个企划吗？此操作无法撤销。`)) {
      selectedIds.forEach(id => onDeleteOrder(id));
      setSelectedIds([]);
      setIsSelectMode(false);
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortMethod === 'deadline') {
      return new Date(a.deadline.replace(/-/g, '/')).getTime() - new Date(b.deadline.replace(/-/g, '/')).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getStageConfig = (stageName: string) => {
    return settings.stages.find(s => s.name === stageName) || settings.stages[0];
  };

  const togglePriority = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateOrder({ ...order, priority: order.priority === '高' ? '中' : '高' });
  };

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const groups: { key: string; orders: Order[] }[] = [];
  sortedOrders.forEach(order => {
    const date = new Date(order.deadline.replace(/-/g, '/'));
    const month = format(date, 'yyyy年 M月');
    const half = date.getDate() <= 15 ? '上半月' : '下半月';
    const key = `${month} · ${half}`;
    
    if (groups.length > 0 && groups[groups.length - 1].key === key) {
      groups[groups.length - 1].orders.push(order);
    } else {
      groups.push({ key, orders: [order] });
    }
  });

  return (
    <div className="space-y-10 pb-32 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds([]); }} 
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${isSelectMode ? 'text-red-500' : 'text-[#4F6D58]'}`}
          >
            {isSelectMode ? <><X className="w-4 h-4" /> 取消</> : <><CheckSquare className="w-4 h-4" /> 批量</>}
          </button>
          
          {isSelectMode && selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500 animate-in slide-in-from-left-2 duration-300"
            >
              <Trash2 className="w-4 h-4" /> 删除 ({selectedIds.length})
            </button>
          )}

          {!isSelectMode && (
            <button 
              onClick={() => setSortMethod(sortMethod === 'deadline' ? 'createdAt' : 'deadline')}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-[#3A5A40]"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortMethod === 'deadline' ? '交付' : '录入'}
            </button>
          )}
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.key} className="space-y-4">
          <div className="flex items-center gap-4 px-4">
             <h3 className="text-[11px] font-black text-[#2D362E] uppercase tracking-widest whitespace-nowrap">{group.key}</h3>
             <div className="flex-1 h-px bg-[#D1D6D1] opacity-40" />
             <span className="text-[10px] font-bold text-slate-300">{group.orders.length}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 px-4">
            {group.orders.map((order) => {
              const stage = getStageConfig(order.progressStage);
              const isSelected = selectedIds.includes(order.id);
              const isHigh = order.priority === '高';
              
              return (
                <div 
                  key={order.id} 
                  onClick={() => isSelectMode ? toggleSelect(order.id) : onEditOrder(order)}
                  className={`bg-[#FAFAF5] flex items-stretch rounded-2xl border transition-all cursor-pointer group shadow-sm ${isSelected ? 'border-[#3A5A40] bg-emerald-50/20 ring-2 ring-[#3A5A40]/10' : 'border-[#D1D6D1] hover:border-[#3A5A40]'}`}
                >
                  <div className={`w-1.5 rounded-l-2xl shrink-0 ${isHigh ? 'bg-red-500 shadow-[2px_0_10px_rgba(239,68,68,0.2)]' : 'bg-[#D1D6D1]'}`} />
                  
                  <div className="flex-1 flex items-center gap-2 md:gap-5 p-4 md:p-5">
                    {isSelectMode && (
                      <div className="shrink-0 mr-1">{isSelected ? <CheckSquare className="w-6 h-6 text-[#3A5A40]" /> : <Square className="w-6 h-6 text-slate-200" />}</div>
                    )}

                    <div className="flex flex-col items-center justify-center w-10 h-10 md:w-11 md:h-11 bg-[#2D3A30] rounded-xl shrink-0">
                      <span className="text-sm md:text-base font-black text-white">{format(new Date(order.deadline.replace(/-/g, '/')), 'dd')}</span>
                      <span className="text-[8px] md:text-[9px] font-bold text-[#A3B18A] uppercase">{format(new Date(order.deadline.replace(/-/g, '/')), 'MMM', { locale: zhCN })}</span>
                    </div>

                    <div className="flex-1 min-w-0 px-1 md:px-2">
                      <h4 className={`font-black text-[15px] md:text-lg tracking-tight truncate leading-tight mb-1.5 md:mb-2 ${stage.progress === 100 ? 'text-slate-300 line-through font-medium' : 'text-[#2D362E]'}`}>{order.title}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                        <span className="px-1 py-0.5 bg-[#EDF1EE] text-[#4F6D58] border border-[#D1D6D1] rounded text-[8px] md:text-[9px] font-black uppercase tracking-tighter shrink-0">{getShortSource(order.source)}</span>
                        <div className="flex items-center gap-1.5 ml-1 min-w-0">
                          <div className="w-10 h-1 bg-slate-200/50 rounded-full overflow-hidden shrink-0">
                            <div className="h-full transition-all duration-700" style={{ width: `${stage.progress}%`, backgroundColor: stage.color }} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-300 uppercase">{stage.progress}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-auto flex items-center gap-2 md:gap-4 shrink-0">
                      <div className="hidden sm:flex flex-col gap-1.5 md:gap-2">
                        <button onClick={(e) => togglePriority(order, e)} className={`p-1.5 rounded-lg border transition-all ${isHigh ? 'bg-red-50 text-red-500 border-red-100' : 'bg-slate-50 text-slate-200 border-slate-100 hover:text-amber-400'}`}>
                          <Star className={`w-3.5 h-3.5 ${isHigh ? 'fill-red-500' : ''}`} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); if(confirm('确定删除此项目吗？')) onDeleteOrder(order.id); }} className="p-1.5 rounded-lg border bg-white text-slate-300 border-slate-100 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <button onClick={(e) => handleExportSingleICS(order, e)} className="p-1.5 md:p-2 rounded-lg border bg-white text-[#3A5A40] border-[#D1D6D1] hover:bg-slate-50 shadow-sm flex items-center justify-center shrink-0">
                        <CalendarPlus className="w-4 h-4 md:w-5 md:h-5" />
                      </button>

                      <div className="flex flex-col items-end min-w-[60px] md:min-w-[84px]">
                        <div className="text-base md:text-lg font-black text-[#2D362E] tracking-tighter leading-none">¥{order.totalPrice.toLocaleString()}</div>
                        <span className="text-[8px] md:text-[9px] font-bold text-slate-300 uppercase mt-1.5 tracking-widest">Revenue</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderList;
