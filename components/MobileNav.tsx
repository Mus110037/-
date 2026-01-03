
import React from 'react';
import { LayoutDashboard, Calendar, ListTodo, Wallet, Settings } from 'lucide-react';

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
    { id: 'settings', icon: Settings, label: '设置' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-200 pb-safe z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around items-center h-16 px-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
              activeTab === item.id ? 'text-slate-900 font-bold' : 'text-slate-400'
            }`}
          >
            <item.icon className={`w-5 h-5 mb-1 transition-transform ${activeTab === item.id ? 'scale-110 text-[#A3B18A]' : ''}`} />
            <span className="text-[9px] font-bold tracking-tighter uppercase">{item.label}</span>
            {activeTab === item.id && (
              <div className="absolute -top-0 w-8 h-0.5 bg-slate-900 rounded-full"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;
