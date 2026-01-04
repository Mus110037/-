
import React, { useState, useRef } from 'react';
import { Order, AppSettings, CommissionType } from '../types';
import { Plus, Cookie, Target, Sprout, Leaf, X, Check, Wallet, CheckCircle2, Clock, Calendar, Briefcase, User, Sparkles, Loader2, GripVertical } from 'lucide-react'; 
import { format, addDays, parseISO } from 'date-fns'; // Added parseISO
import { zhCN } from 'date-fns/locale/zh-CN';

interface DashboardProps {
  orders: Order[];
  priorityOrderIds: string[];
  onUpdatePriorityIds: (ids: string[]) => void;
  onEditOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  settings: AppSettings;
  onQuickAdd: () => void;
  schedulingInsights: string; // Add prop for insights
  isSchedulingAiLoading: boolean; // Add prop for AI loading state
}

const Dashboard: React.FC<DashboardProps> = ({ orders, priorityOrderIds, onUpdatePriorityIds, onEditOrder, onUpdateOrder, settings, onQuickAdd, schedulingInsights, isSchedulingAiLoading }) => {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Drag and Drop Ref for Priority Orders: stores the ID of the dragged item
  const draggedPriorityOrderItemId = useRef<string | null>(null);
  // Track if a touch drag is active to prevent mixed behaviors
  const isTouchDragging = useRef(false);

  const getStageConfig = (order: Order) => {
    return settings.stages.find(s => s.name === order.progressStage) || settings.stages[0];
  };

  const calculateActual = (o: Order) => {
    const source = settings.sources.find(s => s.name === o.source) || { name: o.source, fee: 0 };
    return o.totalPrice * (1 - source.fee / 100);
  };

  const now = new Date();
  const currentMonthStr = format(now, 'yyyy-MM');
  const fourteenDaysFromNow = addDays(now, 14); // Calculate 14 days from now

  // Helper to parse date string safely
  const parseDateSafe = (dateString: string) => {
    try {
      // Assuming deadline is YYYY-MM-DD
      return parseISO(dateString); 
    } catch {
      return null;
    }
  };

  // 年度预收总额 (按年份过滤)
  const annualProjectedRevenue = orders
    .filter(o => {
      const orderDate = parseDateSafe(o.deadline);
      return orderDate && orderDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, o) => sum + calculateActual(o), 0);

  // 当月订单
  const currentMonthOrders = orders.filter(o => {
    const orderDate = parseDateSafe(o.deadline);
    return orderDate && format(orderDate, 'yyyy-MM') === currentMonthStr;
  });

  // 当月在制企划数量
  const currentMonthActiveOrdersCount = currentMonthOrders.filter(o => getStageConfig(o).progress < 100).length;
  // 当月完成企划数量
  const currentMonthCompletedOrdersCount = currentMonthOrders.filter(o => getStageConfig(o).progress === 100).length;
  
  // 所有在制企划（用于优先级选择器）
  const activeOrders = orders.filter(o => getStageConfig(o).progress < 100);
  
  // This will be the actual list being rendered and reordered by D&D
  const priorityOrders = orders.filter(o => priorityOrderIds.includes(o.id))
    .sort((a, b) => {
      return priorityOrderIds.indexOf(a.id) - priorityOrderIds.indexOf(b.id);
    });

  const selectableOrders = activeOrders.filter(o => !priorityOrderIds.includes(o.id));

  // 最近到期的 5 个企划 (仅限进行中，且截止日期在未来14天内)
  const upcomingOrders = activeOrders
    .filter(o => {
      const deadlineDate = parseDateSafe(o.deadline);
      return deadlineDate && deadlineDate >= now && deadlineDate <= fourteenDaysFromNow; // Filter for next 14 days
    })
    .sort((a, b) => (parseDateSafe(a.deadline)?.getTime() || 0) - (parseDateSafe(b.deadline)?.getTime() || 0))
    .slice(0, 5);

  const togglePriority = (id: string) => {
    if (priorityOrderIds.includes(id)) {
      onUpdatePriorityIds(priorityOrderIds.filter(pid => pid !== id));
    } else {
      onUpdatePriorityIds([...priorityOrderIds, id]);
    }
  };

  // --- Drag & Drop Handlers for Priority Orders (Mouse) ---
  const handlePriorityDragStart = (e: React.DragEvent, id: string) => {
    if (isTouchDragging.current) return; // Prevent mouse drag if touch drag is active
    draggedPriorityOrderItemId.current = id;
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add('drag-active'); // Use global drag-active
  };

  const handlePriorityDragEnter = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedPriorityOrderItemId.current !== null && draggedPriorityOrderItemId.current !== id) {
      e.currentTarget.classList.add('drag-over-target');
    }
  };

  const handlePriorityDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over-target');
  };

  const handlePriorityDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-active');
    document.querySelectorAll('.drag-over-target').forEach(el => el.classList.remove('drag-over-target')); // Clear all targets
    draggedPriorityOrderItemId.current = null;
  };

  const handlePriorityDrop = (e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    if (draggedPriorityOrderItemId.current === null || draggedPriorityOrderItemId.current === dropId) {
      e.currentTarget.classList.remove('drag-over-target');
      return;
    }

    const currentPriorityOrders = [...priorityOrders];
    const draggedId = draggedPriorityOrderItemId.current;

    const draggedOrderIndex = currentPriorityOrders.findIndex(order => order.id === draggedId);
    const dropOrderIndex = currentPriorityOrders.findIndex(order => order.id === dropId);

    if (draggedOrderIndex === -1 || dropOrderIndex === -1) {
        e.currentTarget.classList.remove('drag-over-target');
        return;
    }

    const [draggedOrder] = currentPriorityOrders.splice(draggedOrderIndex, 1);
    currentPriorityOrders.splice(dropOrderIndex, 0, draggedOrder);

    onUpdatePriorityIds(currentPriorityOrders.map(o => o.id));
    e.currentTarget.classList.remove('drag-over-target');
  };

  // --- Touch Drag & Drop Handlers for Priority Orders ---
  const handlePriorityTouchStart = (e: React.TouchEvent, id: string) => {
    isTouchDragging.current = true;
    draggedPriorityOrderItemId.current = id;
    e.currentTarget.classList.add('drag-active'); // Apply visual feedback
    e.preventDefault(); // Prevent scrolling and other default touch behaviors
  };

  const handlePriorityTouchEnd = (e: React.TouchEvent) => {
    e.currentTarget.classList.remove('drag-active'); // Remove visual feedback from dragged item
    document.querySelectorAll('.drag-over-target').forEach(el => el.classList.remove('drag-over-target')); // Clear any potential target highlights

    if (!draggedPriorityOrderItemId.current) {
      isTouchDragging.current = false;
      return;
    }

    const touchedElement = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    let dropTargetElement: HTMLElement | null = null;

    // Traverse up to find a droppable parent (the order item div)
    let currentElement: HTMLElement | null = touchedElement as HTMLElement;
    while (currentElement && currentElement !== e.currentTarget) { // Don't allow dropping on itself
        if (currentElement.dataset.orderId) { // Check for a custom data attribute
            dropTargetElement = currentElement;
            break;
        }
        currentElement = currentElement.parentElement;
    }

    if (dropTargetElement && dropTargetElement.dataset.orderId) {
      const dropId = dropTargetElement.dataset.orderId;
      if (draggedPriorityOrderItemId.current !== dropId) { // Ensure it's not dropped on itself
        const currentPriorityOrders = [...priorityOrders];
        const draggedId = draggedPriorityOrderItemId.current;

        const draggedOrderIndex = currentPriorityOrders.findIndex(order => order.id === draggedId);
        const dropOrderIndex = currentPriorityOrders.findIndex(order => order.id === dropId);

        if (draggedOrderIndex !== -1 && dropOrderIndex !== -1) {
          const [draggedOrder] = currentPriorityOrders.splice(draggedOrderIndex, 1);
          currentPriorityOrders.splice(dropOrderIndex, 0, draggedOrder);
          onUpdatePriorityIds(currentPriorityOrders.map(o => o.id));
        }
      }
    }

    draggedPriorityOrderItemId.current = null;
    isTouchDragging.current = false;
    e.preventDefault(); // Keep preventing default to finish the gesture cleanly
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-1000 pb-32">
      {/* AI 见解 / 加载动画 */}
      {settings.showAiUI && isSchedulingAiLoading && (
        <div className="mb-6 p-4 bg-[#FDFBF7] border border-[#D6D2C4] rounded-xl text-[#2D3A30] flex items-center justify-center gap-3 card-baked-shadow animate-in fade-in slide-in-from-left-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#4B5E4F]" />
          <p className="text-[11px] font-bold leading-relaxed tracking-wide text-[#4B5E4F]">AI 正在生成见解...</p>
        </div>
      )}
      {settings.showAiUI && schedulingInsights && !isSchedulingAiLoading && (
        <div className="mb-6 p-4 bg-[#FDFBF7] border border-[#D6D2C4] rounded-xl text-[#2D3A30] flex items-start gap-4 card-baked-shadow animate-in fade-in slide-in-from-left-2">
          <Sparkles className="w-4 h-4 mt-1 flex-shrink-0 text-[#4B5E4F]" />
          <p className="text-[11px] font-bold leading-relaxed tracking-wide">{schedulingInsights}</p>
        </div>
      )}

      {/* 核心数据卡片 */}
      {/* 调整为桌面端 4 列布局，年度预收占 2 列, 月度概览各占 1 列 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-1 md:px-4">
        {/* 年度预收卡片 */}
        <div className="bg-[#4B5E4F] p-6 rounded-[1.75rem] text-[#FDFBF7] shadow-xl col-span-2 md:col-span-2 flex flex-col justify-between relative overflow-hidden group"
             style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.08) 0%, transparent 50%)' }} // Subtle baked spot
        >
          {/* Enhanced Cookie Icon */}
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-45 transition-transform duration-1000 scale-125">
             <Cookie className="w-36 h-36" />
          </div>
          <div className="relative z-10">
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#D4A373] mb-4">{now.getFullYear()} 年度预收 ANNUAL REVENUE</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-black opacity-40">¥</span>
              <span className="text-3xl md:text-5xl font-black tracking-tight leading-none text-shadow-sm">{annualProjectedRevenue.toLocaleString()}</span> {/* Added text-shadow */}
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 relative z-10">
            <div className="px-2.5 py-1 bg-[#FDFBF7]/10 rounded-full border border-[#FDFBF7]/10 flex items-center gap-1.5">
               <Leaf className="w-2.5 h-2.5 text-[#D4A373]" />
               <span className="text-[9px] font-bold text-[#FDFBF7]/70 uppercase tracking-widest">烘焙引擎运作中</span>
            </div>
          </div>
        </div>

        {/* 当月在制企划卡片 */}
        <div className="bg-[#FDFBF7] p-3 md:p-5 rounded-2xl border border-[#D1D6D1] card-baked-shadow flex items-center gap-3 md:gap-4 col-span-1 relative overflow-hidden">
          {/* Subtle background cookie icon */}
          <Cookie className="absolute -bottom-2 -right-2 w-10 h-10 text-[#D6D2C4]/10 rotate-12" /> 
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[#FDFBF7] rounded-xl flex items-center justify-center text-[#4B5E4F] shrink-0 border border-[#D1D9D3]"><Sprout className="w-4 h-4" /></div> {/* Changed icon to Sprout */}
          <div className="min-w-0">
            <p className="text-[7px] md:text-[9px] font-black text-[#4B5E4F]/60 uppercase tracking-widest">当月在制</p>
            <p className="text-sm md:text-2xl font-black text-[#2D3A30] truncate tracking-tighter">{currentMonthActiveOrdersCount}</p>
          </div>
        </div>

        {/* 当月完成企划卡片 (新增) */}
        <div className="bg-[#FDFBF7] p-3 md:p-5 rounded-2xl border border-[#D1D6D1] card-baked-shadow flex items-center gap-3 md:gap-4 col-span-1 relative overflow-hidden">
          {/* Subtle background cookie icon */}
          <Cookie className="absolute -bottom-2 -right-2 w-10 h-10 text-[#D6D2C4]/10 rotate-12" />
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[#4B5E4F] rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"><CheckCircle2 className="w-4 h-4" /></div>
          <div className="min-w-0">
            <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">当月完成</p>
            <p className="text-sm md:text-2xl font-black text-[#2D3A30] truncate tracking-tighter">{currentMonthCompletedOrdersCount}</p>
          </div>
        </div>
      </div>

      {/* 紧急烘焙 & 最近到期 区域 - 桌面端两列，移动端单列堆叠 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1 md:px-4">
        {/* 紧急烘焙区域 - 现在是左侧一列 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-lg bg-[#4B5E4F]/5 flex items-center justify-center">
                 <Target className="w-3 h-3 text-[#4B5E4F]" />
               </div>
               <h3 className="font-black text-[#2C332D] text-[10px] uppercase tracking-[0.2em] text-[#4B5E4F]">紧急烘焙 | Top Focus</h3>
            </div>
            <div className="flex items-center gap-2">
               <button 
                 onClick={() => setIsSelectorOpen(!isSelectorOpen)} 
                 className={`p-2.5 rounded-xl transition-all shadow-md ${isSelectorOpen ? 'bg-[#4B5E4F] text-white' : 'bg-[#FDFBF7] text-[#4B5E4F] border border-[#E2E8E4]'}`}
                 aria-label="切换项目选择器"
               >
                 <Plus className={`w-4 h-4 transition-transform ${isSelectorOpen ? 'rotate-45' : ''}`} />
               </button>
            </div>
          </div>
          
          {/* 项目选择器 */}
          {isSelectorOpen && (
            <div className="px-1 animate-in slide-in-from-top-2 duration-300">
              <div className="bg-[#FDFBF7] p-4 rounded-[1.5rem] border border-[#D6D2C4] card-baked-shadow space-y-3">
                <p className="text-[8px] font-bold text-[#A8A291] uppercase tracking-widest px-1">从在制企划中选择...</p>
                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5">
                  {selectableOrders.length > 0 ? selectableOrders.map(o => {
                    const stage = getStageConfig(o);
                    return (
                      <button 
                        key={o.id} 
                        onClick={() => togglePriority(o.id)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#F4F1EA]/50 hover:bg-[#F4F1EA] transition-all text-left group"
                        aria-label={`添加 ${o.title} 到紧急烘焙`}
                      >
                        <div className="min-w-0 pr-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                          <div className="min-w-0">
                            <p className="text-[12px] md:text-base font-bold text-[#2C332D] truncate">{o.title}</p>
                            <p className="text-[8px] md:text-xs font-bold text-[#A8A291] uppercase">{o.progressStage}</p>
                          </div>
                        </div>
                        <Check className="w-3.5 h-3.5 text-[#4B5E4F] opacity-0 group-hover:opacity-100" />
                      </button>
                    );
                  }) : (
                    <div className="p-4 text-center bg-[#FDFBF7] rounded-[1.5rem] border border-[#D6D2C4] card-baked-subtle-shadow">
                      <Cookie className="w-6 h-6 text-[#D6D2C4] mx-auto mb-2 opacity-30" />
                      <p className="text-[9px] font-black text-[#A8A291] uppercase tracking-[0.2em]">没有更多可添加的企划</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 紧急焦点列表 */}
          <div className="grid grid-cols-1 gap-2.5 px-1">
            {priorityOrders.length > 0 ? (
              priorityOrders.map((o) => {
                const stage = getStageConfig(o);
                return (
                  <div 
                    key={o.id} 
                    data-order-id={o.id} /* Add data-order-id for touch drop target identification */
                    className={`group relative`}
                    draggable="true"
                    onDragStart={(e) => handlePriorityDragStart(e, o.id)}
                    onDragEnter={(e) => handlePriorityDragEnter(e, o.id)}
                    onDragLeave={handlePriorityDragLeave}
                    onDragEnd={handlePriorityDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handlePriorityDrop(e, o.id)}
                    onTouchStart={(e) => handlePriorityTouchStart(e, o.id)}
                    onTouchEnd={handlePriorityTouchEnd}
                    // onTouchMove for visual feedback is complex, omitted for minimal changes
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); togglePriority(o.id); }}
                      className="absolute top-2 right-2 z-10 w-6 h-6 bg-[#FDFBF7]/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-[#E2E8E4] text-[#A8A291] hover:text-rose-500 hover:border-rose-100 transition-all opacity-0 group-hover:opacity-100"
                      aria-label="从紧急列表中移除"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    <div onClick={() => onEditOrder(o)} className="bg-[#FDFBF7] p-3.5 rounded-[1.25rem] border border-[#E2E8E4]/60 card-baked-subtle-shadow hover:border-[#4B5E4F] transition-all cursor-pointer relative overflow-hidden active:scale-[0.98] flex items-center gap-3">
                      {/* 拖拽手柄，在移动端始终可见，桌面端悬浮可见 */}
                      <GripVertical className="w-5 h-5 text-slate-400 cursor-grab shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" aria-label="拖拽调整顺序" />
                      {/* Original content of the card */}
                      <div className="flex items-center gap-3 md:gap-4 flex-1">
                        {/* 左侧：日期 */}
                        <div className="flex flex-col items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl transition-all shadow-sm bg-[#F4F1EA] text-[#2C332D] shrink-0">
                          <span className="text-[14px] md:text-lg font-black leading-none">{format(parseDateSafe(o.deadline)!, 'dd')}</span>
                          <span className="text-[7px] md:text-[8px] font-bold uppercase mt-0.5 opacity-60">{format(parseDateSafe(o.deadline)!, 'MMM', { locale: zhCN })}</span>
                        </div>

                        {/* 中间：标题与进度 */}
                        <div className="flex-1 min-w-0 pr-1">
                          <h4 className="font-black text-[14px] md:text-lg tracking-tight truncate mb-2 text-[#2C332D]">{o.title}</h4>
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 md:w-28 h-1 bg-[#E8E6DF] rounded-full overflow-hidden shadow-inner">
                              <div 
                                className="h-full transition-all duration-1000" 
                                style={{ width: `${stage.progress}%`, backgroundColor: stage.color }} 
                              />
                            </div>
                            <span className="text-[8.5px] md:text-[10px] font-black uppercase tracking-[0.1em] text-[#4B5E4F]/70">
                              {o.progressStage} · {stage.progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-10 text-center bg-[#FDFBF7] border-2 border-dashed border-[#E2E8E4] rounded-[1.75rem] card-baked-shadow">
                 <Cookie className="w-8 h-8 text-[#D6D2C4] mx-auto mb-2 opacity-30" />
                 <p className="text-[9px] font-black text-[#A8A291] uppercase tracking-[0.2em]">点击 + 号，挑选今日重点烘焙项目</p>
              </div>
            )}
          </div>
        </div>

        {/* 新增：最近到期区域 - 现在是右侧一列 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-lg bg-[#F4F1EA] flex items-center justify-center">
                 <Clock className="w-3 h-3 text-[#D4A373]" />
               </div>
               <h3 className="font-black text-[#2C332D] text-[10px] uppercase tracking-[0.2em] text-[#D4A373]">最近到期 | Upcoming Deadlines</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 px-1">
            {upcomingOrders.length > 0 ? (
              upcomingOrders.map(o => {
                const stage = getStageConfig(o);
                return (
                  <div 
                    key={o.id} 
                    onClick={() => onEditOrder(o)} 
                    className="bg-[#FDFBF7] p-3.5 rounded-[1.25rem] border border-[#D6D2C4]/40 card-baked-subtle-shadow hover:border-[#4B5E4F] transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]">
                    <div className="flex items-center gap-3 md:gap-4"> {/* Adjusted for OrderList-like layout */}
                      {/* 左侧：日期 */}
                      <div className="flex flex-col items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl transition-all shadow-sm bg-[#F4F1EA] text-[#2C332D] shrink-0">
                        <span className="text-[14px] md:text-lg font-black leading-none">{format(parseDateSafe(o.deadline)!, 'dd')}</span>
                        <span className="text-[7px] md:text-[8px] font-bold uppercase mt-0.5 opacity-60">{format(parseDateSafe(o.deadline)!, 'MMM', { locale: zhCN })}</span>
                      </div>

                      {/* 中间：标题与进度 */}
                      <div className="flex-1 min-w-0 pr-1">
                        <h4 className="font-black text-[14px] md:text-lg tracking-tight truncate mb-2 text-[#2C332D]">{o.title}</h4>
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 md:w-28 h-1 bg-[#E8E6DF] rounded-full overflow-hidden shadow-inner">
                            <div 
                              className="h-full transition-all duration-1000" 
                              style={{ width: `${stage.progress}%`, backgroundColor: stage.color }} 
                            />
                          </div>
                          <p className="text-[8.5px] md:text-[10px] font-black uppercase tracking-[0.1em] text-[#4B5E4F]/70">
                            {o.progressStage} · {stage.progress}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-10 text-center bg-[#FDFBF7] border-2 border-dashed border-[#E2E8E4] rounded-[1.75rem] card-baked-shadow">
                 <Sprout className="w-8 h-8 text-[#D6D2C4] mx-auto mb-2 opacity-30" />
                 <p className="text-[9px] font-black text-[#A8A291] uppercase tracking-[0.2em]">暂无近期到期企划</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;