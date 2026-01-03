
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Order, STAGE_PROGRESS_MAP } from '../types';
import { DollarSign, TrendingUp, CreditCard, PieChart, LayoutGrid, GripVertical } from 'lucide-react';
import { parseISO, format } from 'date-fns';

interface FinanceViewProps {
  orders: Order[];
}

type FinanceBlock = 'projected' | 'actual' | 'rate';

const FinanceView: React.FC<FinanceViewProps> = ({ orders }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [blockOrder, setBlockOrder] = useState<FinanceBlock[]>(() => {
    const saved = localStorage.getItem('artnexus_finance_layout');
    return saved ? JSON.parse(saved) : ['projected', 'actual', 'rate'];
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('artnexus_finance_layout', JSON.stringify(blockOrder));
  }, [blockOrder]);

  const getProgress = (order: Order) => STAGE_PROGRESS_MAP[order.progressStage || '未开始'];

  const calculateRealAmount = (o: Order) => {
    return (o.source === '米画师' || o.source === '画加') ? o.totalPrice * 0.95 : o.totalPrice;
  };

  const projectedRevenue = orders.reduce((sum, o) => sum + calculateRealAmount(o), 0);
  const actualRevenue = orders.filter(o => getProgress(o) === 100).reduce((sum, o) => sum + calculateRealAmount(o), 0);
  const completionRate = projectedRevenue > 0 ? (actualRevenue / projectedRevenue) * 100 : 0;

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newOrder = [...blockOrder];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setBlockOrder(newOrder);
  };

  const renderBlock = (type: FinanceBlock) => {
    const isDragging = draggedIndex === blockOrder.indexOf(type);
    const baseClass = `bg-white p-6 rounded-[2rem] border transition-all duration-300 shadow-sm relative group ${isEditing ? 'scale-[0.98] border-dashed border-violet-200 cursor-grab active:cursor-grabbing' : 'border-slate-200 hover:-translate-y-1'}`;
    
    switch (type) {
      case 'projected':
        return (
          <div key="projected" draggable={isEditing} onDragStart={() => handleDragStart(blockOrder.indexOf('projected'))} onDragOver={(e) => isEditing && handleDragOver(e, blockOrder.indexOf('projected'))} className={baseClass}>
            {isEditing && <GripVertical className="absolute top-4 left-2 w-3 h-3 text-slate-300" />}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-50 text-violet-700 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">预计总收 (去费)</p>
                <p className="text-xl md:text-2xl font-black text-slate-800">¥{projectedRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        );
      case 'actual':
        return (
          <div key="actual" draggable={isEditing} onDragStart={() => handleDragStart(blockOrder.indexOf('actual'))} onDragOver={(e) => isEditing && handleDragOver(e, blockOrder.indexOf('actual'))} className={baseClass}>
            {isEditing && <GripVertical className="absolute top-4 left-2 w-3 h-3 text-slate-300" />}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">已结入账 (去费)</p>
                <p className="text-xl md:text-2xl font-black text-slate-800">¥{actualRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        );
      case 'rate':
        return (
          <div key="rate" draggable={isEditing} onDragStart={() => handleDragStart(blockOrder.indexOf('rate'))} onDragOver={(e) => isEditing && handleDragOver(e, blockOrder.indexOf('rate'))} className={baseClass}>
            {isEditing && <GripVertical className="absolute top-4 left-2 w-3 h-3 text-slate-300" />}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">现金流结项比</p>
                <p className="text-xl md:text-2xl font-black text-slate-800">{completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        );
    }
  };

  const chartData = [
    { name: '预计', value: projectedRevenue },
    { name: '已入', value: actualRevenue },
    { name: '待收', value: Math.max(0, projectedRevenue - actualRevenue) },
  ];

  const monthlyDataMap: Record<string, number> = {};
  orders.forEach(o => {
    const month = format(parseISO(o.deadline), 'yyyy-MM');
    monthlyDataMap[month] = (monthlyDataMap[month] || 0) + calculateRealAmount(o);
  });
  const monthlyChartData = Object.keys(monthlyDataMap).sort().map(month => ({ month, revenue: monthlyDataMap[month] }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${isEditing ? 'bg-violet-700 text-white border-violet-700 ring-4 ring-violet-100' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          {isEditing ? '保存排序' : '自定义看板'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {blockOrder.map(type => renderBlock(type))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <PieChart className="w-5 h-5 text-violet-700" />
            <h3 className="text-lg font-bold text-slate-800">收入状态分布</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={60} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '1.2rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}} 
                />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={28}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#7c3aed' : index === 1 ? '#10b981' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-5 h-5 text-violet-700" />
            <h3 className="text-lg font-bold text-slate-800">月度趋势</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `¥${val}`} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1.2rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="revenue" fill="#7c3aed" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceView;
