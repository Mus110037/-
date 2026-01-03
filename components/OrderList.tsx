
import React, { useState } from 'react';
import { Order, AppSettings, OrderStatus } from '../types';
import { Trash2, X, CheckSquare, Square, ArrowUpDown, CalendarPlus } from 'lucide-react';
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
    e.preventDefault();
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//HuaBing//Pro//CN\nMETHOD:PUBLISH\n";
    const deadline = order.deadline.replace(/-/g, '');
    icsContent += "BEGIN:VEVENT\n";
    icsContent += `UID:${order.id}@huabing.pro\n`;
    icsContent += `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}\n`;
    icsContent += `DTSTART;VALUE=DATE:${deadline}\n`;
    icsContent += `DTEND;VALUE=DATE:${deadline}\n`;
    icsContent += `SUMMARY:[画饼] ${order.title}\n`;
    icsContent += `DESCRIPTION:熟练度: ${order.progressStage}\\n金币: ¥${order.totalPrice}\\n备注: ${order.description}\n`;
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
    if (confirm(`确定要移除选中的 ${selectedIds.length} 个饼干吗？`)) {
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

  const handleDelete = (orderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    requestAnimationFrame(() => {
      if (window.confirm('确定要永久销毁这张“饼”吗？此操作无法撤销。')) {
        onDeleteOrder(orderId);
      }
    });
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
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${isSelectMode ? 'text-red-500' : 'text-[#D4A373]'}`}
          >
            {isSelectMode ? <><X className="w-4 h-4" /> 取消</> : <><CheckSquare className="w-4 h-4" /> 批量清算</>}
          </button>
          
          {isSelectMode && selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500 animate-in slide-in-from-left-2 duration-300"
            >
              <Trash2 className="w-4 h-4" /> 确认销毁 ({selectedIds.length})
            </button>
          )}

          {!isSelectMode && (
            <button 
              onClick={() => setSortMethod(sortMethod === 'deadline' ? 'createdAt' : 'deadline')}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#7A8B7C] hover:text-[#D4A373]"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortMethod === 'deadline' ? '按出炉日期' : '按入驻日期'}
            </button>
          )}
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.key} className="space-y-4">
          <div className="flex items-center gap-4 px-4">
             <h3 className="text-[11px] font-black text-[#2C332D] uppercase tracking-widest whitespace-nowrap">{group.key}</h3>
             <div className="flex-1 h-px bg-[#D6D2C4] opacity-50" />
             <span className="text-[10px] font-bold text-[#A8A291]">{group.orders.length}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 px-4">
            {group.orders.map((order) => {
              const stage = getStageConfig(order.progressStage);
              const isSelected = selectedIds.includes(order.id);
              const isHigh = order.priority === '高';
              
              return (
                <div 
                  key={order.id} 
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button')) return;
                    isSelectMode 
                      ? setSelectedIds(prev => prev.includes(order.id) ? prev.filter(i => i !== order.id) : [...prev, order.id]) 
                      : onEditOrder(order);
                  }}
                  className={`bg-[#FDFBF7] flex items-stretch rounded-[2rem] border transition-all cursor-pointer group shadow-sm ${isSelected ? 'border-[#D4A373] bg-amber-50/20 ring-2 ring-[#D4A373]/10' : 'border-[#D6D2C4] hover:border-[#D4A373]'}`}
                >
                  <div className={`w-1.5 rounded-l-[2rem] shrink-0 ${isHigh ? 'bg-[#D4A373]' : 'bg-[#D6D2C4]'}`} />
                  
                  <div className="flex-1 flex items-center gap-2 md:gap-5 p-3 md:p-5 overflow-hidden">
                    {isSelectMode && (
                      <div className="shrink-0 mr-1">{isSelected ? <CheckSquare className="w-6 h-6 text-[#D4A373]" /> : <Square className="w-6 h-6 text-[#D6D2C4]" />}</div>
                    )}
                    
                    <div className="flex flex-col items-center justify-center w-9 h-9 md:w-11 md:h-11 bg-[#2C332D] rounded-2xl shrink-0 shadow-sm">
                      <span className="text-[12px] md:text-base font-black text-white leading-none">{format(new Date(order.deadline.replace(/-/g, '/')), 'dd')}</span>
                      <span className="text-[7px] md:text-[9px] font-bold text-[#D4A373] uppercase mt-0.5">{format(new Date(order.deadline.replace(/-/g, '/')), 'MMM', { locale: zhCN })}</span>
                    </div>

                    <div className="flex-1 min-w-0 px-1">
                      <h4 className={`font-black text-[12px] md:text-lg tracking-tight leading-tight mb-1 md:mb-2 break-words ${stage.progress === 100 ? 'text-[#A8A291] line-through font-medium' : 'text-[#2C332D]'}`}>
                        {order.title}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1 py-0.5 bg-[#EDE9DF] text-[#D4A373] border border-[#D6D2C4] rounded text-[8px] font-black uppercase shrink-0">{getShortSource(order.source)}</span>
                        <div className="w-8 md:w-10 h-1 bg-[#E8E6DF] rounded-full overflow-hidden shrink-0">
                          <div className="h-full" style={{ width: `${stage.progress}%`, backgroundColor: stage.color }} />
                        </div>
                        <span className="text-[9px] font-bold text-[#A8A291] uppercase shrink-0">{stage.progress}%</span>
                      </div>
                    </div>

                    <div className="ml-auto flex items-center gap-1.5 md:gap-3 shrink-0">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => handleExportSingleICS(order, e)} 
                          className="p-2 md:p-2.5 rounded-xl border bg-white text-[#D4A373] border-[#D6D2C4] hover:bg-slate-50 shadow-sm flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                          title="同步日历"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={(e) => handleDelete(order.id, e)}
                          className="p-2 md:p-2.5 rounded-xl border bg-slate-50 text-slate-400 border-[#D6D2C4] hover:text-red-600 hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all shadow-sm flex items-center justify-center shrink-0"
                        >
                          <Trash2 className="w-4 h-4 pointer-events-none" />
                        </button>
                      </div>

                      <div className="flex flex-col items-end min-w-[70px] md:min-w-[100px] shrink-0 border-l border-slate-100 pl-2">
                        <div className="text-[14px] md:text-lg font-black text-[#2C332D] tracking-tighter tabular-nums leading-none">¥{order.totalPrice.toLocaleString()}</div>
                        <span className="text-[7px] md:text-[9px] font-bold text-[#A8A291] uppercase mt-1 tracking-widest leading-none">Amount</span>
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
