
import React from 'react';
import { LayoutDashboard, Calendar, ListTodo, Wallet, Palette, Bot, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: '工作台概览', icon: LayoutDashboard },
    { id: 'calendar', label: '创作日历', icon: Calendar },
    { id: 'orders', label: '企划库', icon: ListTodo },
    { id: 'finance', label: '财务看板', icon: Wallet },
    { id: 'ai-assistant', label: 'AI 创意助手', icon: Bot },
    { id: 'settings', label: '自定义工作区', icon: Settings },
  ];

  return (
    <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 h-screen flex-col sticky top-0 shadow-[1px_0_0_rgba(0,0,0,0.02)]">
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 text-white rounded-xl shadow-sm">
             <Palette className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900">艺策 ArtNexus</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Professional Edition</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
              activeTab === item.id 
                ? 'bg-slate-50 text-slate-900 font-bold' 
                : 'text-slate-500 hover:bg-slate-50/80 hover:text-slate-700'
            }`}
          >
            <item.icon className={`w-4 h-4 transition-colors ${activeTab === item.id ? 'text-blue-600' : 'text-slate-300'}`} />
            <span className="text-[13px] tracking-tight">{item.label}</span>
            {activeTab === item.id && (
              <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
            )}
          </button>
        ))}
      </nav>
      
      <div className="p-6 mt-auto">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] text-slate-500 font-medium">本地加密存储已就绪</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
