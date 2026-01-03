
import React from 'react';
import { Order, AppSettings } from '../types';
import { Zap, ArrowUpDown, FileSpreadsheet, MoreHorizontal, Users, Palette } from 'lucide-react';

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

  const getSourceAbbr = (source: string) => source.slice(0, 1);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between bg-white">
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">稿件清单</h2>
          <button 
            onClick={() => setSortKey(sortKey === 'deadline' ? 'createdAt' : 'deadline')}
            className="flex items-center gap-1.5 text-[9px] font-black text-sky-500 bg-sky-50 px-2.5 py-1.5 rounded-full border border-sky-100 hover:bg-sky-100 transition-colors"
          >
            <ArrowUpDown className="w-2.5 h-2.5" />
            排序: {sortKey === 'deadline' ? '截稿日期优先' : '最新录入优先'}
          </button>
        </div>
        
        <button onClick={() => {
          const headers = ['标题', '优先级', '分类', '人数', '金额', '来源', '截止日期', '进度'];
          const rows = sortedOrders.map(o => [o.title, o.priority, o.artType, o.personCount, o.totalPrice, o.source, o.deadline, o.progressStage]);
          const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `艺策清单_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
        }} className="p-3 text-slate-300 hover:text-emerald-500 transition-colors" title="导出 Excel">
          <FileSpreadsheet className="w-5 h-5" />
        </button>
      </div>

      <div className="divide-y divide-slate-50">
        {sortedOrders.map((order) => {
          const stage = getStageConfig(order.progressStage);
          const isCompleted = stage.progress === 100;
          return (
            <div key={order.id} onClick={() => onEditOrder(order)} className="flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-all cursor-pointer group">
              {/* 日期卡片 */}
              <div className="flex flex-col items-center justify-center w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl shrink-0 group-hover:bg-sky-50 transition-colors">
                <span className="text-[7px] font-black text-slate-400 leading-none mb-0.5">{order.deadline.slice(5,7)}</span>
                <span className="text-sm font-black text-slate-700 leading-none">{order.deadline.slice(8,10)}</span>
              </div>

              {/* 信息主体 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className={`font-bold text-[11px] truncate ${isCompleted ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{order.title}</h4>
                  <div className="flex gap-1">
                    {order.priority === '高' && <Zap className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />}
                    <span className="text-[7px] font-black bg-slate-100 text-slate-400 px-1.5 rounded-md flex items-center gap-1">
                       {order.artType} · {order.personCount}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden shrink-0">
                    <div className="h-full transition-all duration-700" style={{ width: `${stage.progress}%`, backgroundColor: stage.color }} />
                  </div>
                  <span className="text-[8px] font-black" style={{ color: stage.color }}>{stage.progress}%</span>
                </div>
              </div>

              {/* 金额 */}
              <div className="text-right shrink-0 min-w-[50px]">
                <div className="text-[11px] font-black text-slate-800 leading-none">¥{order.totalPrice}</div>
              </div>

              {/* 标签 */}
              <div className="flex gap-1 shrink-0">
                <span className={`w-5 h-5 flex items-center justify-center text-[8px] font-black rounded-lg border ${order.commissionType === '商用' ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                  {order.commissionType === '商用' ? '商' : '私'}
                </span>
                <span className="w-5 h-5 flex items-center justify-center text-[8px] font-black rounded-lg border bg-sky-50 text-sky-500 border-sky-100">
                  {getSourceAbbr(order.source)}
                </span>
              </div>

              <div className="p-1 text-slate-200 group-hover:text-slate-400 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderList;
