
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';
import { Order, AppSettings } from '../types';
import { DollarSign, TrendingUp, PieChart, LayoutGrid, Activity } from 'lucide-react';
import { parseISO, format } from 'date-fns';

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

  const renderModule = (type: FinanceModule) => {
    const baseClass = `bg-white rounded-[2rem] border transition-all duration-300 shadow-sm relative overflow-hidden group ${isEditing ? 'scale-[0.98] border-dashed border-slate-300 ring-4 ring-slate-50' : 'border-slate-200'}`;
    
    if (type === 'projected' || type === 'actual' || type === 'rate') {
      const config = {
        projected: { icon: TrendingUp, color: 'text-slate-600 bg-slate-50', label: '预期到账 (扣费后)', val: `¥${projectedRevenue.toLocaleString()}` },
        actual: { icon: DollarSign, color: 'text-slate-900 bg-slate-100', label: '已确认入账', val: `¥${actualRevenue.toLocaleString()}` },
        rate: { icon: Activity, color: 'text-slate-900 bg-slate-900 text-white', label: '资金池回笼率', val: `${completionRate.toFixed(1)}%` },
      }[type];
      
      return (
        <div key={type} className={`${baseClass} p-8`}>
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${config.color}`}><config.icon className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{config.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{config.val}</p>
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
      const COLORS = ['#1E293B', '#3B82F6', '#6366F1', '#94A3B8', '#F1F5F9', '#CBD5E1'];

      return (
        <div key="typeChart" className={`${baseClass} p-10 lg:col-span-1`}>
          <div className="flex items-center gap-3 mb-10">
            <PieChart className="w-5 h-5 text-slate-900" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">画种产值占比</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={data} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                  {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', fontWeight: 'bold'}} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (type === 'distChart' || type === 'trendChart') {
      return (
        <div key={type} className={`${baseClass} p-10 lg:col-span-1 min-h-[400px]`}>
           <div className="flex items-center gap-3 mb-10 text-slate-900 uppercase font-bold text-sm">
             {type === 'distChart' ? <LayoutGrid className="w-5 h-5"/> : <TrendingUp className="w-5 h-5"/>}
             {type === 'distChart' ? '资金流状态' : '月度收入波动'}
           </div>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={type === 'distChart' ? [
                  { name: '预期', value: projectedRevenue },
                  { name: '到账', value: actualRevenue }
                ] : []}>
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Bar dataKey="value" fill="#1E293B" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-end">
        <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${isEditing ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:text-slate-900'}`}>
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
