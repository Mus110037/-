
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Order, STAGE_PROGRESS_MAP } from '../types';
import { DollarSign, TrendingUp, CreditCard, PieChart, LayoutGrid, GripVertical, Activity } from 'lucide-react';
import { parseISO, format } from 'date-fns';

interface FinanceViewProps {
  orders: Order[];
}

type FinanceModule = 'projected' | 'actual' | 'rate' | 'distChart' | 'trendChart';

const FinanceView: React.FC<FinanceViewProps> = ({ orders }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [modules, setModules] = useState<FinanceModule[]>(() => {
    const saved = localStorage.getItem('artnexus_finance_layout_v2');
    return saved ? JSON.parse(saved) : ['projected', 'actual', 'rate', 'distChart', 'trendChart'];
  });
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('artnexus_finance_layout_v2', JSON.stringify(modules));
  }, [modules]);

  const calculateRealAmount = (o: Order) => (o.source === '米画师' || o.source === '画加') ? o.totalPrice * 0.95 : o.totalPrice;
  const getProgress = (o: Order) => STAGE_PROGRESS_MAP[o.progressStage || '未开始'];
  
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
    const baseClass = `bg-white rounded-[2.2rem] border transition-all duration-300 shadow-sm relative overflow-hidden group ${isEditing ? 'scale-[0.98] border-dashed border-violet-300 ring-4 ring-violet-50' : 'border-slate-100 hover:shadow-md'}`;
    
    if (type === 'projected' || type === 'actual' || type === 'rate') {
      const config = {
        projected: { icon: TrendingUp, color: 'text-violet-600 bg-violet-50', label: '预计总收 (去费)', val: `¥${projectedRevenue.toLocaleString()}` },
        actual: { icon: DollarSign, color: 'text-emerald-600 bg-emerald-50', label: '已入账 (去费)', val: `¥${actualRevenue.toLocaleString()}` },
        rate: { icon: Activity, color: 'text-amber-600 bg-amber-50', label: '现金流占比', val: `${completionRate.toFixed(1)}%` },
      }[type];
      
      return (
        <div key={type} draggable={isEditing} onDragStart={() => handleDragStart(modules.indexOf(type))} onDragOver={(e) => isEditing && handleDragOver(e, modules.indexOf(type))} className={`${baseClass} p-6`}>
          {isEditing && <GripVertical className="absolute top-4 left-2 w-3 h-3 text-slate-300 cursor-grab" />}
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${config.color}`}><config.icon className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{config.label}</p>
              <p className="text-xl font-black text-slate-800">{config.val}</p>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'distChart') {
      const data = [
        { name: '预计', value: projectedRevenue },
        { name: '已入', value: actualRevenue },
        { name: '待收', value: Math.max(0, projectedRevenue - actualRevenue) },
      ];
      return (
        <div key="distChart" draggable={isEditing} onDragStart={() => handleDragStart(modules.indexOf('distChart'))} onDragOver={(e) => isEditing && handleDragOver(e, modules.indexOf('distChart'))} className={`${baseClass} p-8 col-span-full lg:col-span-1`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              {isEditing && <GripVertical className="w-4 h-4 text-slate-300" />}
              <PieChart className="w-5 h-5 text-violet-600" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">收入状态分布</h3>
            </div>
          </div>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={40} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1rem', border: 'none', fontSize: '12px'}} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                  {data.map((_, i) => <Cell key={i} fill={['#8b5cf6', '#10b981', '#f59e0b'][i]} />)}
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
        <div key="trendChart" draggable={isEditing} onDragStart={() => handleDragStart(modules.indexOf('trendChart'))} onDragOver={(e) => isEditing && handleDragOver(e, modules.indexOf('trendChart'))} className={`${baseClass} p-8 col-span-full lg:col-span-1`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              {isEditing && <GripVertical className="w-4 h-4 text-slate-300" />}
              <TrendingUp className="w-5 h-5 text-violet-600" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">月度趋势看板</h3>
            </div>
          </div>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="m" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `¥${v}`} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1rem', border: 'none'}} />
                <Bar dataKey="v" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} />
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
        <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isEditing ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-100' : 'bg-white text-slate-500 border-slate-100'}`}>
          <LayoutGrid className="w-3.5 h-3.5" /> {isEditing ? '确认布局' : '编辑看板'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(m => renderModule(m))}
      </div>
    </div>
  );
};

export default FinanceView;
