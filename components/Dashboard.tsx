
import React, { useState } from 'react';
import { Order, OrderStatus, STAGE_PROGRESS_MAP } from '../types';
import { Wallet, Calendar as CalendarIcon, ChevronRight, AlertCircle, Sparkles, Star, ArrowUp, ArrowDown, Settings2, CheckCircle2, GripVertical } from 'lucide-react';
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

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires some data to be set
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newIds = [...priorityOrderIds];
    const draggedId = newIds[draggedIndex];
    
    // Perform the swap
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

  // Financial Summary
  const calculateRealAmount = (o: Order) => (o.source === '米画师' || o.source === '画加') ? o.totalPrice * 0.95 : o.totalPrice;
  const monthlyProjected = orders.reduce((sum, o) => sum + calculateRealAmount(o), 0);
  const monthlyCompleted = orders.filter(o => getProgress(o) === 100).reduce((sum, o) => sum + calculateRealAmount(o), 0);

  const upcomingOrders = orders
    .filter(o => getProgress(o) < 100 && !priorityOrderIds.includes(o.id))
    .filter(o => isWithinInterval(parseISO(o.deadline), { start: today, end: addDays(today, 7) }))
    .sort((a, b) => parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime());

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-8 rounded-[2rem] text-white shadow-xl shadow-violet-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">预计实收 (已去费)</span>
          </div>
          <div className="space-y-1 relative z-10">
            <p className="text-4xl font-black">¥{monthlyProjected.toLocaleString()}</p>
            <p className="text-violet-100 text-sm">已结项金额: ¥{monthlyCompleted.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
             <div className="text-3xl font-bold text-slate-900">{orders.filter(o => getProgress(o) < 100).length}</div>
             <p className="text-sm text-slate-500 font-medium">进行中企划</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
             <div className="text-3xl font-bold text-emerald-600">{orders.filter(o => getProgress(o) === 100).length}</div>
             <p className="text-sm text-slate-500 font-medium">本月已结项</p>
          </div>
        </div>
      </div>

      {/* Custom Priority Orders Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">自选优先企划 (拖拽排序)</h3>
          </div>
          <button 
            onClick={() => setIsManagingPriority(!isManagingPriority)}
            className="text-violet-600 text-sm font-bold flex items-center gap-2 hover:bg-violet-50 px-4 py-2 rounded-xl transition-all"
          >
            {isManagingPriority ? <CheckCircle2 className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
            {isManagingPriority ? '完成选择' : '选择优先项'}
          </button>
        </div>

        <div className="p-6">
          {isManagingPriority ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map(order => (
                <button
                  key={order.id}
                  onClick={() => togglePrioritySelection(order.id)}
                  className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-2 ${
                    priorityOrderIds.includes(order.id)
                      ? 'bg-violet-50 border-violet-200 shadow-sm'
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-sm truncate pr-2">{order.title}</span>
                    {priorityOrderIds.includes(order.id) && <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center text-white text-[10px]">{priorityOrderIds.indexOf(order.id) + 1}</div>}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">¥{order.totalPrice} • {order.source}</span>
                </button>
              ))}
            </div>
          ) : priorityOrders.length > 0 ? (
            <div className="space-y-3">
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
                    className={`flex items-center gap-4 bg-white p-4 rounded-[1.5rem] border border-slate-100 group cursor-grab active:cursor-grabbing transition-all ${
                      isBeingDragged ? 'opacity-40 scale-95 border-dashed border-violet-300' : 'hover:border-violet-100 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center text-slate-300 group-hover:text-violet-400 transition-colors">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded shadow-sm">P{idx + 1}</span>
                        <h4 className="font-bold text-slate-900 truncate">{order.title}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 transition-all duration-700" style={{ width: `${prog}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-violet-600 w-8">{prog}%</span>
                      </div>
                    </div>

                    <div className="hidden sm:flex flex-col items-end min-w-[100px]">
                      <span className="text-sm font-black text-slate-900">¥{order.totalPrice}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{order.source}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-4">
              <Sparkles className="w-12 h-12 opacity-20" />
              <p className="text-sm">暂未选择优先企划。点击右上角“选择优先项”开始排序。</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-rose-500" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">近期 DDL (7天内)</h3>
          </div>
        </div>

        <div className="p-2">
          {upcomingOrders.length > 0 ? (
            <div className="space-y-2 px-2">
              {upcomingOrders.map(order => {
                const ddl = parseISO(order.deadline);
                const prog = getProgress(order);
                const isUrgent = order.priority === '高' || prog < 30;
                return (
                  <div key={order.id} className="group flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all">
                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <span className="text-[10px] font-bold text-rose-500 uppercase">{format(ddl, 'eee', { locale: zhCN })}</span>
                      <span className="text-xl font-black text-slate-900">{format(ddl, 'd')}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 truncate text-sm">{order.title}</h4>
                        {isUrgent && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400">{order.progressStage}</span>
                        <span className="text-[10px] font-bold text-violet-500">{prog}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-400" style={{ width: `${prog}%` }} />
                      </div>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <p className="font-bold text-slate-900 text-sm">¥{order.totalPrice}</p>
                      <span className="text-[10px] font-bold text-slate-400">{order.source}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-300 italic text-xs">
              无近期非优先企划截稿
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
