
import React, { useState } from 'react';
import { format, endOfMonth, eachDayOfInterval, isSameDay, addMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';
import { Order, AppSettings } from '../types';
import { ChevronLeft, ChevronRight, Wallet, CheckCircle2, Clock } from 'lucide-react';

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

  const calculateActual = (o: Order) => {
    const source = settings.sources.find(s => s.name === o.source) || { name: o.source, fee: 0 };
    return o.totalPrice * (1 - source.fee / 100);
  };

  const currentMonthOrders = orders.filter(o => format(new Date(o.deadline.replace(/-/g, '/')), 'yyyy-MM') === format(currentDate, 'yyyy-MM'));
  const monthProjected = currentMonthOrders.reduce((sum, o) => sum + calculateActual(o), 0);
  const monthActual = currentMonthOrders.filter(o => getStageConfig(o.progressStage).progress === 100).reduce((sum, o) => sum + calculateActual(o), 0);
  const monthTotalDuration = currentMonthOrders
    .filter(o => getStageConfig(o.progressStage).progress === 100 && o.actualDuration !== undefined)
    .reduce((sum, o) => sum + (o.actualDuration || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-[#FAFAF5] p-5 rounded-xl border border-[#D1D6D1] shadow-sm flex items-center gap-4">
          <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0"><Wallet className="w-4 h-4" /></div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">月度预收</p>
            <p className="text-lg font-black text-[#2D362E] truncate">¥{monthProjected.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-[#FAFAF5] p-5 rounded-xl border border-[#D1D6D1] shadow-sm flex items-center gap-4">
          <div className="w-9 h-9 bg-[#2D3A30] rounded-lg flex items-center justify-center text-white shrink-0 shadow-md"><CheckCircle2 className="w-4 h-4" /></div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">已入账</p>
            <p className="text-lg font-black text-[#2D362E] truncate">¥{monthActual.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-[#EDF1EE] p-5 rounded-xl border border-[#D1D6D1] shadow-sm flex items-center gap-4 col-span-2 lg:col-span-1">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-[#3A5A40] shrink-0 shadow-sm"><Clock className="w-4 h-4" /></div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-[#4F6D58] uppercase tracking-widest">工时</p>
            <p className="text-lg font-black text-[#2D3A30] truncate">{monthTotalDuration.toFixed(1)}H</p>
          </div>
        </div>
      </div>

      <div className="bg-[#FAFAF5] rounded-xl shadow-sm border border-[#D1D6D1] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap justify-between items-center bg-white gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-[#1B241D] tracking-tight">{format(currentDate, 'yyyy MMMM', { locale: zhCN })}</h2>
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 hover:bg-white rounded-md transition-all text-slate-400 hover:text-slate-900"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-white rounded-md transition-all text-slate-400 hover:text-slate-900"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentDate(new Date())} className="text-xs font-black text-white px-5 py-3 bg-[#2D3A30] rounded-xl hover:bg-slate-800 transition-all shadow-sm">今日</button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-slate-200">
          {['一', '二', '三', '四', '五', '六', '日'].map(day => (
            <div key={day} className="bg-white py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
          ))}
          {days.map((day, i) => {
            const dayOrders = orders.filter(o => isSameDay(new Date(o.deadline.replace(/-/g, '/')), day));
            const isToday = isSameDay(day, new Date());
            return (
              <div key={i} className={`bg-white min-h-[90px] md:min-h-[140px] p-1.5 md:p-2 transition-colors border-b border-r border-slate-100 relative ${isToday ? 'bg-[#FAFAF7]' : ''}`}>
                <div className="flex justify-start mb-2">
                   <span className={`text-[11px] font-black w-7 h-7 flex items-center justify-center rounded-lg shadow-sm ${isToday ? 'bg-[#2D3A30] text-white ring-4 ring-[#A3B18A]/30' : 'text-slate-400 bg-slate-50 border border-slate-100'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="flex flex-col items-start gap-1">
                  {dayOrders.slice(0, 4).map(order => {
                    const stage = getStageConfig(order.progressStage);
                    const isHigh = order.priority === '高';
                    return (
                      <div 
                        key={order.id} 
                        onClick={() => onEditOrder(order)} 
                        className={`w-full relative h-4 md:h-6 rounded md:rounded-md overflow-hidden border border-slate-100 bg-slate-50 cursor-pointer transition-all mb-0.5 group flex items-center`}
                      >
                        <div className="absolute inset-y-0 left-0 w-full opacity-20" style={{ backgroundColor: stage.color }} />
                        <div className="absolute inset-y-0 left-0 w-1 md:w-0.5" style={{ backgroundColor: stage.color }} />
                        <div className="relative z-10 h-full flex items-center px-1 md:px-1.5 gap-1 overflow-hidden">
                          <span className={`text-[7px] md:text-[9px] font-bold truncate ${isHigh ? 'text-red-600' : 'text-[#2D362E]'}`}>
                            {order.title}
                          </span>
                        </div>
                        {isHigh && <div className="absolute right-0.5 w-1 h-1 bg-red-500 rounded-full md:hidden" />}
                      </div>
                    );
                  })}
                  {dayOrders.length > 4 && <div className="text-[8px] font-black text-slate-300 ml-1.5">+</div>}
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
