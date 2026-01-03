
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, isSameMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Order, STAGE_PROGRESS_MAP } from '../types';
import { ChevronLeft, ChevronRight, Wallet } from 'lucide-react';

interface CalendarViewProps {
  orders: Order[];
  onEditOrder: (order: Order) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ orders, onEditOrder }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthlyProjected = orders
    .filter(o => isSameMonth(parseISO(o.deadline), currentDate))
    .reduce((sum, o) => {
      const amount = (o.source === '米画师' || o.source === '画加') ? o.totalPrice * 0.95 : o.totalPrice;
      return sum + amount;
    }, 0);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        {/* 精简头部 */}
        <div className="px-5 py-4 md:px-8 md:py-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg md:text-2xl font-black text-slate-900">{format(currentDate, 'yyyy年 MMMM', { locale: zhCN })}</h2>
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg">
              <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded-md transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded-md transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          
          <div className="bg-violet-50 px-3 py-1.5 md:px-5 md:py-3 rounded-xl flex items-center gap-2 border border-violet-100">
            <Wallet className="w-4 h-4 text-violet-600 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[10px] font-black text-violet-400 uppercase leading-none mb-0.5">本月预估</span>
              <span className="text-xs md:text-lg font-black text-violet-700 leading-none">¥{monthlyProjected.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {/* 日历网格 */}
        <div className="grid grid-cols-7 gap-px bg-slate-50">
          {['一', '二', '三', '四', '五', '六', '日'].map(day => (
            <div key={day} className="bg-white py-2 text-center text-[9px] font-black text-slate-400">
              {day}
            </div>
          ))}
          {days.map((day, i) => {
            const dayOrders = orders.filter(o => isSameDay(parseISO(o.deadline), day));
            const isToday = isSameDay(day, new Date());
            return (
              <div key={i} className="bg-white min-h-[70px] md:min-h-[140px] p-1.5 hover:bg-slate-50 transition-colors">
                <div className="flex justify-center md:justify-start mb-1">
                   <span className={`text-[10px] md:text-sm font-black w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-md ${isToday ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'text-slate-300'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayOrders.slice(0, 3).map(order => {
                    const prog = STAGE_PROGRESS_MAP[order.progressStage];
                    return (
                      <div 
                        key={order.id} 
                        onClick={() => onEditOrder(order)}
                        className={`text-[8px] md:text-[10px] p-1 rounded-md border truncate cursor-pointer transition-all ${
                          prog === 100 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                            : 'bg-white border-slate-100 text-slate-700 shadow-sm'
                        }`}
                      >
                        <span className="font-bold truncate block">{order.title}</span>
                      </div>
                    );
                  })}
                  {dayOrders.length > 3 && (
                    <div className="text-[7px] text-slate-300 font-bold text-center">+{dayOrders.length - 3}</div>
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
