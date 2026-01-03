
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Order, AppSettings } from '../types';
import { ChevronLeft, ChevronRight, Smartphone, Wallet, CheckCircle2 } from 'lucide-react';

interface CalendarViewProps {
  orders: Order[];
  onEditOrder: (order: Order) => void;
  settings: AppSettings;
}

const CalendarView: React.FC<CalendarViewProps> = ({ orders, onEditOrder, settings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const start = startOfMonth(currentDate);
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

  // 统计当月金额
  const currentMonthOrders = orders.filter(o => format(parseISO(o.deadline), 'yyyy-MM') === format(currentDate, 'yyyy-MM'));
  const monthProjected = currentMonthOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const monthActual = currentMonthOrders.filter(o => getStageConfig(o.progressStage).progress === 100).reduce((sum, o) => sum + calculateActual(o), 0);

  const getEventStyle = (order: Order) => {
    const stage = getStageConfig(order.progressStage);
    const isP0 = order.priority === '高';
    return {
      style: { 
        backgroundColor: `${stage.color}10`, 
        borderColor: `${stage.color}40`, 
        color: stage.color,
        borderLeftColor: isP0 ? '#000' : `${stage.color}40`,
        borderLeftWidth: isP0 ? '3px' : '1px'
      },
      className: "text-[8px] md:text-[9px] p-1.5 rounded-lg border truncate cursor-pointer transition-all mb-1 font-bold hover:shadow-sm"
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-10">
      {/* 当月概览卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">本月预收总额</p>
            <p className="text-base font-black text-slate-900">¥{monthProjected.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">本月已收实到</p>
            <p className="text-base font-black text-slate-900">¥{monthActual.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{format(currentDate, 'yyyy年 MMMM', { locale: zhCN })}</h2>
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1.5 hover:bg-white rounded-md transition-all text-slate-400 hover:text-slate-900"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1.5 hover:bg-white rounded-md transition-all text-slate-400 hover:text-slate-900"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="text-[10px] font-bold text-slate-900 px-4 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all uppercase tracking-widest">今日</button>
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-slate-100">
          {['一', '二', '三', '四', '五', '六', '日'].map(day => (
            <div key={day} className="bg-white py-3 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>
          ))}
          {days.map((day, i) => {
            const dayOrders = orders.filter(o => isSameDay(parseISO(o.deadline), day));
            const isToday = isSameDay(day, new Date());
            return (
              <div key={i} className={`bg-white min-h-[90px] md:min-h-[140px] p-1.5 transition-colors border-b border-r border-slate-50 ${isToday ? 'bg-slate-50/50' : ''}`}>
                <div className="flex justify-start mb-1 px-1">
                   <span className={`text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-lg ${isToday ? 'bg-slate-900 text-white shadow-md' : 'text-slate-300'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="flex flex-col">
                  {dayOrders.slice(0, 3).map(order => {
                    const { style, className } = getEventStyle(order);
                    return (
                      <div key={order.id} onClick={() => onEditOrder(order)} className={className} style={style}>
                        <span className="truncate">{order.title}</span>
                      </div>
                    );
                  })}
                  {dayOrders.length > 3 && (
                    <div className="text-[7px] text-slate-400 font-bold text-center mt-1">+{dayOrders.length - 3}</div>
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
