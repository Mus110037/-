
import React from 'react';
import { LayoutDashboard, Calendar, ListTodo, Wallet, Cookie, Bot, Settings, Pizza } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: '饼铺概览', icon: LayoutDashboard },
    { id: 'calendar', label: '烘焙日历', icon: Calendar },
    { id: 'orders', label: '饼干仓库', icon: ListTodo },
    { id: 'finance', label: '账本收支', icon: Wallet },
    { id: 'ai-assistant', label: 'AI 饼托', icon: Bot },
    { id: 'settings', label: '烤箱设置', icon: Settings },
  ];

  return (
    <div className="hidden lg:flex w-64 bg-[#EDE9DF] border-r border-[#D6D2C4] h-screen flex-col sticky top-0 shadow-[1px_0_0_rgba(0,0,0,0.02)] transition-colors">
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#D4A373] text-[#FDFBF7] rounded-2xl shadow-lg rotate-3">
             <Cookie className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-[#2C332D]">画饼 HuaBing</span>
            <span className="text-[8px] text-[#7A8B7C] font-black uppercase tracking-[0.25em] mt-0.5">Baker's Studio</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all group ${
              activeTab === item.id 
                ? 'bg-[#FDFBF7] text-[#2C332D] font-bold shadow-sm scale-[1.02]' 
                : 'text-[#7A8B7C] hover:bg-[#FDFBF7]/40'
            }`}
          >
            <item.icon className={`w-4 h-4 transition-colors ${activeTab === item.id ? 'text-[#D4A373]' : 'text-[#A8A291]'}`} />
            <span className="text-[13px] tracking-tight font-medium">{item.label}</span>
            {activeTab === item.id && (
              <div className="ml-auto w-1.5 h-1.5 bg-[#D4A373] rounded-full shadow-[0_0_8px_rgba(212,163,115,0.4)]"></div>
            )}
          </button>
        ))}
      </nav>
      
      <div className="p-6 mt-auto">
        <div className="bg-[#E5E1D5] p-5 rounded-3xl border border-[#D6D2C4] relative overflow-hidden group">
          <Pizza className="absolute -right-2 -bottom-2 w-12 h-12 text-[#D6D2C4]/20 rotate-12 group-hover:scale-110 transition-transform" />
          <p className="text-[9px] font-black text-[#7A8B7C] uppercase tracking-widest mb-1.5">Oven Status</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#D4A373] rounded-full animate-ping"></div>
            <p className="text-[10px] text-[#2C332D] font-extrabold tracking-wide">烤箱预热中...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
