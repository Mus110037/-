
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
    { id: 'ai-assistant', label: 'AI 助手', icon: Bot },
    { id: 'settings', label: '设置', icon: Settings },
  ];

  return (
    <div className="hidden lg:flex w-64 bg-white border-r border-[#E2E8E4] h-screen flex-col sticky top-0 shadow-[1px_0_0_rgba(0,0,0,0.01)] transition-colors">
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#3A5A40] text-white rounded-xl shadow-md">
             <Palette className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-[#2D3A30]">艺策 ArtNexus</span>
            <span className="text-[8px] text-[#4F6D58] font-black uppercase tracking-[0.25em] mt-0.5">Management Pro</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all group ${
              activeTab === item.id 
                ? 'bg-[#F2F4F0] text-[#1B241D] font-bold shadow-sm' 
                : 'text-[#4F6D58] hover:bg-[#F2F4F0]/60'
            }`}
          >
            <item.icon className={`w-4 h-4 transition-colors ${activeTab === item.id ? 'text-[#3A5A40]' : 'text-[#D1D9D3]'}`} />
            <span className="text-[13px] tracking-tight font-medium">{item.label}</span>
            {activeTab === item.id && (
              <div className="ml-auto w-1.5 h-1.5 bg-[#3A5A40] rounded-full shadow-[0_0_8px_rgba(58,90,64,0.4)]"></div>
            )}
          </button>
        ))}
      </nav>
      
      <div className="p-6 mt-auto">
        <div className="bg-[#EDF1EE] p-5 rounded-2xl border border-[#D1D9D3]">
          <p className="text-[9px] font-black text-[#4F6D58] uppercase tracking-widest mb-1.5">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#3A5A40] rounded-full animate-pulse"></div>
            <p className="text-[10px] text-[#2D3A30] font-extrabold tracking-wide">云同步就绪</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
