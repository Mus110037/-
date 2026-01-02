
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Order, STAGE_PROGRESS_MAP } from '../types';
import { DollarSign, TrendingUp, CreditCard, PieChart } from 'lucide-react';
import { parseISO, format } from 'date-fns';

interface FinanceViewProps {
  orders: Order[];
}

const FinanceView: React.FC<FinanceViewProps> = ({ orders }) => {
  const getProgress = (order: Order) => STAGE_PROGRESS_MAP[order.progressStage || '未开始'];

  const calculateRealAmount = (o: Order) => {
    return (o.source === '米画师' || o.source === '画加') ? o.totalPrice * 0.95 : o.totalPrice;
  };

  const projectedRevenue = orders.reduce((sum, o) => sum + calculateRealAmount(o), 0);
  
  const actualRevenue = orders
    .filter(o => getProgress(o) === 100)
    .reduce((sum, o) => sum + calculateRealAmount(o), 0);

  const completionRate = projectedRevenue > 0 ? (actualRevenue / projectedRevenue) * 100 : 0;

  const chartData = [
    { name: '预计总实收', value: projectedRevenue },
    { name: '已完成实收', value: actualRevenue },
    { name: '剩余待收', value: Math.max(0, projectedRevenue - actualRevenue) },
  ];

  // Calculate Monthly Statistics
  const monthlyDataMap: Record<string, number> = {};
  orders.forEach(o => {
    const month = format(parseISO(o.deadline), 'yyyy-MM');
    const amount = calculateRealAmount(o);
    monthlyDataMap[month] = (monthlyDataMap[month] || 0) + amount;
  });

  const sortedMonths = Object.keys(monthlyDataMap).sort();
  const monthlyChartData = sortedMonths.map(month => ({
    month,
    revenue: monthlyDataMap[month]
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">本月预估实收 (去费)</p>
              <p className="text-2xl font-black">¥{projectedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">已结项入账 (去费)</p>
              <p className="text-2xl font-black">¥{actualRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">结项金额占比</p>
              <p className="text-2xl font-black">{completionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composition Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <PieChart className="w-5 h-5 text-violet-600" />
            <h3 className="text-lg font-bold">收入状态分布</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} 
                />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : index === 1 ? '#10b981' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold">月度收入趋势 (截稿月)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `¥${val}`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} 
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceView;
