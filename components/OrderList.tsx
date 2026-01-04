
import React, { useState, useEffect, useCallback } from 'react';
import { Order, AppSettings, OrderStatus, CommissionType } from '../types';
import { Trash2, X, CheckSquare, Square, ArrowUpDown, CalendarPlus, Sprout, Cookie, Leaf, ChevronDown, ChevronRight, Activity, CircleCheck, Briefcase, User, Rows3, Rows, Sparkles, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns'; // Added parseISO
import { zhCN } from 'date-fns/locale/zh-CN';

interface OrderListProps {
  orders: Order[];
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onUpdateOrder: (order: Order) => void;
  settings: AppSettings;
  orderListInsights: string; // New prop for AI insights
  isAiLoading: boolean; // New prop for AI loading state
}

// 定义一个更具活力且和谐的标签颜色调色板
const TAG_COLOR_PALETTE = [
  '#9B8D69', // Muted Gold
  '#8D9C86', // Sage Green
  '#C1AE9A', // Dusty Pinkish Beige
  '#7D8B78', // Forest Green
  '#D4A373', // Earth Orange
  '#B78B6D', // Rust Brown
  '#A1C9A7', // Light Olive Green
  '#6A8F7F', // Deep Teal Green
];

// 用于企划卡片背景的循环颜色，增加明度差异
const GROUP_BG_PALETTE = [
  '#FDFBF7', // 纯白色
  '#F4F1EA', // 略深的米白色，与纯白色形成明显差异，并与背景和谐
];


// 根据标签内容生成一个稳定的颜色
const getTagColor = (tagName: string) => {
  let sum = 0;
  for (let i = 0; i < tagName.length; i++) {
    sum += tagName.charCodeAt(i);
  }
  const index = sum % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[index];
};

const OrderList: React.FC<OrderListProps> = ({ orders, onEditOrder, onDeleteOrder, onUpdateOrder, settings, orderListInsights, isAiLoading }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [sortMethod, setSortMethod] = useState<'deadline' | 'createdAt'>('deadline');
  const [showStatusFilter, setShowStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  
  // Section-level expansion states
  const [isPendingSectionExpanded, setIsPendingSectionExpanded] = useState(true);
  const [isCompletedSectionExpanded, setIsCompletedSectionExpanded] = useState(true);

  const getShortSource = (name: string) => {
    const map: Record<string, string> = { '米画师': 'MHS', '画加': 'HJ', '小红书': 'XHS', '推特': 'X' };
    return map[name] || name.slice(0, 3).toUpperCase();
  };

  const getStageConfig = (stageName: string) => {
    return settings.stages.find(s => s.name === stageName) || settings.stages[0];
  };

  const exportToCalendar = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    // Use parseISO for consistent date parsing
    const date = format(parseISO(order.deadline), 'yyyyMMdd');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${date}`,
      `DTEND;VALUE=DATE:${date}`,
      `SUMMARY:【截稿】${order.title}`,
      `DESCRIPTION:平台：${order.source}\\n金额：¥${order.totalPrice}\\n备注：${order.description || '无'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${order.title}_截稿日.ics`);
    document.body.appendChild(link);
    document.body.removeChild(link);
  };

  const getGroupedOrders = useCallback((ordersToGroup: Order[]) => {
    const sorted = [...ordersToGroup].sort((a, b) => {
      if (sortMethod === 'deadline') {
        // Use parseISO for consistent date parsing
        return parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime();
      }
      return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
    });
  
    const groups: { key: string; orders: Order[] }[] = [];
    sorted.forEach(order => {
      // Use parseISO for consistent date parsing
      const date = parseISO(order.deadline);
      const month = format(date, 'yyyy年 M月');
      const half = date.getDate() <= 15 ? '上半月' : '下半月';
      const key = `${month} · ${half}`;
      if (groups.length > 0 && groups[groups.length - 1].key === key) {
        groups[groups.length - 1].orders.push(order);
      } else {
        groups.push({ key, orders: [order] });
      }
    });
    return groups;
  }, [sortMethod]);

  const filteredOrders = orders.filter(order => {
    const isCompleted = getStageConfig(order.progressStage).progress === 100;
    if (showStatusFilter === 'pending') return !isCompleted;
    if (showStatusFilter === 'completed') return isCompleted;
    return true; // 'all'
  });

  const pendingOrders = filteredOrders.filter(order => getStageConfig(order.progressStage).progress < 100);
  const completedOrders = filteredOrders.filter(order => getStageConfig(order.progressStage).progress === 100);

  const pendingGroups = getGroupedOrders(pendingOrders);
  const completedGroups = getGroupedOrders(completedOrders);
  
  const togglePendingSection = () => setIsPendingSectionExpanded(prev => !prev);
  const toggleCompletedSection = () => setIsCompletedSectionExpanded(prev => !prev);

  const allOrderIds = filteredOrders.map(o => o.id);
  const isAllSelected = selectedIds.length === allOrderIds.length && allOrderIds.length > 0;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allOrderIds);
    }
  };

  return (
    <div className="space-y-5 pb-32 animate-in fade-in duration-1000">
      {/* AI 见解 / 加载动画 */}
      {settings.showAiUI && isAiLoading && (
          <div className="mb-6 p-4 bg-[#FDFBF7] border border-[#D6D2C4] rounded-xl text-[#2D3A30] flex items-center justify-center gap-3 card-baked-shadow animate-in fade-in slide-in-from-left-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#4B5E4F]" />
            <p className="text-[11px] font-bold leading-relaxed tracking-wide text-[#4B5E4F]">AI 正在生成见解...</p>
          </div>
        )}
      {settings.showAiUI && orderListInsights && !isAiLoading && (
        <div className="mb-6 p-4 bg-[#FDFBF7] border border-[#D6D2C4] rounded-xl text-[#2D3A30] flex items-start gap-4 card-baked-shadow animate-in fade-in slide-in-from-left-2">
          <Sparkles className="w-4 h-4 mt-1 flex-shrink-0 text-[#4B5E4F]" />
          <p className="text-[11px] font-bold leading-relaxed tracking-wide">{orderListInsights}</p>
        </div>
      )}

      <div className="flex justify-between items-center px-6 md:px-8">
        <div className="flex items-center gap-4 flex-nowrap overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds([]); }} 
            className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] transition-all px-3 py-1.5 rounded-full ${isSelectMode ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-[#4B5E4F]/5 text-[#4B5E4F] border border-[#D6D2C4]/20'}`}
          >
            {isSelectMode ? <><X className="w-3 h-3" /> 退出</> : <><CheckSquare className="w-3 h-3" /> 整理仓库</>}
          </button>
          
          {isSelectMode && (
            <>
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-[#4B5E4F] hover:text-[#2C332D] animate-in slide-in-from-left-2"
              >
                {isAllSelected ? <Square className="w-3 h-3" /> : <CheckSquare className="w-3 h-3" />}
                {isAllSelected ? '取消全选' : '全选'}
              </button>
              <button 
                onClick={() => {
                  if(confirm(`确定要从仓库中销毁这 ${selectedIds.length} 张饼吗？此操作无法撤销。`)) {
                    selectedIds.forEach(id => onDeleteOrder(id));
                    setSelectedIds([]);
                    setIsSelectMode(false);
                  }
                }}
                disabled={selectedIds.length === 0}
                className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-rose-500 animate-in slide-in-from-left-2 ${selectedIds.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-rose-700'}`}
              >
                <Trash2 className="w-3 h-3" /> 销毁 ({selectedIds.length})
              </button>
            </>
          )}

          {!isSelectMode && (
            <>
              <button 
                onClick={() => setSortMethod(sortMethod === 'deadline' ? 'createdAt' : 'deadline')}
                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-[#7A8B7C] hover:text-[#4B5E4F]"
              >
                <ArrowUpDown className="w-3 h-3" />
                {sortMethod === 'deadline' ? '按排期排序' : '按入库排序'}
              </button>
              <div className="relative">
                <select
                  value={showStatusFilter}
                  onChange={(e) => setShowStatusFilter(e.target.value as 'all' | 'pending' | 'completed')}
                  className="appearance-none bg-[#4B5E4F]/5 text-[#4B5E4F] border border-[#D6D2C4]/20 text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full outline-none pr-7 cursor-pointer"
                >
                  <option value="all">所有企划</option>
                  <option value="pending">进行中</option>
                  <option value="completed">已完成</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#4B5E4F] pointer-events-none" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 正在进行中分组 */}
      {pendingGroups.length > 0 && (showStatusFilter === 'all' || showStatusFilter === 'pending') && (
        <div className="space-y-3">
          <button 
            onClick={togglePendingSection}
            className="flex items-center gap-2 px-6 md:px-8 w-full text-left"
            aria-expanded={isPendingSectionExpanded}
            aria-controls="pending-orders-section"
          >
            <ChevronRight className={`w-3.5 h-3.5 text-[#D4A373] transition-transform ${isPendingSectionExpanded ? 'rotate-90' : ''}`} />
            <Activity className="w-3.5 h-3.5 text-[#D4A373]" /> {/* Added Activity Icon */}
            <h3 className="text-[10px] font-black text-[#4B5E4F] uppercase tracking-[0.2em] whitespace-nowrap">正在进行中</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-[#D6D2C4]/40 to-transparent" />
          </button>
          
          <div 
            id="pending-orders-section"
            className={`grid grid-cols-1 gap-1.5 px-3 md:px-8 overflow-hidden transition-all duration-300 ease-in-out ${isPendingSectionExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
            style={{ transitionProperty: 'max-height, opacity' }}
          >
            {pendingGroups.map((group, groupIdx) => (
              <div key={`pending-${group.key}`} className="space-y-3">
                <div className="flex items-center gap-2 px-3 md:px-8 w-full text-left">
                  <h3 className="text-[9px] font-black text-[#4B5E4F]/50 uppercase tracking-[0.2em] whitespace-nowrap">{group.key} ({group.orders.length})</h3>
                </div>
                <div className="grid grid-cols-1 gap-1.5 pl-3 pr-0">
                  {group.orders.map((order) => { 
                    const stage = getStageConfig(order.progressStage);
                    const isSelected = selectedIds.includes(order.id);
                    const isFinished = stage.progress === 100;
                    
                    const artTypeColor = getTagColor(order.artType);
                    const sourceColor = getTagColor(order.source);

                    return (
                      <div 
                        key={order.id} 
                        onClick={() => isSelectMode ? setSelectedIds(prev => prev.includes(order.id) ? prev.filter(i => i !== order.id) : [...prev, order.id]) : onEditOrder(order)}
                        className={`flex flex-col rounded-[1.25rem] border transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden group card-baked-shadow ${
                          isSelected ? 'border-[#4B5E4F] bg-[#4B5E4F]/5' : 'border-[#E2E8E4]/60 hover:border-[#4B5E4F]'
                        }`}
                        style={{ backgroundColor: isSelected ? undefined : GROUP_BG_PALETTE[groupIdx % GROUP_BG_PALETTE.length] }}
                      >
                        <div className="p-2.5 md:p-4 flex items-center gap-3 md:gap-4">
                          <div className="flex items-center gap-2.5 shrink-0">
                            {isSelectMode && (
                              <div className="shrink-0">
                                {isSelected ? <CheckSquare className="w-4 h-4 text-[#4B5E4F]" /> : <Square className="w-4 h-4 text-[#D6D2C4]" />}
                              </div>
                            )}
                            
                            <div 
                              className={`flex flex-col items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl transition-all shadow-sm ${isFinished ? 'text-white' : 'bg-[#F4F1EA] text-[#2C332D]'}`}
                              style={{ backgroundColor: isFinished ? stage.color : undefined }}
                            >
                              <span className="text-[14px] md:text-lg font-black leading-none">{format(parseISO(order.deadline), 'dd')}</span>
                              <span className="text-[7px] md:text-[8px] font-bold uppercase mt-0.5 opacity-60">{format(parseISO(order.deadline), 'MMM', { locale: zhCN })}</span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0 border ${
                                  order.priority === '高' ? 'bg-[#E07A5F]/15 text-[#E07A5F] border-[#E07A5F]/50' :
                                  order.priority === '中' ? 'bg-[#81B29A]/15 text-[#81B29A] border-[#81B29A]/50' :
                                  'bg-[#BBDDCC]/15 text-[#BBDDCC] border-[#BBDDCC]/50'
                              }`}>
                                  {order.priority}
                              </span>
                              <h4 className={`font-black text-[14px] md:text-lg tracking-tight truncate ${isFinished ? 'text-[#A8A291] line-through opacity-50' : 'text-[#2C332D]'}`}>
                                {order.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1.5 mb-1.5">
                              <div className="w-16 md:w-28 h-1 bg-[#E8E6DF] rounded-full overflow-hidden shadow-inner">
                                <div 
                                  className="h-full transition-all duration-1000" 
                                  style={{ width: `${stage.progress}%`, backgroundColor: stage.color }} 
                                />
                              </div>
                              <span className={`text-[8.5px] md:text-[10px] font-black uppercase tracking-[0.1em] ${isFinished ? 'text-[#A8A291]' : 'text-[#4B5E4F]/70'}`}>
                                {order.progressStage} · {stage.progress}%
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <span 
                                className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider" 
                                style={{ backgroundColor: `${sourceColor}/15`, color: sourceColor }}
                              >
                                {getShortSource(order.source)}
                              </span>
                              <span 
                                className="text-[8px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-wider" 
                                style={{ backgroundColor: `${artTypeColor}/15`, color: artTypeColor, borderColor: `${artTypeColor}/50` }}
                              >
                                {order.artType}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 md:gap-8 shrink-0">
                            <div className="flex flex-col items-end min-w-[60px] md:min-w-[80px]">
                              <div className="text-[16px] md:text-2xl font-black text-[#2C332D] tracking-tighter tabular-nums leading-none">
                                  <span className="text-[9px] md:text-[11px] font-bold opacity-30 mr-0.5">¥</span>{order.totalPrice.toLocaleString()}
                              </div>
                              <div className={`flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[7.5px] md:text-[9px] font-black uppercase tracking-[0.2em] ${
                                order.commissionType === '商用' 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                  : 'bg-lime-50 text-lime-700 border border-lime-100'
                              }`}>
                                {order.commissionType === '商用' ? <Briefcase className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                                {order.commissionType}
                              </div>
                            </div>

                            {!isSelectMode && (
                              <button 
                                onClick={(e) => exportToCalendar(e, order)}
                                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-[#F4F1EA] text-[#A8A291] hover:bg-[#4B5E4F] hover:text-white transition-all shadow-sm active:scale-90"
                              >
                                <CalendarPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* 已完成分组 */}
      {completedGroups.length > 0 && (showStatusFilter === 'all' || showStatusFilter === 'completed') && (
        <div className="space-y-3 pt-8">
          <button 
            onClick={toggleCompletedSection}
            className="flex items-center gap-2 px-6 md:px-8 w-full text-left"
            aria-expanded={isCompletedSectionExpanded}
            aria-controls="completed-orders-section"
          >
            <ChevronRight className={`w-3.5 h-3.5 text-[#4B5E4F] transition-transform ${isCompletedSectionExpanded ? 'rotate-90' : ''}`} />
            <CircleCheck className="w-3.5 h-3.5 text-[#4B5E4F]" />
            <h3 className="text-[10px] font-black text-[#4B5E4F] uppercase tracking-[0.2em] whitespace-nowrap">已完成</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-[#D6D2C4]/40 to-transparent" />
          </button>
          <div 
            id="completed-orders-section"
            className={`grid grid-cols-1 gap-1.5 px-3 md:px-8 overflow-hidden transition-all duration-300 ease-in-out ${isCompletedSectionExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
            style={{ transitionProperty: 'max-height, opacity' }}
          >
            {completedGroups.map((group, groupIdx) => (
              <div key={`completed-${group.key}`} className="space-y-3">
                <div className="flex items-center gap-2 px-3 md:px-8 w-full text-left">
                  <h3 className="text-[9px] font-black text-[#4B5E4F]/50 uppercase tracking-[0.2em] whitespace-nowrap">{group.key} ({group.orders.length})</h3>
                </div>
                <div className="grid grid-cols-1 gap-1.5 pl-3 pr-0">
                  {group.orders.map((order) => {
                    const stage = getStageConfig(order.progressStage);
                    const isSelected = selectedIds.includes(order.id);
                    const isFinished = stage.progress === 100;
                    
                    const artTypeColor = getTagColor(order.artType);
                    const sourceColor = getTagColor(order.source);

                    return (
                      <div 
                        key={order.id} 
                        onClick={() => isSelectMode ? setSelectedIds(prev => prev.includes(order.id) ? prev.filter(i => i !== order.id) : [...prev, order.id]) : onEditOrder(order)}
                        className={`flex flex-col rounded-[1.25rem] border transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden group card-baked-shadow ${
                          isSelected ? 'border-[#4B5E4F] bg-[#4B5E4F]/5' : 'border-[#E2E8E4]/60 hover:border-[#4B5E4F]'
                        }`}
                        style={{ backgroundColor: isSelected ? undefined : GROUP_BG_PALETTE[groupIdx % GROUP_BG_PALETTE.length] }}
                      >
                        <div className="p-2.5 md:p-4 flex items-center gap-3 md:gap-4">
                          <div className="flex items-center gap-2.5 shrink-0">
                            {isSelectMode && (
                              <div className="shrink-0">
                                {isSelected ? <CheckSquare className="w-4 h-4 text-[#4B5E4F]" /> : <Square className="w-4 h-4 text-[#D6D2C4]" />}
                              </div>
                            )}
                            
                            <div 
                              className={`flex flex-col items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl transition-all shadow-sm ${isFinished ? 'text-white' : 'bg-[#F4F1EA] text-[#2C332D]'}`}
                              style={{ backgroundColor: isFinished ? stage.color : undefined }}
                            >
                              <span className="text-[14px] md:text-lg font-black leading-none">{format(parseISO(order.deadline), 'dd')}</span>
                              <span className="text-[7px] md:text-[8px] font-bold uppercase mt-0.5 opacity-60">{format(parseISO(order.deadline), 'MMM', { locale: zhCN })}</span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0 border ${
                                  order.priority === '高' ? 'bg-[#E07A5F]/15 text-[#E07A5F] border-[#E07A5F]/50' :
                                  order.priority === '中' ? 'bg-[#81B29A]/15 text-[#81B29A] border-[#81B29A]/50' :
                                  'bg-[#BBDDCC]/15 text-[#BBDDCC] border-[#BBDDCC]/50'
                              }`}>
                                  {order.priority}
                              </span>
                              <h4 className={`font-black text-[14px] md:text-lg tracking-tight truncate ${isFinished ? 'text-[#A8A291] line-through opacity-50' : 'text-[#2C332D]'}`}>
                                {order.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1.5 mb-1.5">
                              <div className="w-16 md:w-28 h-1 bg-[#E8E6DF] rounded-full overflow-hidden shadow-inner">
                                <div 
                                  className="h-full transition-all duration-1000" 
                                  style={{ width: `${stage.progress}%`, backgroundColor: stage.color }} 
                                />
                              </div>
                              <span className={`text-[8.5px] md:text-[10px] font-black uppercase tracking-[0.1em] ${isFinished ? 'text-[#A8A291]' : 'text-[#4B5E4F]/70'}`}>
                                {order.progressStage} · {stage.progress}%
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <span 
                                className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider" 
                                style={{ backgroundColor: `${sourceColor}/15`, color: sourceColor }}
                              >
                                {getShortSource(order.source)}
                              </span>
                              <span 
                                className="text-[8px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-wider" 
                                style={{ backgroundColor: `${artTypeColor}/15`, color: artTypeColor, borderColor: `${artTypeColor}/50` }}
                              >
                                {order.artType}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 md:gap-8 shrink-0">
                            <div className="flex flex-col items-end min-w-[60px] md:min-w-[80px]">
                              <div className="text-[16px] md:text-2xl font-black text-[#2C332D] tracking-tighter tabular-nums leading-none">
                                  <span className="text-[9px] md:text-[11px] font-bold opacity-30 mr-0.5">¥</span>{order.totalPrice.toLocaleString()}
                              </div>
                              <div className={`flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[7.5px] md:text-[9px] font-black uppercase tracking-[0.2em] ${
                                order.commissionType === '商用' 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                  : 'bg-lime-50 text-lime-700 border border-lime-100'
                              }`}>
                                {order.commissionType === '商用' ? <Briefcase className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                                {order.commissionType}
                              </div>
                            </div>

                            {!isSelectMode && (
                              <button 
                                onClick={(e) => exportToCalendar(e, order)}
                                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-[#F4F1EA] text-[#A8A291] hover:bg-[#4B5E4F] hover:text-white transition-all shadow-sm active:scale-90"
                              >
                                <CalendarPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      {filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
           <div className="w-16 h-16 bg-[#F4F1EA] rounded-full flex items-center justify-center mb-4">
              <Cookie className="w-8 h-8 text-[#D6D2C4]" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A8A291]">面粉还没准备好，快去加单吧</p>
        </div>
      )}
    </div>
  );
};

export default OrderList;