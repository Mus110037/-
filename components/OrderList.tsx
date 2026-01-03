
import React from 'react';
import { Order, STAGE_PROGRESS_MAP } from '../types';
import { Zap, ArrowUpDown, FileSpreadsheet, CalendarPlus, MoreHorizontal } from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  onAddNew: () => void;
  onEditOrder: (order: Order) => void;
}

type SortKey = 'deadline' | 'createdAt';

const OrderList: React.FC<OrderListProps> = ({ orders, onAddNew, onEditOrder }) => {
  const [sortKey, setSortKey] = React.useState<SortKey>('deadline');

  const sortedOrders = [...orders].sort((a, b) => {
    const valA = a[sortKey] || '';
    const valB = b[sortKey] || '';
    return valA.localeCompare(valB);
  });

  const handleExportCSV = () => {
    const headers = ['标题', '优先级', '金额', '来源', '截止日期', '分类', '进度', '备注'];
    const rows = sortedOrders.map(o => [
      o.title, o.priority, o.totalPrice, o.source, o.deadline, o.artType, o.progressStage, `"${(o.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `艺策排单表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportSingleICS = (e: React.MouseEvent, o: Order) => {
    e.stopPropagation();
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ArtNexus Pro//SingleEvent//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";
    const dateStr = o.deadline.replace(/-/g, '');
    ics += "BEGIN:VEVENT\n";
    ics += `SUMMARY:稿件: ${o.title} (${o.source})\n`;
    ics += `DTSTART;VALUE=DATE:${dateStr}\n`;
    ics += `DTEND;VALUE=DATE:${dateStr}\n`;
    ics += `DESCRIPTION:金额: ${o.totalPrice}\\n进度: ${o.progressStage}\\n备注: ${o.description}\n`;
    ics += "STATUS:CONFIRMED\n";
    ics += "END:VEVENT\n";
    ics += "END:VCALENDAR";
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `企划_${o.title}.ics`;
    link.click();
  };

  const getSourceAbbr = (source: string) => {
    if (source === '米画师') return '米';
    if (source === '画加') return '加';
    if (source === 'QQ') return 'Q';
    return source[0];
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">稿件清单</h2>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
              {sortKey === 'deadline' ? '⏳ 截稿日期优先' : '📝 最新录入优先'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
            <button 
              onClick={() => setSortKey('deadline')}
              className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition-all ${sortKey === 'deadline' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400'}`}
            >
              按 DDL
            </button>
            <button 
              onClick={() => setSortKey('createdAt')}
              className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition-all ${sortKey === 'createdAt' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400'}`}
            >
              按录入
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} className="p-2.5 text-slate-400 hover:text-emerald-600 transition-colors" title="导出 Excel 表格">
              <FileSpreadsheet className="w-5 h-5" />
            </button>
            <button onClick={onAddNew} className="bg-violet-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black shadow-lg shadow-violet-100 hover:bg-violet-700 transition-all">
              + 接稿
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-50">
        {sortedOrders.map((order) => {
          const progress = STAGE_PROGRESS_MAP[order.progressStage || '未开始'];
          const isCompleted = progress === 100;
          return (
            <div key={order.id} onClick={() => onEditOrder(order)} className="flex items-center gap-3 p-4 hover:bg-slate-50/80 transition-all cursor-pointer group">
              {/* DDL 块 */}
              <div className="flex flex-col items-center justify-center w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl shrink-0 group-hover:bg-violet-50 group-hover:border-violet-100 transition-colors">
                <span className="text-[7px] font-black text-slate-400 leading-none mb-0.5">{order.deadline.slice(5,7)}</span>
                <span className="text-sm font-black text-slate-700 leading-none">{order.deadline.slice(8,10)}</span>
              </div>

              {/* 核心信息与进度 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <h4 className={`font-bold text-[11px] truncate ${isCompleted ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{order.title}</h4>
                  {order.priority === '高' && !isCompleted && <Zap className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden shrink-0">
                    <div className={`h-full transition-all duration-700 ${isCompleted ? 'bg-emerald-400' : 'bg-violet-500'}`} style={{ width: `${progress}%` }} />
                  </div>
                  <span className={`text-[8px] font-black ${isCompleted ? 'text-emerald-500' : 'text-violet-500'}`}>{progress}%</span>
                </div>
              </div>

              {/* 金额前移 */}
              <div className="text-right shrink-0 min-w-[50px]">
                <div className="text-[11px] font-black text-slate-800 leading-none">¥{order.totalPrice}</div>
              </div>

              {/* 极致缩写标签 */}
              <div className="flex gap-1 shrink-0">
                <span className={`w-5 h-5 flex items-center justify-center text-[8px] font-black rounded-lg border ${order.commissionType === '商用' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                  {order.commissionType === '商用' ? '商' : '私'}
                </span>
                <span className="w-5 h-5 flex items-center justify-center text-[8px] font-black rounded-lg border bg-violet-50 text-violet-500 border-violet-100">
                  {getSourceAbbr(order.source)}
                </span>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-1 shrink-0 ml-1">
                <button 
                  onClick={(e) => handleExportSingleICS(e, order)}
                  className="p-1.5 text-slate-300 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                  title="同步到日历"
                >
                  <CalendarPlus className="w-4 h-4" />
                </button>
                <div className="p-1 text-slate-200 group-hover:text-slate-400 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderList;
