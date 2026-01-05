
import React, { useState } from 'react';
import { format, endOfMonth, eachDayOfInterval, isSameDay, addMonths, parseISO, isSameMonth as dfIsSameMonth, isSameYear as dfIsSameYear } from 'date-fns'; // Added parseISO
import { zhCN } from 'date-fns/locale/zh-CN';
import { Order, AppSettings } from '../types';
import { ChevronLeft, ChevronRight, Wallet, CheckCircle2, Clock } from 'lucide-react';

interface CalendarViewProps {
  orders: Order[];
  onEditOrder: (order: Order) => void;
  settings: AppSettings;
}

// 定义用于日历上半月和下半月背景色的调色板
const CALENDAR_HALF_MONTH_BG_PALETTE = ['#FDFBF7', '#F9F9F4']; // #F9F9F4 比 #F4F1EA 更亮

const CalendarView: React.FC<CalendarViewProps> = ({ orders, onEditOrder, settings }) => {
  const [currentDate, setCurrentMonth] = useState(new Date()); // Renamed for clarity to avoid confusion with `currentDate` in `App.tsx`

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

  const currentMonthOrders = orders.filter(o => {
    try {
      // Use parseISO for YYYY-MM-DD format
      const orderDate = parseISO(o.deadline);
      return dfIsSameMonth(orderDate, currentDate);
    } catch {
      return false;
    }
  });
  
  const monthProjected = currentMonthOrders.reduce((sum, o) => sum + calculateActual(o), 0);
  const monthActual = currentMonthOrders.filter(o => getStageConfig(o.progressStage).progress === 100).reduce((sum, o) => sum + calculateActual(o), 0);
  const monthTotalDuration = currentMonthOrders
    .filter(o => getStageConfig(o.progressStage).progress === 100 && o.actualDuration !== undefined)
    .reduce((sum, o) => sum + (o.actualDuration || 0), 0);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-700 pb-32 md:pb-24 px-1 md:px-4"> {/* Increased desktop padding */}
      {/* 顶部 KPI：移动端 2 列，桌面端 3 列 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-4">
        <div className="bg-[#FDFBF7] p-3 md:p-5 rounded-2xl border border-[#D1D6D1] shadow-sm flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[#FDFBF7] rounded-xl flex items-center justify-center text-slate-400 shrink-0 border border-slate-100"><Wallet className="w-4 h-4" /></div>
          <div className="min-w-0">
            <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">月度预收</p>
            <p className="text-sm md:text-2xl font-black text-[#2D362E] truncate tracking-tighter">¥{monthProjected.toLocaleString()}</p> {/* Increased desktop text size */}
          </div>
        </div>
        <div className="bg-[#FDFBF7] p-3 md:p-5 rounded-2xl border border-[#D1D6D1] shadow-sm flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[#4B5E4F] rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"><CheckCircle2 className="w-4 h-4" /></div>
          <div className="min-w-0">
            <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">已入账</p>
            <p className="text-sm md:text-2xl font-black text-[#2D362E] truncate tracking-tighter">¥{monthActual.toLocaleString()}</p> {/* Increased desktop text size */}
          </div>
        </div>
        <div className="bg-[#FDFBF7] p-3 md:p-5 rounded-2xl border border-[#D1D6D1] shadow-sm flex items-center gap-3 md:gap-4 col-span-2 lg:col-span-1">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[#FDFBF7] rounded-xl flex items-center justify-center text-[#4B5E4F] shrink-0 border border-[#D1D9D3]"><Clock className="w-4 h-4" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[7px] md:text-[9px] font-black text-[#4B5E4F]/60 uppercase tracking-widest">累计烘焙工时</p>
            <p className="text-sm md:text-2xl font-black text-[#2D3A30] truncate tracking-tighter">{monthTotalDuration.toFixed(1)}H</p> {/* Increased desktop text size */}
          </div>
        </div>
      </div>

      {/* 日历主体 */}
      <div className="bg-[#FDFBF7] rounded-[2rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-[#D1D6D1] overflow-hidden">
        {/* 日历头部：更紧凑的移动端布局 */}
        <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-[#FDFBF7]">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h2 className="text-sm md:text-lg font-black text-[#1B241D] tracking-tight leading-none">{format(currentDate, 'yyyy MMMM', { locale: zhCN })}</h2>
              <span className="text-[7px] font-bold text-[#A8A291] uppercase tracking-[0.2em] mt-1 hidden md:block">Baking Calendar</span>
            </div>
            <div className="flex items-center gap-1 bg-[#F4F1EA]/50 p-1 rounded-xl border border-[#D6D2C4]/30">
              <button onClick={() => setCurrentMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-[#FDFBF7] rounded-lg transition-all text-[#A8A291] hover:text-[#4B5E4F]"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <button onClick={() => setCurrentMonth(addMonths(currentDate, 1))} className="p-1.5 hover:bg-[#FDFBF7] rounded-lg transition-all text-[#A8A291] hover:text-[#4B5E4F]"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <button onClick={() => setCurrentMonth(new Date())} className="text-[9px] font-black text-[#4B5E4F] px-4 py-2 bg-[#F4F1EA] rounded-xl hover:bg-[#D6D2C4]/20 transition-all border border-[#D6D2C4]/40 uppercase tracking-widest">Today</button>
        </div>
        
        {/* 星期表头：移动端缩短 */}
        <div className="grid grid-cols-7 gap-px bg-slate-100/50">
          {['一', '二', '三', '四', '五', '六', '日'].map((day, idx) => (
            <div key={day} className={`bg-[#FDFBF7] py-3 text-center text-[9px] font-black tracking-widest ${idx >= 5 ? 'text-[#D4A373]' : 'text-[#A8A291]'}`}>{day}</div>
          ))}
          
          {/* 日期单元格 */}
          {days.map((day, i) => {
            const dayOrders = orders.filter(o => {
              try {
                // Use parseISO for YYYY-MM-DD format
                return isSameDay(parseISO(o.deadline), day);
              } catch {
                return false;
              }
            });
            const isToday = isSameDay(day, new Date());
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isFirstHalf = day.getDate() <= 15;

            return (
              <div 
                key={i} 
                className={`min-h-[75px] md:min-h-[140px] p-1 md:p-2 transition-colors border-b border-r border-slate-50 relative group ${isToday ? 'bg-[#FDFBF7]' : CALENDAR_HALF_MONTH_BG_PALETTE[isFirstHalf ? 0 : 1]} ${isWeekend ? 'bg-[#FAFAF9]/30' : ''}`}
              >
                {/* 日期数字 */}
                <div className="flex justify-start mb-1.5 md:mb-2">
                   <span className={`text-[11px] md:text-lg font-black w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-[#4B5E4F] text-white shadow-[0_4px_10px_-2px_rgba(75,94,79,0.4)]' : 'text-[#A8A291] group-hover:text-[#4B5E4F]'}`}> {/* Increased date number size */}
                    {format(day, 'd')}
                  </span>
                </div>

                {/* 饼干（企划条）容器 */}
                <div className="flex flex-col gap-0.5 md:gap-1">
                  {dayOrders.slice(0, 3).map(order => {
                    const stage = getStageConfig(order.progressStage);
                    const isHigh = order.priority === '高';
                    const isFinished = stage.progress === 100;
                    
                    return (
                      <div 
                        key={order.id} 
                        onClick={() => onEditOrder(order)} 
                        className={`w-full relative h-3.5 md:h-6 rounded-md overflow-hidden transition-all cursor-pointer flex items-center px-1 shadow-sm 
                        ${isHigh && !isFinished ? 'bg-[#FEECEB] border-2 border-[#E07A5F] ring-2 ring-[#E07A5F]/60 shadow-md font-bold' : 'bg-[#F4F1EA] border border-[#D6D2C4]/40'}
                        hover:scale-[1.02] active:scale-95`}
                      >
                        {/* 进度条填充 */}
                        <div 
                          className="absolute inset-0 rounded-md transition-all duration-500" 
                          style={{ width: `${stage.progress}%`, backgroundColor: stage.color }} 
                        />

                        {/* 标题：由于背景色统一，文字颜色成为了唯一的区分度 */}
                        <div className="relative z-10 w-full flex items-center gap-1 overflow-hidden pointer-events-none">
                          <span className={`text-[8px] md:text-[11px] font-black truncate leading-none ${isFinished ? 'text-[#A8A291] line-through opacity-60' : 'text-[#2D3A30]'}`}> {/* Increased title size */}
                            {order.title}
                          </span>
                        </div>
                        
                        {isHigh && !isFinished && <div className="absolute top-0 right-0 w-1 h-1 bg-[#E07A5F] rounded-bl-sm z-20" />}
                      </div>
                    );
                  })}
                  
                  {/* 更多指示器 */}
                  {dayOrders.length > 3 && (
                    <div className="flex justify-center md:justify-start">
                      <div className="text-[7px] md:text-[9px] font-black text-[#D4A373] bg-[#D4A373]/10 px-1 rounded-sm tracking-tighter"> {/* Increased more indicator size */}
                        +{dayOrders.length - 3}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部备注 */}
      <div className="text-center md:text-left px-4">
        <p className="text-[7.5px] md:text-[9px] font-bold text-[#A8A291] uppercase tracking-[0.2em] leading-relaxed">
          * 日历视图仅展示近期企划概览 · 点击日期单元格查看详情
        </p>
      </div>
    </div>
  );
};

export default CalendarView;