
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';
import { Order, AppSettings } from '../types';
import { DollarSign, TrendingUp, CreditCard, PieChart, LayoutGrid, GripVertical, Activity } from 'lucide-react';
import { parseISO, format } from 'date-fns';

interface FinanceViewProps {
  orders: Order[];
  settings: AppSettings;
}

type FinanceModule = 'projected' | 'actual' | 'rate' | 'distChart' | 'trendChart' | 'typeChart';

const FinanceView: React.FC<FinanceViewProps> = ({ orders, settings }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [modules, setModules] = useState<FinanceModule[]>(() => {
    const saved = localStorage.getItem('artnexus_finance_layout_v3');
    return saved ? JSON.parse(saved) : ['projected', 'actual', 'rate', 'distChart', 'trendChart', 'typeChart'];
  });
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('artnexus_finance_layout_v3', JSON.stringify(modules));
  }, [modules]);

  const calculateRealAmount = (o: Order) => (o.source === '米画师' || o.source === '画加') ? o.totalPrice * 0.95 : o.totalPrice;
  
  const getProgress = (o: Order) => {
    const stage = settings.stages.find(s => s.name === (o.progressStage || '未开始'));
    return stage ? stage.progress : 0;
  };
  
  const projectedRevenue = orders.reduce((sum, o) => sum + calculateRealAmount(o), 0);
  const actualRevenue = orders.filter(o => getProgress(o) === 100).reduce((sum, o) => sum + calculateRealAmount(o), 0);
  const completionRate = projectedRevenue > 0 ? (actualRevenue / projectedRevenue) * 100 : 0;

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    const newModules = [...modules];
    const item = newModules[draggedIdx];
    newModules.splice(draggedIdx, 1);
    newModules.splice(idx, 0, item);
    setDraggedIdx(idx);
    setModules(newModules);
  };

  const renderModule = (type: FinanceModule) => {
    const baseClass = `bg-white rounded-[1.8rem] border transition-all duration-300 shadow-sm relative overflow-hidden group ${isEditing ? 'scale-[0.98] border-dashed border-blue-300 ring-4 ring-blue-50' : 'border-slate-100'}`;
    
    if (type === 'projected' || type === 'actual' || type === 'rate') {
      const config = {
        projected: { icon: TrendingUp, color: 'text-slate-600 bg-slate-50', label: '总收估算 (去费)', val: `¥${projectedRevenue.toLocaleString()}` },
        actual: { icon: DollarSign, color: 'text-slate-900 bg-slate-100', label: '实际入账 (去费)', val: `¥${actualRevenue.toLocaleString()}` },
        rate: { icon: Activity, color: 'text-blue-600 bg-blue-50', label: '现金流达成', val: `${completionRate.toFixed(1)}%` },
      }[type];
      
      return (
        <div key={type} draggable={isEditing} onDragStart={() => handleDragStart(modules.indexOf(type))} onDragOver={(e) => isEditing && handleDragOver(e, modules.indexOf(type))} className={`${baseClass} p-6`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${config.color}`}><config.icon className="w-5 h-5" /></div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{config.label}</p>
              <p className="text-xl font-bold text-slate-900 tracking-tight">{config.val}</p>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'typeChart') {
      const typeMap: Record<string, number> = {};
      orders.forEach(o => {
        const type = o.artType || '未分类';
        typeMap[type] = (typeMap[type] || 0) + calculateRealAmount(o);
      });
      const data = Object.keys(typeMap).map((name, i) => ({ name, value: typeMap[name] }));
      const COLORS = ['#1e293b', '#3b82f6', '#94a3b8', '#cbd5e1', '#f1f5f9', '#64748b'];

      return (
        <div key="typeChart" draggable={isEditing} onDragStart={() => handleDragStart(modules.indexOf('typeChart'))} onDragOver={(e) => isEditing && handleDragOver(e, modules.indexOf('typeChart'))} className={`${baseClass} p-8 lg:col-span-1`}>
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-slate-900" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">画种收入贡献</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '1rem', border: 'none'}} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {data.slice(0, 4).map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                <span className="text-[10px] text-slate-500 truncate font-medium">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'distChart') {
      const data = [
        { name: '总收入', value: projectedRevenue },
        { name: '已入', value: actualRevenue },
        { name: '待收', value: Math.max(0, projectedRevenue - actualRevenue) },
      ];
      return (
        <div key="distChart" draggable={isEditing} onDragStart={() => handleDragStart(modules.indexOf('distChart'))} onDragOver={(e) => isEditing && handleDragOver(e, modules.indexOf('distChart'))} className={`${baseClass} p-8 lg:col-span-1`}>
          <div className="flex items-center gap-2 mb-8">
            <LayoutGrid className="w-5 h-5 text-slate-900" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">现金分布概览</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={40} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1rem', border: 'none', fontSize: '12px'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {data.map((_, i) => <Cell key={i} fill={['#0f172a', '#3b82f6', '#94a3b8'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (type === 'trendChart') {
      const monthlyMap: Record<string, number> = {};
      orders.forEach(o => {
        const m = format(parseISO(o.deadline), 'MM月');
        monthlyMap[m] = (monthlyMap[m] || 0) + calculateRealAmount(o);
      });
      const data = Object.keys(monthlyMap).sort().map(m => ({ m, v: monthlyMap[m] }));
      return (
        <div key="trendChart" draggable={isEditing} onDragStart={() => handleDragStart(modules.indexOf('trendChart'))} onDragOver={(e) => isEditing && handleDragOver(e, modules.indexOf('trendChart'))} className={`${baseClass} p-8 lg:col-span-1`}>
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="w-5 h-5 text-slate-900" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">月度趋势看板</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="m" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `¥${v}`} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1rem', border: 'none'}} />
                <Bar dataKey="v" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${isEditing ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
          <LayoutGrid className="w-3.5 h-3.5" /> {isEditing ? '保存布局' : '调整看板'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(m => renderModule(m))}
      </div>
    </div>
  );
};

export default FinanceView;
