
import React from 'react';
import { LayoutDashboard, Calendar, ListTodo, Wallet, Palette, Bot, Settings, Moon, Sun } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isDarkMode, setIsDarkMode }) => {
  const menuItems = [
    { id: 'dashboard', label: '工作台概览', icon: LayoutDashboard },
    { id: 'calendar', label: '创作日历', icon: Calendar },
    { id: 'orders', label: '企划库', icon: ListTodo },
    { id: 'finance', label: '财务看板', icon: Wallet },
    { id: 'ai-assistant', label: 'AI 创意助手', icon: Bot },
    { id: 'settings', label: '自定义工作区', icon: Settings },
  ];

  return (
    <div className="hidden lg:flex w-64 bg-white dark:bg-[#14171C] border-r border-[#E0DDD5] dark:border-[#2D3139] h-screen flex-col sticky top-0 shadow-[1px_0_0_rgba(0,0,0,0.02)] transition-colors">
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#A3B18A] dark:bg-[#A3B18A] text-white rounded-xl shadow-sm">
             <Palette className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-[#333333] dark:text-[#E0E0E0]">艺策 ArtNexus</span>
            <span className="text-[8px] text-[#8E8B82] dark:text-[#8E9AAF] font-bold uppercase tracking-[0.2em] mt-0.5">Zen Workspace</span>
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
                ? 'bg-[#F5F5F0] dark:bg-[#1A1D23] text-[#333333] dark:text-[#E0E0E0] font-bold shadow-sm' 
                : 'text-[#8E8B82] dark:text-[#8E9AAF] hover:bg-[#F5F5F0]/80 dark:hover:bg-[#1A1D23]/50'
            }`}
          >
            <item.icon className={`w-4 h-4 transition-colors ${activeTab === item.id ? 'text-[#A3B18A]' : 'text-[#D9D5CB] dark:text-[#2D3139]'}`} />
            <span className="text-[13px] tracking-tight">{item.label}</span>
            {activeTab === item.id && (
              <div className="ml-auto w-1.5 h-1.5 bg-[#A3B18A] rounded-full shadow-[0_0_8px_rgba(163,177,138,0.4)]"></div>
            )}
          </button>
        ))}
      </nav>
      
      <div className="p-6 mt-auto space-y-4">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F5F5F0] dark:bg-[#1A1D23] text-[#8E8B82] dark:text-[#8E9AAF] hover:text-[#333333] dark:hover:text-[#E0E0E0] transition-all border border-[#E0DDD5] dark:border-[#2D3139]"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="text-[12px] font-bold">{isDarkMode ? '浅色模式' : '深色主题'}</span>
        </button>

        <div className="bg-[#EAE8E0] dark:bg-[#0A0C0E] p-5 rounded-2xl border border-[#D9D5CB] dark:border-[#2D3139]">
          <p className="text-[9px] font-black text-[#8E8B82] dark:text-[#8E9AAF] uppercase tracking-widest mb-1.5">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#A3B18A] rounded-full animate-pulse"></div>
            <p className="text-[10px] text-[#8E8B82] dark:text-[#8E9AAF] font-medium">侘寂模式激活</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
