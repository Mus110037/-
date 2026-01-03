
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Order, AppSettings } from '../types';
import { ChevronLeft, ChevronRight, Share2, Calendar as CalendarIcon, Zap, ShieldCheck, Smartphone } from 'lucide-react';

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

  const handleExportICS = () => {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ArtNexus//Pro//CN',
      'X-WR-CALNAME:艺策排单表',
      'X-WR-TIMEZONE:Asia/Shanghai'
    ].join('\r\n');

    orders.forEach(order => {
      const dateStr = order.deadline.replace(/-/g, '');
      icsContent += [
        '\r\nBEGIN:VEVENT',
        `SUMMARY:DDL: ${order.title} (${order.artType})`,
        `DTSTART;VALUE=DATE:${dateStr}`,
        `DTEND;VALUE=DATE:${dateStr}`,
        `DESCRIPTION:金额: ${order.totalPrice}\\n来源: ${order.source}\\n类型: ${order.artType}\\n${order.description}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT9H',
        'DESCRIPTION:提醒: 今日稿件截止交付',
        'ACTION:DISPLAY',
        'END:VALARM',
        'END:VEVENT'
      ].join('\r\n');
    });

    icsContent += '\r\nEND:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `艺策同步_${format(new Date(), 'yyyyMMdd')}.ics`;
    link.click();
    alert('日历文件已生成。请在手机端打开此文件，选择“添加到日历”即可同步所有 DDL。');
  };

  const getEventStyle = (order: Order) => {
    const stage = getStageConfig(order.progressStage);
    const isP0 = order.priority === '高';
    
    return {
      style: { 
        backgroundColor: `${stage.color}15`, 
        borderColor: `${stage.color}30`, 
        color: stage.color,
        borderLeftColor: isP0 ? '#ef4444' : `${stage.color}30`,
        borderLeftWidth: isP0 ? '3px' : '1px'
      },
      className: "text-[9px] md:text-[10px] p-2 rounded-lg border truncate cursor-pointer transition-all mb-1 font-bold hover:shadow-sm hover:scale-[1.02] group relative overflow-hidden"
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{format(currentDate, 'yyyy年 MMMM', { locale: zhCN })}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Creative Timeline</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-slate-900"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-slate-900"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setCurrentDate(new Date())} className="text-[10px] font-bold text-slate-500 px-4 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all uppercase tracking-widest">今日</button>
             <button onClick={handleExportICS} className="text-[10px] font-bold text-white px-5 py-2 bg-slate-900 rounded-xl hover:bg-slate-800 transition-all uppercase tracking-widest shadow-lg shadow-slate-200 flex items-center gap-2">
               <Smartphone className="w-3.5 h-3.5" /> 同步至手机日历
             </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-slate-100">
          {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => (
            <div key={day} className="bg-white py-4 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">{day}</div>
          ))}
          {days.map((day, i) => {
            const dayOrders = orders.filter(o => isSameDay(parseISO(o.deadline), day));
            const isToday = isSameDay(day, new Date());
            return (
              <div key={i} className={`bg-white min-h-[140px] md:min-h-[160px] p-2 transition-colors border-b border-r border-slate-50/50 ${isToday ? 'bg-blue-50/20' : 'hover:bg-slate-50/50'}`}>
                <div className="flex justify-between items-start mb-2 px-1 pt-1">
                   <span className={`text-[10px] md:text-xs font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-300'}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="flex flex-col">
                  {dayOrders.slice(0, 4).map(order => {
                    const { style, className } = getEventStyle(order);
                    return (
                      <div key={order.id} onClick={() => onEditOrder(order)} className={className} style={style}>
                        <div className="flex items-center gap-1">
                           {order.priority === '高' && <Zap className="w-2 h-2 fill-current shrink-0" />}
                           <span className="truncate">{order.title}</span>
                        </div>
                      </div>
                    );
                  })}
                  {dayOrders.length > 4 && (
                    <div className="text-[8px] text-slate-300 font-bold text-center mt-1 uppercase">
                      +{dayOrders.length - 4} More
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">本月排单</p>
            <p className="text-lg font-bold text-slate-900">{orders.filter(o => format(parseISO(o.deadline), 'MM') === format(currentDate, 'MM')).length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">加急处理</p>
            <p className="text-lg font-bold text-slate-900">{orders.filter(o => o.priority === '高' && format(parseISO(o.deadline), 'MM') === format(currentDate, 'MM')).length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">已完成交付</p>
            <p className="text-lg font-bold text-slate-900">{orders.filter(o => getStageConfig(o.progressStage).progress === 100 && format(parseISO(o.deadline), 'MM') === format(currentDate, 'MM')).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
