
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie, AreaChart, Area } from 'recharts';
import { Order, AppSettings } from '../types';
import { DollarSign, TrendingUp, LayoutGrid, Activity } from 'lucide-react';
import { format, eachMonthOfInterval, endOfYear } from 'date-fns';

interface FinanceViewProps {
  orders: Order[];
  settings: AppSettings;
}

type FinanceModule = 'projected' | 'actual' | 'rate' | 'distChart' | 'trendChart' | 'typeChart';

const FinanceView: React.FC<FinanceViewProps> = ({ orders, settings }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [modules] = useState<FinanceModule[]>(() => {
    const saved = localStorage.getItem('artnexus_finance_v5');
    return saved ? JSON.parse(saved) : ['projected', 'actual', 'rate', 'distChart', 'trendChart', 'typeChart'];
  });

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
    const start = new Date(now.getFullYear(), 0, 1);
    const end = endOfYear(now);
    const months = eachMonthOfInterval({ start, end });
    return months.map(m => {
      const monthStr = format(m, 'yyyy-MM');
      const monthOrders = orders.filter(o => o.deadline.startsWith(monthStr));
      const monthActual = monthOrders.filter(o => getProgress(o) === 100).reduce((sum, o) => sum + calculateActual(o), 0);
      return { name: format(m, 'M月'), value: monthActual };
    });
  };

  const trendData = computeTrendData();

  const renderModule = (type: FinanceModule) => {
    const baseClass = `bg-white rounded-[2.5rem] border transition-all duration-300 shadow-sm relative overflow-hidden border-[#E2E8E4]`;
    
    if (type === 'projected' || type === 'actual' || type === 'rate') {
      const config = {
        projected: { icon: TrendingUp, color: 'text-[#4F6D58] bg-[#F2F4F0]', label: '生态预估 (扣费后)', val: `¥${projectedRevenue.toLocaleString()}` },
        actual: { icon: DollarSign, color: 'text-white bg-[#3A5A40]', label: '森林确认入账', val: `¥${actualRevenue.toLocaleString()}` },
        rate: { icon: Activity, color: 'text-[#3A5A40] bg-[#EDF1EE]', label: '能量转化率', val: `${completionRate.toFixed(1)}%` },
      }[type];
      
      return (
        <div key={type} className={`${baseClass} p-8`}>
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${config.color}`}><config.icon className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-[#4F6D58] uppercase tracking-widest mb-1">{config.label}</p>
              <p className="text-2xl font-black text-[#2D3A30] tracking-tight">{config.val}</p>
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
      const data = Object.keys(typeMap).map((name) => ({ name, value: typeMap[name] }));
      const FOREST_COLORS = ['#2D3A30', '#3A5A40', '#4F6D58', '#588157', '#A3B18A', '#DAD7CD'];

      return (
        <div key="typeChart" className={`${baseClass} p-10 lg:col-span-1`}>
          <div className="flex items-center gap-3 mb-10">
            <span className="w-5 h-5 text-[#3A5A40]">●</span>
            <h3 className="text-sm font-bold text-[#2D3A30] uppercase tracking-tight">林地物种产值</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={data} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                  {data.map((_, index) => <Cell key={index} fill={FOREST_COLORS[index % FOREST_COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '1.5rem', border: 'none', fontWeight: 'bold', backgroundColor: '#F2F4F0'}}
                  itemStyle={{color: '#2D3A30'}}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (type === 'distChart') {
      const data = [
        { name: '预想', value: projectedRevenue },
        { name: '结果', value: actualRevenue }
      ];
      return (
        <div key={type} className={`${baseClass} p-10 lg:col-span-1 min-h-[400px]`}>
           <div className="flex items-center gap-3 mb-10 text-[#2D3A30] uppercase font-bold text-sm">
             <LayoutGrid className="w-5 h-5 text-[#3A5A40]"/>
             资金流能量图
           </div>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#4F6D58'}} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#4F6D58'}} />
                  <Tooltip cursor={{fill: '#F2F4F0', opacity: 0.5}} contentStyle={{borderRadius: '1.5rem', border: 'none', backgroundColor: '#F2F4F0'}} />
                  <Bar dataKey="value" radius={[15, 15, 0, 0]} barSize={60}>
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#D1D9D3' : '#3A5A40'} />
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
           <div className="flex items-center gap-3 mb-10 text-[#2D3A30] uppercase font-bold text-sm">
             <TrendingUp className="w-5 h-5 text-[#3A5A40]"/>
             月度生长趋势
           </div>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3A5A40" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3A5A40" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#4F6D58'}} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#4F6D58'}} />
                  <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', backgroundColor: '#F2F4F0'}} />
                  <Area type="monotone" dataKey="value" stroke="#3A5A40" strokeWidth={4} fillOpacity={1} fill="url(#colorTrend)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
        {modules.map(m => renderModule(m))}
      </div>
    </div>
  );
};

export default FinanceView;
