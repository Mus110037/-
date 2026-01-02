
import React from 'react';
import { LayoutDashboard, Calendar, ListTodo, Wallet, Bot } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: '概览' },
    { id: 'calendar', icon: Calendar, label: '日历' },
    { id: 'orders', icon: ListTodo, label: '企划' },
    { id: 'finance', icon: Wallet, label: '财务' },
    { id: 'ai-assistant', icon: Bot, label: 'AI' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 pb-safe z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === item.id ? 'text-violet-600 scale-110' : 'text-slate-400'
            }`}
          >
            <item.icon className={`w-5 h-5 mb-1 ${activeTab === item.id ? 'fill-violet-50/50' : ''}`} />
            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
            {activeTab === item.id && (
              <div className="absolute top-0 w-8 h-1 bg-violet-600 rounded-b-full shadow-[0_0_10px_rgba(124,58,237,0.3)]"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;
