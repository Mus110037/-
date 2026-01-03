
import React, { useState } from 'react';
import { Order, AppSettings, OrderStatus } from '../types';
import { Trash2, X, CheckSquare, Square, ArrowUpDown, CalendarPlus, Cookie, MapPin, Tag, Clock, CheckCircle2 } from 'lucide-react';
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
    const map: Record<string, string> = { '米画师': 'MHS', '画加': 'HJ', '小红书': 'XHS', '推特': 'X', '私单': 'PERSONAL' };
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
    icsContent += `DESCRIPTION:阶段: ${order.progressStage}\\n金币: ¥${order.totalPrice}\\n备注: ${order.description}\n`;
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
    if (confirm(`确定要扔掉这 ${selectedIds.length} 块饼吗？一旦扔掉就找不回来啦！`)) {
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
    if (window.confirm('确定要永久销毁这张“饼”吗？甲方会哭的。')) {
      onDeleteOrder(orderId);
    }
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
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isSelectMode ? 'text-red-500' : 'text-[#D4A373]'}`}
          >
            {isSelectMode ? <><X className="w-3.5 h-3.5" /> 取消</> : <><CheckSquare className="w-3.5 h-3.5" /> 批量清理</>}
          </button>
          
          {isSelectMode && selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 animate-in slide-in-from-left-2 duration-300"
            >
              <Trash2 className="w-3.5 h-3.5" /> 确认销毁 ({selectedIds.length})
            </button>
          )}

          {!isSelectMode && (
            <button 
              onClick={() => setSortMethod(sortMethod === 'deadline' ? 'createdAt' : 'deadline')}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#A8A291] hover:text-[#D4A373]"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortMethod === 'deadline' ? '按出炉日期' : '按入驻日期'}
            </button>
          )}
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.key} className="space-y-5">
          <div className="flex items-center gap-4 px-5">
             <h3 className="text-[10px] font-black text-[#7A8B7C] uppercase tracking-[0.2em] whitespace-nowrap">{group.key}</h3>
             <div className="flex-1 h-px bg-[#D6D2C4] opacity-30" />
          </div>

          <div className="grid grid-cols-1 gap-4 px-4">
            {group.orders.map((order) => {
              const stage = getStageConfig(order.progressStage);
              const isSelected = selectedIds.includes(order.id);
              const isHigh = order.priority === '高';
              const isFinished = stage.progress === 100;
              
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
                  className={`bg-[#FDFBF7] flex flex-col rounded-[2.5rem] border transition-all cursor-pointer group shadow-sm overflow-hidden ${
                    isSelected ? 'border-[#D4A373] ring-4 ring-[#D4A373]/10' : 'border-[#D6D2C4] hover:border-[#D4A373]'
                  } ${isHigh && !isFinished ? 'ring-2 ring-red-100 shadow-[0_4px_15px_rgba(239,68,68,0.1)]' : ''}`}
                >
                  <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
                    {/* 头部：日期 + 标题 */}
                    <div className="flex items-start gap-4 flex-1">
                      {isSelectMode && (
                        <div className="shrink-0 pt-1">
                          {isSelected ? <CheckSquare className="w-6 h-6 text-[#D4A373]" /> : <Square className="w-6 h-6 text-[#D6D2C4]" />}
                        </div>
                      )}
                      
                      <div className={`flex flex-col items-center justify-center w-11 h-11 rounded-2xl shrink-0 shadow-sm ${isFinished ? 'bg-[#D4A373] text-white' : 'bg-[#2C332D] text-[#FDFBF7]'}`}>
                        <span className="text-[14px] font-black leading-none">{format(new Date(order.deadline.replace(/-/g, '/')), 'dd')}</span>
                        <span className="text-[8px] font-bold uppercase mt-0.5 opacity-60">{format(new Date(order.deadline.replace(/-/g, '/')), 'MMM', { locale: zhCN })}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isHigh && !isFinished && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
                          <h4 className={`font-black text-[15px] md:text-lg tracking-tight leading-snug break-words ${isFinished ? 'text-[#A8A291] line-through opacity-60' : 'text-[#2C332D]'}`}>
                            {order.title}
                          </h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                           <span className="flex items-center gap-1 px-2 py-0.5 bg-[#EDE9DF] text-[#7A8B7C] rounded-lg text-[8px] font-black uppercase tracking-wider">
                             <MapPin className="w-2 h-2" /> {getShortSource(order.source)}
                           </span>
                           <span className="flex items-center gap-1 px-2 py-0.5 bg-[#F2F4F0] text-[#D4A373] rounded-lg text-[8px] font-black uppercase tracking-wider">
                             <Tag className="w-2 h-2" /> {order.artType}
                           </span>
                        </div>
                      </div>
                    </div>

                    {/* 信息区：进度 + 价格 */}
                    <div className="mt-2 md:mt-0 flex items-center justify-between md:ml-auto md:w-auto md:gap-8">
                       <div className="flex flex-col gap-1 md:items-end">
                         <div className="flex items-center gap-2">
                           <div className="w-20 md:w-24 h-1.5 bg-[#E8E6DF] rounded-full overflow-hidden">
                             <div className="h-full transition-all duration-1000" style={{ width: `${stage.progress}%`, backgroundColor: stage.color }} />
                           </div>
                           <span className="text-[10px] font-black text-[#A8A291] tabular-nums">{stage.progress}%</span>
                         </div>
                         <span className="text-[8px] font-bold text-[#A8A291] uppercase tracking-widest">{order.progressStage}</span>
                       </div>

                       <div className="flex flex-col items-end border-l border-[#D6D2C4]/30 pl-4">
                         <div className="text-lg md:text-xl font-black text-[#2C332D] tracking-tighter tabular-nums">¥{order.totalPrice.toLocaleString()}</div>
                         <div className="flex items-center gap-1 text-[8px] font-black text-[#A8A291] uppercase tracking-widest">
                           {order.commissionType}
                         </div>
                       </div>
                    </div>

                    {/* 操作按钮区 */}
                    {!isSelectMode && (
                      <div className="flex items-center justify-end gap-2 border-t border-[#D6D2C4]/30 pt-4 mt-2 md:mt-0 md:pt-0 md:border-t-0 md:ml-4">
                        <button 
                          onClick={(e) => handleExportSingleICS(order, e)} 
                          className="p-3 rounded-2xl border bg-white text-[#D4A373] border-[#D6D2C4] hover:bg-slate-50 shadow-sm flex items-center justify-center transition-all active:scale-90"
                          title="同步日程"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(order.id, e)}
                          className="p-3 rounded-2xl border bg-slate-50 text-slate-300 border-[#D6D2C4] hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all active:scale-90 flex items-center justify-center"
                          title="永久销毁"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-10">
           <div className="w-20 h-20 bg-[#EDE9DF] rounded-full flex items-center justify-center text-[#A8A291]">
             <Cookie className="w-10 h-10 opacity-20" />
           </div>
           <div>
             <h4 className="font-black text-[#2C332D] tracking-tight">烤箱里空荡荡的</h4>
             <p className="text-xs text-[#A8A291] mt-1">快去画一张“饼”填满这里吧！</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
