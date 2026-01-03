
import React from 'react';
import { Order, STAGE_PROGRESS_MAP } from '../types';
import { Edit2, Zap, ArrowUpDown, CheckCircle2, MoreHorizontal, FileSpreadsheet } from 'lucide-react';

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
      o.title,
      o.priority,
      o.totalPrice,
      o.source,
      o.deadline,
      o.artType,
      o.progressStage,
      `"${(o.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `艺策排单表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
      {/* 头部区域 */}
      <div className="p-5 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-black text-slate-900">稿件清单</h2>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            <span>当前筛选: 全部企划</span>
            <span className="text-slate-200">|</span>
            <span className="text-violet-500">排序依据: {sortKey === 'deadline' ? '截稿日期 (DDL)' : '录入日期'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 排序操作区 */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setSortKey('deadline')}
              className={`flex-1 md:px-4 py-2 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${sortKey === 'deadline' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ArrowUpDown className="w-3 h-3" /> 按 DDL
            </button>
            <button 
              onClick={() => setSortKey('createdAt')}
              className={`flex-1 md:px-4 py-2 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${sortKey === 'createdAt' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ArrowUpDown className="w-3 h-3" /> 按录入
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button 
              onClick={handleExportCSV}
              className="bg-white text-emerald-600 border border-slate-200 p-2.5 rounded-xl hover:bg-emerald-50 transition-all shadow-sm"
              title="导出 Excel 表格"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button 
              onClick={onAddNew}
              className="bg-violet-600 text-white px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black shadow-lg shadow-violet-100 hover:bg-violet-700 transition-all flex items-center gap-2"
            >
              <span>+ 接稿</span>
            </button>
          </div>
        </div>
      </div>

      {/* 清单列表 */}
      <div className="divide-y divide-slate-50">
        {sortedOrders.map((order) => {
          const progress = STAGE_PROGRESS_MAP[order.progressStage || '未开始'];
          const isCompleted = progress === 100;
          
          return (
            <div 
              key={order.id} 
              onClick={() => onEditOrder(order)}
              className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              {/* DDL 日期块 */}
              <div className="flex flex-col items-center justify-center w-11 h-11 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
                <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-0.5">{order.deadline.slice(5,7)}月</span>
                <span className="text-sm font-black text-slate-900 leading-none">{order.deadline.slice(8,10)}</span>
              </div>

              {/* 信息区 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <h4 className={`font-bold text-[11px] md:text-xs truncate ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{order.title}</h4>
                  {order.priority === '高' && !isCompleted && <Zap className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />}
                </div>
                
                {/* 缩短后的进度条 */}
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden shrink-0">
                    <div 
                      className={`h-full transition-all duration-700 ${isCompleted ? 'bg-emerald-400' : 'bg-violet-400'}`} 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                  <span className={`text-[8px] font-black ${isCompleted ? 'text-emerald-500' : 'text-violet-500'}`}>{progress}%</span>
                </div>
              </div>

              {/* 价格与属性 */}
              <div className="text-right shrink-0">
                <div className="text-[11px] font-black text-slate-900 leading-none mb-1">¥{order.totalPrice}</div>
                <span className={`text-[7px] font-black px-1 py-0.5 rounded border leading-none ${order.commissionType === '商用' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                  {order.commissionType === '商用' ? '商' : '私'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderList;
