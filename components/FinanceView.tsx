
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie, AreaChart, Area } from 'recharts';
import { Order, AppSettings } from '../types';
import { DollarSign, TrendingUp, PieChart, LayoutGrid, Activity } from 'lucide-react';
// Fix: Removed parseISO and startOfYear reported as missing; using native Date for startOfYear.
import { format, eachMonthOfInterval, endOfYear } from 'date-fns';

interface FinanceViewProps {
  orders: Order[];
  settings: AppSettings;
}

type FinanceModule = 'projected' | 'actual' | 'rate' | 'distChart' | 'trendChart' | 'typeChart';

const FinanceView: React.FC<FinanceViewProps> = ({ orders, settings }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [modules, setModules] = useState<FinanceModule[]>(() => {
    const saved = localStorage.getItem('artnexus_finance_v5');
    return saved ? JSON.parse(saved) : ['projected', 'actual', 'rate', 'distChart', 'trendChart', 'typeChart'];
  });

  useEffect(() => {
    localStorage.setItem('artnexus_finance_v5', JSON.stringify(modules));
  }, [modules]);

  const getSourceConfig = (sourceName: string) => {
    return settings.sources.find(s => s.name === sourceName) || { name: sourceName, fee: 0 };
  };

  const calculateActual = (o: Order) => {
    const source = getSourceConfig(o.source);
    return o.totalPrice * (1 - source.fee / 100);
  };
  
  const getProgress = (o: Order) => {
    const stage = settings.stages.find(s => s.name === (o.progressStage || '未开始'));
    return stage ? stage.progress : 0;
  };
  
  const projectedRevenue = orders.reduce((sum, o) => sum + calculateActual(o), 0);
  const actualRevenue = orders.filter(o => getProgress(o) === 100).reduce((sum, o) => sum + calculateActual(o), 0);
  const completionRate = projectedRevenue > 0 ? (actualRevenue / projectedRevenue) * 100 : 0;

  const computeTrendData = () => {
    const now = new Date();
    // Fix: Using native Date for startOfYear.
    const start = new Date(now.getFullYear(), 0, 1);
    const end = endOfYear(now);
    const months = eachMonthOfInterval({ start, end });
    
    return months.map(m => {
      const monthStr = format(m, 'yyyy-MM');
      const monthOrders = orders.filter(o => o.deadline.startsWith(monthStr));
      const monthActual = monthOrders.filter(o => getProgress(o) === 100).reduce((sum, o) => sum + calculateActual(o), 0);
      return {
        name: format(m, 'M月'),
        value: monthActual
      };
    });
  };

  const trendData = computeTrendData();

  const renderModule = (type: FinanceModule) => {
    const baseClass = `bg-white dark:bg-[#1A1D23] rounded-[2rem] border transition-all duration-300 shadow-sm relative overflow-hidden group ${isEditing ? 'scale-[0.98] border-dashed border-[#A3B18A] ring-4 ring-[#F5F5F0] dark:ring-[#0F1115]' : 'border-[#E0DDD5] dark:border-[#2D3139]'}`;
    
    if (type === 'projected' || type === 'actual' || type === 'rate') {
      const config = {
        projected: { icon: TrendingUp, color: 'text-[#8E9AAF] bg-[#F5F5F0] dark:bg-[#252931]', label: '预期到账 (扣费后)', val: `¥${projectedRevenue.toLocaleString()}` },
        actual: { icon: DollarSign, color: 'text-[#A3B18A] bg-[#EAE8E0] dark:bg-[#2D3139]', label: '已确认入账', val: `¥${actualRevenue.toLocaleString()}` },
        rate: { icon: Activity, color: 'text-white bg-[#333333] dark:bg-[#E0E0E0] dark:text-[#0F1115]', label: '资金池回笼率', val: `${completionRate.toFixed(1)}%` },
      }[type];
      
      return (
        <div key={type} className={`${baseClass} p-8`}>
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${config.color}`}><config.icon className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-[#8E8B82] dark:text-[#8E9AAF] uppercase tracking-widest mb-1">{config.label}</p>
              <p className="text-2xl font-black text-[#333333] dark:text-[#E0E0E0] tracking-tight">{config.val}</p>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'typeChart') {
      const typeMap: Record<string, number> = {};
      orders.forEach(o => {
        const type = o.artType || '未分类';
        typeMap[type] = (typeMap[type] || 0) + calculateActual(o);
      });
      const data = Object.keys(typeMap).map((name, i) => ({ name, value: typeMap[name] }));
      const MORANDI_COLORS = ['#A3B18A', '#8E9AAF', '#D4A373', '#B5838D', '#E0DDD5', '#918B7E'];

      return (
        <div key="typeChart" className={`${baseClass} p-10 lg:col-span-1`}>
          <div className="flex items-center gap-3 mb-10">
            <span className="w-5 h-5 text-[#A3B18A]">○</span>
            <h3 className="text-sm font-bold text-[#333333] dark:text-[#E0E0E0] uppercase tracking-tight">画种产值占比</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={data} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                  {data.map((_, index) => <Cell key={index} fill={MORANDI_COLORS[index % MORANDI_COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '1rem', border: 'none', fontWeight: 'bold', backgroundColor: '#F5F5F0'}}
                  itemStyle={{color: '#333333'}}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (type === 'distChart') {
      const data = [
        { name: '预期', value: projectedRevenue },
        { name: '到账', value: actualRevenue }
      ];

      return (
        <div key={type} className={`${baseClass} p-10 lg:col-span-1 min-h-[400px]`}>
           <div className="flex items-center gap-3 mb-10 text-[#333333] dark:text-[#E0E0E0] uppercase font-bold text-sm">
             <LayoutGrid className="w-5 h-5 text-[#A3B18A]"/>
             资金流状态
           </div>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#8E9AAF'}} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#8E9AAF'}} />
                  <Tooltip 
                    cursor={{fill: '#F5F5F0', opacity: 0.1}}
                    contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#F5F5F0'}} 
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={50}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#E0DDD5' : '#A3B18A'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      );
    }

    if (type === 'trendChart') {
      return (
        <div key={type} className={`${baseClass} p-10 lg:col-span-2 min-h-[400px]`}>
           <div className="flex items-center gap-3 mb-10 text-[#333333] dark:text-[#E0E0E0] uppercase font-bold text-sm">
             <TrendingUp className="w-5 h-5 text-[#A3B18A]"/>
             月度收入波动
           </div>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A3B18A" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#A3B18A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#8E9AAF'}} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#8E9AAF'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#F5F5F0'}} 
                  />
                  <Area type="monotone" dataKey="value" stroke="#A3B18A" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-end">
        <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${isEditing ? 'bg-[#333333] dark:bg-[#E0E0E0] text-white dark:text-[#0F1115]' : 'bg-white dark:bg-[#1A1D23] text-[#8E8B82] dark:text-[#8E9AAF] border-[#E0DDD5] dark:border-[#2D3139]'}`}>
          <LayoutGrid className="w-4 h-4" /> {isEditing ? '锁定模块' : '配置图表'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
        {modules.map(m => renderModule(m))}
      </div>
    </div>
  );
};

export default FinanceView;
