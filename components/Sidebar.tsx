
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
    <div className="hidden lg:flex w-64 bg-white border-r border-[#E0DDD5] h-screen flex-col sticky top-0 shadow-[1px_0_0_rgba(0,0,0,0.01)] transition-colors">
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#A3B18A] text-white rounded-xl shadow-sm">
             <Palette className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-[#2D2D2A]">艺策 ArtNexus</span>
            <span className="text-[8px] text-[#8E8B82] font-black uppercase tracking-[0.25em] mt-0.5">Zen Workspace</span>
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
                ? 'bg-[#F5F5F0] text-[#2D2D2A] font-bold shadow-sm' 
                : 'text-[#8E8B82] hover:bg-[#F5F5F0]/60'
            }`}
          >
            <item.icon className={`w-4 h-4 transition-colors ${activeTab === item.id ? 'text-[#A3B18A]' : 'text-[#D9D5CB]'}`} />
            <span className="text-[13px] tracking-tight font-medium">{item.label}</span>
            {activeTab === item.id && (
              <div className="ml-auto w-1.5 h-1.5 bg-[#A3B18A] rounded-full shadow-[0_0_8px_rgba(163,177,138,0.4)]"></div>
            )}
          </button>
        ))}
      </nav>
      
      <div className="p-6 mt-auto">
        <div className="bg-[#EAE8E0] p-5 rounded-2xl border border-[#D9D5CB]">
          <p className="text-[9px] font-black text-[#8E8B82] uppercase tracking-widest mb-1.5">Creative Vibe</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#A3B18A] rounded-full animate-pulse shadow-[0_0_5px_rgba(163,177,138,0.5)]"></div>
            <p className="text-[10px] text-[#4A4944] font-extrabold tracking-wide">同步状态：云端实时就绪</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
