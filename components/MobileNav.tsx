
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
    <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50 pointer-events-none">
      <div className="mx-auto max-w-md bg-[#FDFBF7]/90 backdrop-blur-xl border border-[#D6D2C4]/50 shadow-[0_8px_32px_rgba(45,58,48,0.12)] rounded-[2rem] px-2 py-2 flex justify-around items-center pointer-events-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-all duration-300 relative group ${
                isActive ? 'text-[#2D3A30]' : 'text-[#A8A291]'
              }`}
            >
              {/* 背景呼吸光晕 */}
              {isActive && (
                <div className="absolute inset-0 bg-[#A3B18A]/10 rounded-2xl animate-in fade-in zoom-in duration-300"></div>
              )}

              <div className={`relative transition-transform duration-300 ease-out ${isActive ? '-translate-y-1 scale-110' : 'group-active:scale-90'}`}>
                <item.icon 
                  className={`w-5 h-5 mb-1 transition-colors ${
                    isActive ? 'text-[#4B5E4F] stroke-[2.5px]' : 'text-[#A8A291]'
                  }`} 
                />
              </div>

              <span className={`text-[9px] font-black tracking-tighter uppercase transition-all duration-300 ${
                isActive ? 'opacity-100 translate-y-0' : 'opacity-60'
              }`}>
                {item.label}
              </span>

              {/* 激活指示点 */}
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-[#4B5E4F] rounded-full shadow-[0_0_8px_rgba(75,94,79,0.5)]"></div>
              )}
            </button>
          );
        })}
      </div>
      {/* 适配全面屏底部安全区空隙 */}
      <div className="h-safe-area-inset-bottom"></div>
    </div>
  );
};

export default MobileNav;
