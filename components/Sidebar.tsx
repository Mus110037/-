
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
    <div className="hidden lg:flex w-64 bg-white border-r border-slate-100 h-screen flex-col sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-8">
        <div className="flex items-center gap-3 text-violet-700 font-black text-xl tracking-tighter">
          <div className="p-2 bg-violet-700 text-white rounded-xl shadow-lg shadow-violet-200">
             <Palette className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg leading-none">ArtNexus</span>
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1 opacity-60">Professional</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-violet-700 text-white font-bold shadow-lg shadow-violet-200' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-white' : 'text-slate-300'}`} />
            <span className="text-[13px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6">
        <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 text-[9px] text-slate-400 font-black uppercase tracking-widest text-center">
          <p className="opacity-50">Licensed for</p>
          <p className="text-slate-600 mt-1">Elite Illustrator</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
