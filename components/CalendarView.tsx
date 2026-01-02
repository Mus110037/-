
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

  // 计算本月预估收入 (根据 deadline 在本月的订单)
  const monthlyProjected = orders
    .filter(o => isSameMonth(parseISO(o.deadline), currentDate))
    .reduce((sum, o) => {
      const amount = (o.source === '米画师' || o.source === '画加') ? o.totalPrice * 0.95 : o.totalPrice;
      return sum + amount;
    }, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-900">{format(currentDate, 'yyyy年 MMMM', { locale: zhCN })}</h2>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold hover:bg-white rounded-lg transition-all">今天</button>
              <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
          
          <div className="bg-violet-50 px-6 py-3 rounded-2xl flex items-center gap-3 border border-violet-100">
            <Wallet className="w-5 h-5 text-violet-600" />
            <div>
              <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">本月预计收入</p>
              <p className="text-lg font-black text-violet-700">¥{monthlyProjected.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-slate-100">
          {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => (
            <div key={day} className="bg-slate-50 p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
          {days.map((day, i) => {
            const dayOrders = orders.filter(o => isSameDay(parseISO(o.deadline), day));
            const isToday = isSameDay(day, new Date());
            return (
              <div key={i} className="bg-white min-h-[140px] p-3 hover:bg-slate-50/50 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                   <span className={`text-sm font-black ${isToday ? 'bg-violet-600 text-white w-7 h-7 flex items-center justify-center rounded-lg shadow-lg shadow-violet-200' : 'text-slate-400'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {dayOrders.map(order => {
                    const prog = STAGE_PROGRESS_MAP[order.progressStage];
                    return (
                      <div 
                        key={order.id} 
                        onClick={() => onEditOrder(order)}
                        className={`text-[10px] p-2 rounded-xl border truncate cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.98] ${
                          prog === 100 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm' 
                            : 'bg-white border-slate-100 text-slate-700 shadow-sm hover:border-violet-200'
                        }`}
                        title={`${order.title} (${order.progressStage})`}
                      >
                        <div className="font-bold truncate">{order.title}</div>
                        <div className="flex items-center justify-between mt-1 text-[8px] opacity-60">
                           <span>{order.artType}</span>
                           <span>{prog}%</span>
                        </div>
                      </div>
                    );
                  })}
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
