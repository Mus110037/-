
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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-100 pb-safe z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
              activeTab === item.id ? 'text-violet-700' : 'text-slate-400'
            }`}
          >
            <item.icon className={`w-5 h-5 mb-1 transition-transform ${activeTab === item.id ? 'scale-110' : ''}`} />
            <span className="text-[9px] font-black tracking-tighter uppercase">{item.label}</span>
            {activeTab === item.id && (
              <div className="absolute -top-1 w-6 h-1 bg-violet-700 rounded-b-full shadow-[0_4px_10px_rgba(109,40,217,0.4)]"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;
