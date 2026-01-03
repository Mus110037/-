
import React from 'react';
import { Order, AppSettings, OrderStatus } from '../types';
import { Zap, ArrowUpDown, Smartphone, Download, CalendarCheck, FileSpreadsheet, Clock, Tag, ExternalLink, Briefcase, User, Users } from 'lucide-react';
import { format, isSameMonth, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

interface OrderListProps {
  orders: Order[];
  onEditOrder: (order: Order) => void;
  settings: AppSettings;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onEditOrder, settings }) => {
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(a.deadline.replace(/-/g, '/')).getTime() - new Date(b.deadline.replace(/-/g, '/')).getTime()
  );

  const getStageConfig = (stageName: string) => {
    return settings.stages.find(s => s.name === stageName) || settings.stages[0];
  };

  // 优先级圆点渲染
  const renderPriorityDot = (priority: Order['priority']) => {
    const colors = {
      '高': 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
      '中': 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
      '低': 'bg-slate-300'
    };
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-full">
        <div className={`w-2 h-2 rounded-full ${colors[priority]}`} />
        <span className="text-[9px] font-black text-slate-500 uppercase">{priority}</span>
      </div>
    );
  };

  // 标签颜色逻辑
  const getTagStyle = (type: 'source' | 'artType' | 'personCount' | 'comm') => {
    const styles = {
      source: 'bg-blue-50 text-blue-600 border-blue-100',
      artType: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      personCount: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      comm: 'bg-orange-50 text-orange-600 border-orange-100'
    };
    return `px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-colors flex items-center gap-1.5 ${styles[type]}`;
  };

  // 分组逻辑：按月，月内以15号分割
  const groups: { title: string; orders: Order[]; isNewMonth: boolean }[] = [];
  let lastGroupKey = "";

  sortedOrders.forEach((order) => {
    const date = new Date(order.deadline.replace(/-/g, '/'));
    const month = format(date, 'M月');
    const isSecondHalf = date.getDate() > 15;
    const groupKey = `${format(date, 'yyyy-MM')}-${isSecondHalf ? 'late' : 'early'}`;
    
    if (groupKey !== lastGroupKey) {
      const isNewMonth = lastGroupKey === "" || !lastGroupKey.startsWith(format(date, 'yyyy-MM'));
      groups.push({
        title: `${month} · ${isSecondHalf ? '下半月' : '上半月'}`,
        orders: [order],
        isNewMonth
      });
      lastGroupKey = groupKey;
    } else {
      groups[groups.length - 1].orders.push(order);
    }
  });

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-500">
      {groups.map((group, gIdx) => (
        <div key={group.title} className={`${group.isNewMonth && gIdx !== 0 ? 'pt-10' : ''}`}>
          <div className="flex items-center gap-4 mb-6 px-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
              {group.title}
            </h3>
            <div className="h-px w-full bg-slate-200 opacity-50" />
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {group.orders.map((order) => {
              const stage = getStageConfig(order.progressStage);
              const isCompleted = stage.progress === 100;
              const deadlineDate = new Date(order.deadline.replace(/-/g, '/'));
              
              return (
                <div key={order.id} onClick={() => onEditOrder(order)} className="flex items-center gap-4 md:gap-6 p-5 md:p-7 hover:bg-slate-50 transition-all cursor-pointer group">
                  {/* 日期徽章 */}
                  <div className="flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-[#2D3A30] rounded-2xl shrink-0 shadow-lg border border-white/5 transition-transform group-hover:scale-105">
                    <span className="text-[16px] md:text-[18px] font-black text-white leading-none tracking-tighter">
                      {format(deadlineDate, 'dd')}
                    </span>
                    <span className="text-[9px] md:text-[10px] font-bold text-[#A3B18A] leading-none mt-1.5 uppercase tracking-widest">
                      {format(deadlineDate, 'M月')}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h4 className={`font-black text-[15px] md:text-[17px] tracking-tight truncate max-w-[70%] ${isCompleted ? 'text-slate-300 line-through font-bold' : 'text-slate-900'}`}>
                        {order.title}
                      </h4>
                      {renderPriorityDot(order.priority)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {/* 进度控制 */}
                      <div className="flex items-center gap-2 mr-2">
                        <div className="w-20 md:w-24 h-2.5 bg-[#F2F4F0] rounded-full overflow-hidden shrink-0 border border-slate-200">
                          <div className="h-full transition-all duration-700" style={{ width: `${stage.progress}%`, backgroundColor: stage.color }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter w-8">
                          {stage.progress}%
                        </span>
                      </div>

                      <span className={getTagStyle('comm')}>
                        <Briefcase className="w-3 h-3" /> {order.commissionType}
                      </span>

                      <span className={getTagStyle('personCount')}>
                        <Users className="w-3 h-3" /> {order.personCount}
                      </span>
                      
                      <span className={getTagStyle('artType')}>
                        <Tag className="w-3 h-3" /> {order.artType}
                      </span>

                      <span className={getTagStyle('source')}>
                        <ExternalLink className="w-3 h-3" /> {order.source}
                      </span>

                      {isCompleted && order.actualDuration !== undefined && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-md">
                          <Clock className="w-3 h-3" /> {order.actualDuration}H
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 金额区 */}
                  <div className="text-right shrink-0 pr-2">
                    <div className="text-[16px] md:text-[20px] font-black text-slate-900 leading-none tracking-tighter">
                      ¥{order.totalPrice.toLocaleString()}
                    </div>
                    <div className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">VALUATION</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {orders.length === 0 && (
        <div className="py-32 text-center text-slate-300 font-black text-sm uppercase tracking-[0.3em]">
          NO PROJECTS FOUND
        </div>
      )}
    </div>
  );
};

export default OrderList;
