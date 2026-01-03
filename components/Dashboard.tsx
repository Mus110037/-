
import React, { useState } from 'react';
import { Order, OrderStatus, STAGE_PROGRESS_MAP } from '../types';
import { Wallet, Calendar as CalendarIcon, AlertCircle, Sparkles, Star, Settings2, CheckCircle2, GripVertical } from 'lucide-react';
import { isWithinInterval, addDays, parseISO, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DashboardProps {
  orders: Order[];
  priorityOrderIds: string[];
  onUpdatePriorityIds: (ids: string[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, priorityOrderIds, onUpdatePriorityIds }) => {
  const [isManagingPriority, setIsManagingPriority] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const today = new Date();
  
  const getProgress = (order: Order) => STAGE_PROGRESS_MAP[order.progressStage || '未开始'];

  const priorityOrders = priorityOrderIds
    .map(id => orders.find(o => o.id === id))
    .filter((o): o is Order => !!o);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newIds = [...priorityOrderIds];
    const draggedId = newIds[draggedIndex];
    newIds.splice(draggedIndex, 1);
    newIds.splice(index, 0, draggedId);
    setDraggedIndex(index);
    onUpdatePriorityIds(newIds);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const togglePrioritySelection = (id: string) => {
    if (priorityOrderIds.includes(id)) {
      onUpdatePriorityIds(priorityOrderIds.filter(pid => pid !== id));
    } else if (priorityOrderIds.length < 5) {
      onUpdatePriorityIds([...priorityOrderIds, id]);
    }
  };

  const calculateRealAmount = (o: Order) => (o.source === '米画师' || o.source === '画加') ? o.totalPrice * 0.95 : o.totalPrice;
  const monthlyProjected = orders.reduce((sum, o) => sum + calculateRealAmount(o), 0);
  const monthlyCompleted = orders.filter(o => getProgress(o) === 100).reduce((sum, o) => sum + calculateRealAmount(o), 0);

  const upcomingOrders = orders
    .filter(o => getProgress(o) < 100 && !priorityOrderIds.includes(o.id))
    .filter(o => isWithinInterval(parseISO(o.deadline), { start: today, end: addDays(today, 7) }))
    .sort((a, b) => parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime());

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. 近期 DDL - 移动到最上方 */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">近期重要 DDL</h3>
          </div>
        </div>

        <div className="p-2">
          {upcomingOrders.length > 0 ? (
            <div className="space-y-1 px-2">
              {upcomingOrders.map(order => {
                const ddl = parseISO(order.deadline);
                const prog = getProgress(order);
                const isUrgent = order.priority === '高' || prog < 30;
                return (
                  <div key={order.id} className="group flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
                      <span className="text-[9px] font-bold text-rose-500 uppercase leading-none mb-0.5">{format(ddl, 'eee', { locale: zhCN })}</span>
                      <span className="text-lg font-black text-slate-900 leading-none">{format(ddl, 'd')}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <h4 className="font-bold text-slate-900 truncate text-xs">{order.title}</h4>
                        {isUrgent && <AlertCircle className="w-3 h-3 text-rose-500" />}
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-400" style={{ width: `${prog}%` }} />
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-rose-500">{prog}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-300 italic text-[10px]">
              暂无 7 天内到期的普通企划
            </div>
          )}
        </div>
      </div>

      {/* 2. 统计数据 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-6 rounded-[2rem] text-white shadow-xl shadow-violet-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full">预计实收</span>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-black">¥{monthlyProjected.toLocaleString()}</p>
            <p className="text-violet-100 text-[10px] mt-1 opacity-80">已结: ¥{monthlyCompleted.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
             <div className="text-2xl font-black text-slate-900">{orders.filter(o => getProgress(o) < 100).length}</div>
             <p className="text-[10px] text-slate-400 font-bold uppercase">进行中</p>
          </div>
          <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
             <div className="text-2xl font-black text-emerald-500">{orders.filter(o => getProgress(o) === 100).length}</div>
             <p className="text-[10px] text-slate-400 font-bold uppercase">已结项</p>
          </div>
        </div>
      </div>

      {/* 3. 优先企划 */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">正在爆肝 (优先)</h3>
          </div>
          <button 
            onClick={() => setIsManagingPriority(!isManagingPriority)}
            className="text-violet-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-violet-50 px-3 py-1.5 rounded-lg transition-all"
          >
            {isManagingPriority ? '完成' : '筛选'}
          </button>
        </div>

        <div className="p-4 md:p-6">
          {isManagingPriority ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {orders.map(order => (
                <button
                  key={order.id}
                  onClick={() => togglePrioritySelection(order.id)}
                  className={`p-3 rounded-xl border transition-all text-left flex flex-col gap-1 ${
                    priorityOrderIds.includes(order.id)
                      ? 'bg-violet-50 border-violet-200 shadow-sm'
                      : 'bg-white border-slate-50 hover:border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-[11px] truncate pr-2">{order.title}</span>
                    {priorityOrderIds.includes(order.id) && <div className="w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">{priorityOrderIds.indexOf(order.id) + 1}</div>}
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold tracking-tight">¥{order.totalPrice} • {order.source}</span>
                </button>
              ))}
            </div>
          ) : priorityOrders.length > 0 ? (
            <div className="space-y-2">
              {priorityOrders.map((order, idx) => {
                const prog = getProgress(order);
                const isBeingDragged = draggedIndex === idx;
                
                return (
                  <div 
                    key={order.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-50 group cursor-grab active:cursor-grabbing transition-all ${
                      isBeingDragged ? 'opacity-40 scale-95 border-dashed border-violet-200' : 'hover:border-violet-100 hover:shadow-sm'
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[8px] font-black rounded uppercase">P{idx + 1}</span>
                        <h4 className="font-bold text-slate-900 truncate text-xs">{order.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500" style={{ width: `${prog}%` }}></div>
                        </div>
                        <span className="text-[9px] font-black text-violet-600 w-7">{prog}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-300 flex flex-col items-center gap-3">
              <Sparkles className="w-8 h-8 opacity-20" />
              <p className="text-[10px] font-bold uppercase tracking-wider">暂未选择优先企划</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
