
import React from 'react';
import { Order, STAGE_PROGRESS_MAP } from '../types';
import { Edit2, Zap, ArrowUpDown, CheckCircle2, MoreHorizontal } from 'lucide-react';

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

  const getSourceTag = (source: string) => {
    switch (source) {
      case '米画师': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'QQ': return 'bg-blue-50 text-blue-600 border-blue-100';
      case '画加': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
      {/* 头部与排序按钮 */}
      <div className="p-5 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">稿件清单</h2>
          <p className="text-xs text-slate-400 font-medium">点击项目可查看/编辑详情</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl flex-1 md:flex-none">
            <button 
              onClick={() => setSortKey('deadline')}
              className={`flex-1 md:px-4 py-2 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${sortKey === 'deadline' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400'}`}
            >
              <ArrowUpDown className="w-3 h-3" /> <span className="hidden xs:inline">按 DDL</span>
            </button>
            <button 
              onClick={() => setSortKey('createdAt')}
              className={`flex-1 md:px-4 py-2 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${sortKey === 'createdAt' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400'}`}
            >
              <ArrowUpDown className="w-3 h-3" /> <span className="hidden xs:inline">按录入</span>
            </button>
          </div>
          
          <button 
            onClick={onAddNew}
            className="bg-violet-600 text-white p-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-black shadow-lg shadow-violet-100 hover:bg-violet-700 transition-all"
          >
            <span className="hidden md:inline">+ 录入新企划</span>
            <span className="md:hidden">+ 接稿</span>
          </button>
        </div>
      </div>

      {/* 移动端适配列表 (取消表格) */}
      <div className="divide-y divide-slate-50">
        {sortedOrders.map((order) => {
          const progress = STAGE_PROGRESS_MAP[order.progressStage || '未开始'];
          const isCompleted = progress === 100;
          
          return (
            <div 
              key={order.id} 
              onClick={() => onEditOrder(order)}
              className="flex items-center gap-3 p-4 hover:bg-slate-50/50 active:bg-slate-100/50 transition-colors cursor-pointer group"
            >
              {/* 左侧状态/DDL */}
              <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
                <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">{order.deadline.slice(5,7)}月</span>
                <span className="text-base font-black text-slate-900 leading-none">{order.deadline.slice(8,10)}</span>
              </div>

              {/* 中间信息 - 极简排布 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <h4 className={`font-bold text-xs truncate ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{order.title}</h4>
                  {order.priority === '高' && !isCompleted && <Zap className="w-3 h-3 text-rose-500 fill-rose-500" />}
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${isCompleted ? 'bg-emerald-400' : 'bg-violet-400'}`} 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                  <span className={`text-[9px] font-black ${isCompleted ? 'text-emerald-500' : 'text-violet-500'}`}>{progress}%</span>
                </div>
              </div>

              {/* 右侧关键属性 (商用/价格) - 紧凑显示 */}
              <div className="text-right shrink-0">
                <div className="text-xs font-black text-slate-900 leading-none mb-1">¥{order.totalPrice}</div>
                <div className="flex justify-end">
                   <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border leading-none ${order.commissionType === '商用' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    {order.commissionType === '商用' ? '商' : '私'}
                  </span>
                </div>
              </div>
              
              <div className="hidden md:block">
                 <button className="p-2 text-slate-200 hover:text-violet-600 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderList;
