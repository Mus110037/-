
import React, { useState } from 'react';
import { format, endOfMonth, eachDayOfInterval, isSameDay, addMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';
import { Order, AppSettings } from '../types';
import { ChevronLeft, ChevronRight, Smartphone, Wallet, CheckCircle2, Clock } from 'lucide-react';

interface CalendarViewProps {
  orders: Order[];
  onEditOrder: (order: Order) => void;
  settings: AppSettings;
}

const CalendarView: React.FC<CalendarViewProps> = ({ orders, onEditOrder, settings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  const getStageConfig = (stageName: string) => {
    return settings.stages.find(s => s.name === stageName) || settings.stages[0];
  };

  const getSourceConfig = (sourceName: string) => {
    return settings.sources.find(s => s.name === sourceName) || { name: sourceName, fee: 0 };
  };

  const calculateActual = (o: Order) => {
    const source = getSourceConfig(o.source);
    return o.totalPrice * (1 - source.fee / 100);
  };

  const currentMonthOrders = orders.filter(o => format(new Date(o.deadline.replace(/-/g, '/')), 'yyyy-MM') === format(currentDate, 'yyyy-MM'));
  
  // 修改为：预计本月实收 (已扣去手续费)
  const monthProjected = currentMonthOrders.reduce((sum, o) => sum + calculateActual(o), 0);
  
  const monthActual = currentMonthOrders.filter(o => getStageConfig(o.progressStage).progress === 100).reduce((sum, o) => sum + calculateActual(o), 0);
  
  // 计算本月累计耗时 (小时)
  const monthTotalDuration = currentMonthOrders
    .filter(o => getStageConfig(o.progressStage).progress === 100 && o.actualDuration !== undefined)
    .reduce((sum, o) => sum + (o.actualDuration || 0), 0);

  const getEventStyle = (order: Order) => {
    const stage = getStageConfig(order.progressStage);
    const isP0 = order.priority === '高';
    const textColor = '#1B241D'; 

    return {
      style: { 
        backgroundColor: `${stage.color}18`,
        borderColor: `${stage.color}50`, 
        color: textColor,
        borderLeftColor: stage.color, 
        borderLeftWidth: '4px'
      },
      className: `text-[10px] md:text-[11px] px-2 py-1.5 md:py-2 rounded-md border truncate cursor-pointer transition-all mb-1 font-black hover:shadow-lg leading-tight flex items-center shadow-sm ${isP0 ? 'ring-1 ring-red-600/30' : ''}`
    };
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-10">
      {/* 当月概览卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
            <Wallet className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">本月预收 (净)</p>
            <p className="text-sm md:text-base font-black text-slate-900 truncate">¥{monthProjected.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[#2D3A30] rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">本月已入账</p>
            <p className="text-sm md:text-base font-black text-slate-900 truncate">¥{monthActual.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-[#EDF1EE] p-4 md:p-5 rounded-2xl border border-[#D1D9D3] shadow-sm flex items-center gap-3 md:gap-4 col-span-2 lg:col-span-1">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center text-[#3A5A40] shrink-0 shadow-sm">
            <Clock className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] md:text-[9px] font-bold text-[#4F6D58] uppercase tracking-widest mb-0.5">本月累计工时</p>
            <p className="text-sm md:text-base font-black text-[#2D3A30] truncate">{monthTotalDuration.toFixed(1)} <span className="text-[10px]">HOURS</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-4 md:px-6 md:py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2 md:gap-4">
            <h2 className="text-sm md:text-lg font-bold text-[#1B241D] tracking-tight">{format(currentDate, 'yyyy年 MMMM', { locale: zhCN })}</h2>
            <div className="flex items-center gap-0.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 hover:bg-white rounded-md transition-all text-slate-400 hover:text-slate-900"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-white rounded-md transition-all text-slate-400 hover:text-slate-900"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="text-[8px] md:text-[10px] font-bold text-[#3A5A40] px-3 py-1.5 md:px-4 md:py-2 bg-[#F2F4F0] rounded-lg hover:bg-[#D1D9D3] transition-all uppercase tracking-widest border border-[#D1D9D3]">今日</button>
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-slate-100">
          {['一', '二', '三', '四', '五', '六', '日'].map(day => (
            <div key={day} className="bg-white py-2 md:py-3 text-center text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
          ))}
          {days.map((day, i) => {
            const dayOrders = orders.filter(o => isSameDay(new Date(o.deadline.replace(/-/g, '/')), day));
            const isToday = isSameDay(day, new Date());
            return (
              <div key={i} className={`bg-white min-h-[80px] md:min-h-[160px] p-2 md:p-3 transition-colors border-b border-r border-slate-50 relative ${isToday ? 'bg-[#FDFDFB]' : ''}`}>
                <div className="flex justify-start mb-3">
                   <span className={`text-[10px] md:text-[11px] font-black w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-xl shadow-sm transition-all ${isToday ? 'bg-[#2D3A30] text-white ring-4 ring-[#A3B18A]/30' : 'text-slate-400 bg-slate-50 border border-slate-100'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {dayOrders.slice(0, 4).map(order => {
                    const { style, className } = getEventStyle(order);
                    return (
                      <div key={order.id} onClick={() => onEditOrder(order)} className={className} style={style}>
                        <span className="truncate block w-full">{order.title}</span>
                      </div>
                    );
                  })}
                  {dayOrders.length > 4 && (
                    <div className="text-[9px] text-[#4F6D58] font-black text-center py-1.5 mt-0.5 bg-[#EDF1EE] rounded-lg border border-[#D1D9D3]">+{dayOrders.length - 4} 更多企划</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
