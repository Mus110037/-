
import React from 'react';
import { Order, AppSettings } from '../types';
import { Zap, ArrowUpDown, Smartphone, Download, CalendarCheck, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

interface OrderListProps {
  orders: Order[];
  onEditOrder: (order: Order) => void;
  settings: AppSettings;
}

type SortKey = 'deadline' | 'createdAt';

const OrderList: React.FC<OrderListProps> = ({ orders, onEditOrder, settings }) => {
  const [sortKey, setSortKey] = React.useState<SortKey>('deadline');

  const sortedOrders = [...orders].sort((a, b) => {
    const valA = a[sortKey] || '';
    const valB = b[sortKey] || '';
    return valA.localeCompare(valB);
  });

  const getStageConfig = (stageName: string) => {
    return settings.stages.find(s => s.name === stageName) || settings.stages[0];
  };

  const handleExportSingleICS = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    const dateStr = order.deadline.replace(/-/g, '');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:DDL: ${order.title}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${dateStr}`,
      `DESCRIPTION:金额: ¥${order.totalPrice}\\n类型: ${order.artType}\\n备注: ${order.description}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `艺策_${order.title}.ics`;
    link.click();
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500 mb-10">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-slate-900 tracking-tight uppercase">全量企划库</h2>
          <button 
            onClick={() => setSortKey(sortKey === 'deadline' ? 'createdAt' : 'deadline')}
            className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:text-slate-900 transition-all"
          >
            <ArrowUpDown className="w-3 h-3" />
            排序: {sortKey === 'deadline' ? '交付日期' : '录入日期'}
          </button>
        </div>
        
        <button onClick={() => {
          const headers = ['标题', '优先级', '金额', '来源', '截止日期'];
          const rows = sortedOrders.map(o => [o.title, o.priority, o.totalPrice, o.source, o.deadline]);
          const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `艺策导出_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
        }} className="p-3 text-slate-400 hover:text-slate-900 transition-all">
          <Download className="w-4 h-4" />
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {sortedOrders.map((order) => {
          const stage = getStageConfig(order.progressStage);
          const isCompleted = stage.progress === 100;
          return (
            <div key={order.id} onClick={() => onEditOrder(order)} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-all cursor-pointer group">
              <div className="flex flex-col items-center justify-center w-10 h-10 bg-slate-900 rounded-xl shrink-0">
                <span className="text-[10px] font-black text-white leading-none">{order.deadline.slice(8,10)}</span>
                <span className="text-[7px] font-bold text-slate-400 leading-none mt-1 uppercase">{order.deadline.slice(5,7)}月</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className={`font-bold text-[13px] tracking-tight truncate ${isCompleted ? 'text-slate-300 line-through' : 'text-slate-900'}`}>{order.title}</h4>
                  {order.priority === '高' && <Zap className="w-3 h-3 text-red-600 fill-red-600" />}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                    <div className="h-full transition-all duration-700" style={{ width: `${stage.progress}%`, backgroundColor: stage.color }} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stage.progress}% · {order.artType}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[13px] font-black text-slate-900 leading-none">¥{order.totalPrice}</div>
                <div className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{order.source}</div>
              </div>

              {/* 移动端始终可见，电脑端悬浮可见 */}
              <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                <button 
                  onClick={(e) => handleExportSingleICS(e, order)}
                  className="p-3 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm active:bg-slate-100"
                  title="同步提醒"
                >
                  <CalendarCheck className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderList;
