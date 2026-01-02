
import React from 'react';
import { LayoutDashboard, Calendar, ListTodo, Wallet, Palette, Bot } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: '工作台', icon: LayoutDashboard },
    { id: 'calendar', label: '排单日历', icon: Calendar },
    { id: 'orders', label: '稿件清单', icon: ListTodo },
    { id: 'finance', label: '财务统计', icon: Wallet },
    { id: 'ai-assistant', label: 'AI 创意助手', icon: Bot },
  ];

  return (
    <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 h-screen flex-col sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-2 text-violet-600 font-bold text-xl tracking-tight">
          <Palette className="w-8 h-8" />
          <div className="flex flex-col">
            <span className="text-lg leading-none">ArtNexus</span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em] mt-1">Pro | 艺策</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-violet-50 text-violet-600 font-bold' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <p>Subscription: Elite Artist</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
