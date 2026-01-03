
import React from 'react';
import { Order, OrderStatus, STAGE_PROGRESS_MAP } from '../types';
import { MoreHorizontal, Edit2, Zap, ArrowUpDown, Calendar as CalendarIcon, CheckCircle2, Share2, DownloadCloud } from 'lucide-react';

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

  const getArtTypeColor = (type: string) => {
    switch (type) {
      case '头像': return 'bg-slate-100 text-slate-600';
      case '胸像': return 'bg-green-50 text-green-700';
      case '半身': return 'bg-rose-50 text-rose-600';
      case '全身': return 'bg-blue-50 text-blue-600';
      case '组合页': return 'bg-amber-50 text-amber-700';
      default: return 'bg-slate-50';
    }
  };

  // 1. 生成 Google 日历链接 (云端方案)
  const handleAddToGoogleCalendar = (order: Order) => {
    const ddl = order.deadline.replace(/-/g, '');
    const isCompleted = order.progressStage === '成稿';
    const statusEmoji = isCompleted ? '✅' : '⏳';
    
    const title = encodeURIComponent(`${statusEmoji} 排单: ${order.title} [${order.source}]`);
    const details = encodeURIComponent(
      `进度: ${order.progressStage}\n` +
      `金额: ¥${order.totalPrice}\n` +
      `备注: ${order.description}\n\n` +
      `来自 艺策ArtNexus`
    );
    
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${ddl}/${ddl}&details=${details}&location=${encodeURIComponent(order.source)}`;
    window.open(url, '_blank');
  };

  // 2. 生成 .ics 文件 (原生/苹果日历方案)
  const handleDownloadICS = (order: Order) => {
    const ddl = order.deadline.replace(/-/g, '');
    const isCompleted = order.progressStage === '成稿';
    const statusEmoji = isCompleted ? '✅' : '⏳';
    
    const title = `${statusEmoji} 排单: ${order.title}`;
    const description = `进度: ${order.progressStage} | 金额: ¥${order.totalPrice} | 备注: ${order.description}`;
    
    // 构建 iCalendar 格式字符串
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PROID:-//ArtNexus//Pro//CN',
      'BEGIN:VEVENT',
      `UID:${order.id}@artnexus.pro`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;VALUE=DATE:${ddl}`,
      `DTEND;VALUE=DATE:${ddl}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${order.source}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT9H', // 提前 9 小时提醒（当天早上）
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${order.title}_日程.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">稿件清单</h2>
          <p className="text-sm text-slate-500">管理您的所有委托企划与分段进度</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setSortKey('deadline')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${sortKey === 'deadline' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ArrowUpDown className="w-3 h-3" /> 按截稿日
            </button>
            <button 
              onClick={() => setSortKey('createdAt')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${sortKey === 'createdAt' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ArrowUpDown className="w-3 h-3" /> 按录入时间
            </button>
          </div>
          
          <button 
            onClick={onAddNew}
            className="bg-violet-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-violet-100 hover:bg-violet-700 hover:-translate-y-0.5 transition-all"
          >
            + 录入新企划
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left table-fixed min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
              <th className="px-8 py-4 w-1/4">企划信息</th>
              <th className="px-8 py-4 w-40">分类/用途</th>
              <th className="px-8 py-4 w-52">核心进度条</th>
              <th className="px-8 py-4 w-32">来源</th>
              <th className="px-8 py-4 w-32">金额</th>
              <th className="px-8 py-4 w-44 text-right">同步与操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedOrders.map((order) => {
              const progress = STAGE_PROGRESS_MAP[order.progressStage || '未开始'];
              const isCompleted = progress === 100;
              
              return (
                <tr key={order.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold truncate ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{order.title}</span>
                        {order.priority === '高' && !isCompleted && <Zap className="w-3 h-3 text-rose-500 fill-rose-500" />}
                        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter">截止: {order.deadline}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${order.commissionType === '商用' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {order.commissionType || '私用'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getArtTypeColor(order.artType)}`}>
                        {order.artType}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-500">
                        <span>{order.progressStage}</span>
                        <span className={isCompleted ? 'text-emerald-500' : 'text-violet-500'}>{progress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 ${isCompleted ? 'bg-emerald-500' : 'bg-violet-500'}`} 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getSourceTag(order.source)}`}>
                      {order.source}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${isCompleted ? 'text-slate-400' : 'text-slate-900'}`}>¥{order.totalPrice}</span>
                      {(order.source === '米画师' || order.source === '画加') && (
                        <span className="text-[9px] text-slate-400">实收 ¥{(order.totalPrice * 0.95).toFixed(0)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                        <button 
                            onClick={() => handleDownloadICS(order)}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            title="导出为本地日历事项 (.ics) - 苹果日历推荐"
                        >
                            <CalendarIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleAddToGoogleCalendar(order)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            title="添加至 Google 日历 (网页同步)"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => onEditOrder(order)}
                            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-300">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;
