
import React, { useState, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie, AreaChart, Area, Legend } from 'recharts';
import { Order, AppSettings } from '../types';
import { DollarSign, TrendingUp, LayoutGrid, Activity, Clock, PieChart, Leaf, Info, Wallet, Sparkles, Loader2 } from 'lucide-react';
import { format, eachMonthOfInterval, endOfYear, eachDayOfInterval, endOfMonth, isSameMonth as dfIsSameMonth, isSameYear as dfIsSameYear, parseISO } from 'date-fns'; // Added parseISO
import { zhCN } from 'date-fns/locale/zh-CN';

interface FinanceViewProps {
  orders: Order[];
  settings: AppSettings;
  financeInsights: string; // New prop for AI financial insights
  isAiLoading: boolean; // New prop for AI loading state
}

const FinanceView: React.FC<FinanceViewProps> = ({ orders, settings, financeInsights, isAiLoading }) => {
  const [timeRangeFilter, setTimeRangeFilter] = useState<'total' | 'annual' | 'monthly'>('annual');

  const getSourceConfig = (sourceName: string) => {
    return settings.sources.find(s => s.name === sourceName) || { name: sourceName, fee: 0 };
  };

  const calculateActual = (o: Order) => {
    const source = getSourceConfig(o.source);
    return o.totalPrice * (1 - source.fee / 100);
  };
  
  const getProgress = (o: Order) => {
    const stage = settings.stages.find(s => s.name === (o.progressStage || '待开始'));
    return stage ? stage.progress : 0;
  };

  const filterOrdersByTimeRange = useCallback((allOrders: Order[]): Order[] => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (timeRangeFilter === 'total') {
      return allOrders;
    } else if (timeRangeFilter === 'annual') {
      return allOrders.filter(o => {
        try {
          // Use parseISO for YYYY-MM-DD format
          const orderDate = parseISO(o.deadline);
          return dfIsSameYear(orderDate, now);
        } catch {
          return false;
        }
      });
    } else { // 'monthly'
      return allOrders.filter(o => {
        try {
          // Use parseISO for YYYY-MM-DD format
          const orderDate = parseISO(o.deadline);
          return dfIsSameMonth(orderDate, now);
        } catch {
          return false;
        }
      });
    }
  }, [timeRangeFilter]);

  const filteredOrders = filterOrdersByTimeRange(orders);

  const projectedRevenue = filteredOrders.reduce((sum, o) => sum + calculateActual(o), 0);
  const actualRevenue = filteredOrders.filter(o => getProgress(o) === 100).reduce((sum, o) => sum + calculateActual(o), 0);
  const completionRate = projectedRevenue > 0 ? (actualRevenue / projectedRevenue) * 100 : 0;
  
  const totalActualDuration = filteredOrders
    .filter(o => getProgress(o) === 100 && o.actualDuration !== undefined)
    .reduce((sum, o) => sum + (o.actualDuration || 0), 0);
  
  const hourlyWage = totalActualDuration > 0 ? actualRevenue / totalActualDuration : 0; // 新增时薪计算

  const trendData = useMemo(() => {
    const now = new Date();
    let data: { name: string; projected: number }[] = [];

    if (timeRangeFilter === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysInMonth = eachDayOfInterval({ start, end: endOfMonth(now) });
      data = daysInMonth.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayOrders = filteredOrders.filter(o => o.deadline === dayStr);
        const dayProjected = dayOrders.reduce((sum, o) => sum + calculateActual(o), 0);
        return { name: format(day, 'd日'), projected: dayProjected };
      });
    } else if (timeRangeFilter === 'annual') {
      const start = new Date(now.getFullYear(), 0, 1);
      const monthsInYear = eachMonthOfInterval({ start, end: endOfYear(now) });
      data = monthsInYear.map(m => {
        const monthStr = format(m, 'yyyy-MM');
        const monthOrders = filteredOrders.filter(o => o.deadline.startsWith(monthStr));
        const monthProjected = monthOrders.reduce((sum, o) => sum + calculateActual(o), 0);
        return { name: format(m, 'M月', { locale: zhCN }), projected: monthProjected };
      });
    } else { // 'total'
      const monthlyTotals: Record<number, number> = {};
      orders.forEach(o => { // Use original 'orders' for total view across all years
          try {
              // Use parseISO for YYYY-MM-DD format
              const monthNum = parseISO(o.deadline).getMonth(); // 0-11
              monthlyTotals[monthNum] = (monthlyTotals[monthNum] || 0) + calculateActual(o);
          } catch {}
      });
      data = Array.from({ length: 12 }, (_, i) => ({
          name: format(new Date(now.getFullYear(), i, 1), 'M月', { locale: zhCN }),
          projected: monthlyTotals[i] || 0,
      }));
    }
    return data;
  }, [filteredOrders, timeRangeFilter, orders]);

  const FOREST_COLORS = ['#2D3A30', '#3A5A40', '#4F6D58', '#588157', '#A3B18A', '#DAD7CD'];

  // Custom Label for Pie Charts
  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="#2D3A30" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[9px] font-bold">
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Data for "稿件分类" Pie Chart (Revenue based)
  const typeRevenueMap: Record<string, number> = {};
  filteredOrders.forEach(o => {
    const type = o.artType || '未分类';
    typeRevenueMap[type] = (typeRevenueMap[type] || 0) + calculateActual(o);
  });
  const typeRevenueData = Object.keys(typeRevenueMap).map((name) => ({ name, value: typeRevenueMap[name] }));

  // Data for "工时分布" Pie Chart (Duration based)
  const durationMap: Record<string, number> = {};
  filteredOrders.filter(o => getProgress(o) === 100 && o.actualDuration !== undefined) 
        .forEach(o => {
          const type = o.artType || '未分类';
          durationMap[type] = (durationMap[type] || 0) + (o.actualDuration || 0);
        });
  const durationData = Object.keys(durationMap).map((name) => ({ name, value: durationMap[name] }));

  const kpisToRender = [
    { 
      label: '预计总额', 
      value: `¥${projectedRevenue.toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'bg-[#F4F1EA] text-[#4F6D58]' 
    },
    { 
      label: '实际入账', 
      value: `¥${actualRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'bg-[#3A5A40] text-white', 
      subLabel: `转化率: ${completionRate.toFixed(1)}%` 
    },
    { 
      label: '总工时', 
      value: `${totalActualDuration.toFixed(1)}H`, 
      icon: Clock, 
      color: 'bg-[#F4F1EA] text-[#2D3A30]' 
    },
    {
      label: '平均时薪',
      value: `¥${hourlyWage.toFixed(2)}/H`,
      icon: Wallet,
      color: 'bg-[#C1AE9A] text-[#2D3A30]',
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-24">
      {/* 时间范围切换按钮 */}
      <div className="flex justify-center mb-6">
        <div className="flex rounded-full bg-[#F4F1EA] p-1 border border-[#D6D2C4]/40 shadow-inner">
          {[{ key: 'total', label: '总计' }, { key: 'annual', label: '年度' }, { key: 'monthly', label: '月度' }].map(btn => (
            <button
              key={btn.key}
              onClick={() => setTimeRangeFilter(btn.key as 'total' | 'annual' | 'monthly')}
              className={`px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all ${
                timeRangeFilter === btn.key 
                  ? 'bg-[#4B5E4F] text-white shadow-md' 
                  : 'text-[#4B5E4F] hover:bg-[#D6D2C4]/20'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI 财务见解 */}
      {settings.showAiUI && isAiLoading && (
          <div className="mb-6 p-4 bg-[#FDFBF7] border border-[#D6D2C4] rounded-xl text-[#2D3A30] flex items-center justify-center gap-3 card-baked-shadow animate-in fade-in slide-in-from-left-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#4B5E4F]" />
            <p className="text-[11px] font-bold leading-relaxed tracking-wide text-[#4B5E4F]">AI 正在生成财务见解...</p>
          </div>
        )}
      {settings.showAiUI && financeInsights && !isAiLoading && (
        <div className="mb-6 p-4 bg-[#FDFBF7] border border-[#D6D2C4] rounded-xl text-[#2D3A30] flex items-start gap-4 card-baked-shadow animate-in fade-in slide-in-from-left-2">
          <Sparkles className="w-4 h-4 mt-1 flex-shrink-0 text-[#D4A373]" />
          <p className="text-[11px] font-bold leading-relaxed tracking-wide">{financeInsights}</p>
        </div>
      )}

      {/* 顶部聚合 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {kpisToRender.map((kpi, i) => (
          <div key={i} className="bg-[#FDFBF7] p-4 md:p-6 rounded-[1.75rem] border border-[#E2E8E4] shadow-sm flex flex-col justify-between group hover:border-[#4B5E4F] transition-all">
            <>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-3 md:mb-6 transition-transform group-hover:scale-110 ${kpi.color}`}>
                <kpi.icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div>
                <p className="text-[8px] md:text-[9px] font-black text-[#4F6D58]/60 uppercase tracking-[0.2em] mb-1">{kpi.label}</p>
                <p className="text-sm md:text-xl font-black text-[#2D3A30] tracking-tight">{kpi.value}</p>
                {kpi.subLabel && (
                  <div className="flex items-center gap-1 mt-1">
                    <Info className="w-3 h-3 text-[#A3B18A]" />
                    <p className="text-[9px] font-bold text-[#A3B18A] tracking-tight">{kpi.subLabel}</p>
                  </div>
                )}
              </div>
            </>
          </div>
        ))}
      </div>

      {/* 主看板图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 月度趋势图 */}
        <div className="bg-[#FDFBF7] p-6 md:p-8 rounded-[2rem] border border-[#E2E8E4] shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="w-4 h-4 text-[#3A5A40]" />
            <h3 className="text-[10px] font-black text-[#2D3A30] uppercase tracking-widest">
              {timeRangeFilter === 'monthly' ? '当月收成趋势' : '年度收成趋势'}
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3A5A40" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3A5A40" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} tick={{fill: '#A8A291', fontWeight: 'bold'}} />
                <YAxis fontSize={9} axisLine={false} tickLine={false} tick={{fill: '#A8A291'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '1rem', border: 'none', backgroundColor: '#FDFBF7', fontSize: '11px', fontWeight: 'bold'}}
                  formatter={(value: number) => [`¥${value.toLocaleString()}`, '预计收入']}
                />
                <Area type="monotone" dataKey="projected" stroke="#3A5A40" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 下方网格：分类占比与工时分布 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 稿件分类 (收入占比) */}
          <div className="bg-[#FDFBF7] p-6 rounded-[2rem] border border-[#E2E8E4] shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-[#3A5A40]" />
              <h3 className="text-[10px] font-black text-[#2D3A30] uppercase tracking-widest">稿件分类 (收入)</h3>
            </div>
            <div className="flex-1 min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie 
                    data={typeRevenueData} 
                    innerRadius={35} 
                    outerRadius={60} 
                    paddingAngle={4} 
                    dataKey="value"
                    label={renderCustomizedLabel} 
                    labelLine={false}
                  >
                    {typeRevenueData.map((_, index) => <Cell key={`cell-${index}`} fill={FOREST_COLORS[index % FOREST_COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '1rem', border: 'none', backgroundColor: '#FDFBF7', fontSize: '10px', fontWeight: 'bold'}}
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '预计收入']}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 工时分布 */}
          <div className="bg-[#FDFBF7] p-6 rounded-[2rem] border border-[#E2E8E4] shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[#3A5A40]" />
              <h3 className="text-[10px] font-black text-[#2D3A30] uppercase tracking-widest">工时分布 (已完成)</h3>
            </div>
            <div className="flex-1 min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie 
                    data={durationData} 
                    innerRadius={35} 
                    outerRadius={60} 
                    paddingAngle={4} 
                    dataKey="value"
                    label={renderCustomizedLabel} 
                    labelLine={false}
                  >
                    {durationData.map((entry, index) => <Cell key={`cell-${index}`} fill={FOREST_COLORS[(index + 2) % FOREST_COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '1rem', border: 'none', backgroundColor: '#FDFBF7', fontSize: '10px', fontWeight: 'bold'}}
                    formatter={(value: number) => [`${value.toFixed(1)}H`, '实际工时']}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 底部装饰 */}
      <div className="pt-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4B5E4F]/5 rounded-full border border-[#D6D2C4]/30">
           <Leaf className="w-3 h-3 text-[#4B5E4F]" />
           <p className="text-[8px] font-black text-[#7A8B7C] uppercase tracking-[0.2em]">财务引擎已同步至最新烘焙批次</p>
        </div>
      </div>
    </div>
  );
};

export default FinanceView;