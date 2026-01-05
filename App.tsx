
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import CalendarView from './components/CalendarView';
import FinanceView from './components/FinanceView';
import CreateOrderModal from './components/CreateOrderModal';
import SyncModal from './components/SyncModal';
import SettingsView from './components/SettingsView';
import ImportModal from './components/ImportModal';
import { Order, OrderStatus, DEFAULT_STAGES, DEFAULT_SOURCES, DEFAULT_ART_TYPES, DEFAULT_PERSON_COUNTS, SAMPLE_ORDERS, AppSettings } from './types';
import { Sparkles, BrainCircuit, Plus, FileSpreadsheet, Wand2, HelpCircle, ArrowRight, Loader2 } from 'lucide-react';
import { getSchedulingInsights, getFinancialInsights, getFullAIAnalysis } from './services/geminiService';
import { marked } from 'marked';

const STORAGE_KEY = 'artnexus_orders_v5';
const SETTINGS_KEY = 'artnexus_settings_v5';
const PRIORITY_IDS_KEY = 'artnexus_priority_ids_v5';
const ONBOARDING_KEY = 'artnexus_onboarding_done';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : SAMPLE_ORDERS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    const defaultSettings: AppSettings = { 
      stages: DEFAULT_STAGES, 
      sources: DEFAULT_SOURCES,
      artTypes: DEFAULT_ART_TYPES,
      personCounts: DEFAULT_PERSON_COUNTS,
      showAiUI: true,
    };
    try {
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  });
  
  const [priorityOrderIds, setPriorityOrderIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(PRIORITY_IDS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [schedulingInsights, setSchedulingInsights] = useState<string>("");
  const [financeInsights, setFinanceInsights] = useState<string>("");
  const [orderListInsights, setOrderListInsights] = useState<string>("");
  const [fullAiAnalysis, setFullAiAnalysis] = useState<string>("");

  const [isSchedulingAiLoading, setIsSchedulingAiLoading] = useState(false);
  const [isFinanceAiLoading, setIsFinanceAiLoading] = useState(false);
  const [isOrderListAiLoading, setIsOrderListAiLoading] = useState(false);
  const [isFullAiLoading, setIsFullAiLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showGuide, setShowGuide] = useState(() => !localStorage.getItem(ONBOARDING_KEY));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(PRIORITY_IDS_KEY, JSON.stringify(priorityOrderIds));
  }, [priorityOrderIds]);

  useEffect(() => {
    const loadInsights = async () => {
      if (!settings.showAiUI || orders.length === 0) {
        setSchedulingInsights("");
        setFinanceInsights("");
        setOrderListInsights("");
        return;
      }
      
      if (activeTab === 'dashboard') {
        setIsSchedulingAiLoading(true);
        try {
          const text = await getSchedulingInsights(orders);
          setSchedulingInsights(text);
        } catch (error) {
          setSchedulingInsights("暂时无法生成见解。");
        } finally {
          setIsSchedulingAiLoading(false);
        }
      } else if (activeTab === 'finance') {
        setIsFinanceAiLoading(true);
        try {
          const text = await getFinancialInsights(orders);
          setFinanceInsights(text);
        } catch (error) {
          setFinanceInsights("暂时无法生成财务见解。");
        } finally {
          setIsFinanceAiLoading(false);
        }
      } else if (activeTab === 'orders') {
        setIsOrderListAiLoading(true);
        try {
          const text = await getSchedulingInsights(orders);
          setOrderListInsights(text);
        } catch (error) {
          setOrderListInsights("暂时无法生成见解。");
        } finally {
          setIsOrderListAiLoading(false);
        }
      }
    };
    loadInsights();
  }, [orders, activeTab, settings.showAiUI]);

  const handleDismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    setOrders(prev => prev.map(order => {
      const oldStageIdx = settings.stages.findIndex(s => s.name === order.progressStage);
      if (oldStageIdx !== -1 && newSettings.stages[oldStageIdx]) {
        const newStageName = newSettings.stages[oldStageIdx].name;
        if (newStageName !== order.progressStage) {
          return { ...order, progressStage: newStageName };
        }
      }
      return order;
    }));
  };

  const handleSaveOrder = (newOrder: Order) => {
    setOrders(prev => {
      const orderWithVersion = { ...newOrder, updatedAt: new Date().toISOString(), version: (newOrder.version || 0) + 1 };
      const exists = prev.some(o => o.id === newOrder.id);
      if (exists) {
        return prev.map(o => o.id === newOrder.id ? orderWithVersion : o);
      } else {
        return [...prev, { ...orderWithVersion, createdAt: new Date().toISOString().split('T')[0] }];
      }
    });
    setEditingOrder(null);
    if (showGuide) handleDismissGuide();
  };

  const handleDeleteOrder = (id: string) => {
    setOrders(prev => {
      const filtered = prev.filter(o => o.id !== id);
      console.log("执行删除:", id, "剩余:", filtered.length);
      return [...filtered];
    });
    setPriorityOrderIds(prev => prev.filter(pid => pid !== id));
  };

  const handleImportOrders = (newOrders: Order[], mode: 'append' | 'merge' | 'replace' = 'merge') => {
    console.log(`执行数据导入: ${mode}, 导入数: ${newOrders.length}`);
    
    if (mode === 'replace') {
      // 全量替换时，先写入存储再更新状态，确保万无一失
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
      localStorage.setItem(PRIORITY_IDS_KEY, JSON.stringify([]));
      setOrders([...newOrders]);
      setPriorityOrderIds([]);
      
      // 弹出轻提示建议刷新，或者直接强制渲染
      setTimeout(() => {
        alert("同步数据已成功加载。");
      }, 500);
    } else if (mode === 'append') {
      setOrders(prev => [...prev, ...newOrders]);
    } else {
      setOrders(prev => {
        const existingIds = new Set(prev.map(o => o.id));
        const added = newOrders.filter(o => !existingIds.has(o.id));
        return [...prev, ...added];
      });
    }
    if (showGuide) handleDismissGuide();
  };

  const handleImportSettings = (importedSettings: AppSettings) => {
    if (importedSettings && importedSettings.stages) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(importedSettings));
      setSettings({ ...importedSettings });
    }
  };

  const handleStartEdit = (order: Order) => {
    setEditingOrder(order);
    setIsCreateModalOpen(true);
  };

  const handleGenerateFullAiAnalysis = useCallback(async () => {
    if (orders.length === 0) return;
    setIsFullAiLoading(true);
    try {
      const analysis = await getFullAIAnalysis(orders);
      setFullAiAnalysis(marked.parse(analysis));
    } catch (error) {
      setFullAiAnalysis("生成报告失败，请重试。");
    } finally {
      setIsFullAiLoading(false);
    }
  }, [orders]);

  return (
    <div className="flex min-h-screen bg-[#EAE4D7] text-[#2C332D]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-8 pb-24 lg:pb-10 overflow-y-auto custom-scrollbar">
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-[#2D3A30] truncate tracking-tight uppercase">
              {activeTab === 'dashboard' ? 'Overview' : activeTab === 'calendar' ? 'Schedule' : activeTab === 'orders' ? 'Projects' : activeTab === 'finance' ? 'Finance' : 'Settings'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 relative">
            <button onClick={() => setIsImportModalOpen(true)} className="hidden md:flex items-center gap-2 px-5 py-3 bg-[#FDFBF7] text-[#4B5E4F] border border-[#D6D2C4] rounded-xl hover:bg-[#EDE9DF] transition-all group card-baked-shadow">
              <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="font-bold text-[11px] uppercase tracking-widest">排单助手</span>
            </button>
            <button onClick={() => setIsSyncModalOpen(true)} className="flex items-center justify-center gap-2 px-3 py-3 md:px-5 bg-[#FDFBF7] text-[#4B5E4F] border border-[#D6D2C4] rounded-xl hover:bg-slate-50 transition-all card-baked-shadow">
              <FileSpreadsheet className="w-4 h-4" /> 
              <span className="hidden md:inline font-bold text-[11px] uppercase tracking-widest">同步中心</span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsCreateModalOpen(true)} 
                className="p-3 bg-[#4B5E4F] text-white border border-[#4B5E4F] rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" /> 
              </button>
              
              {showGuide && (
                <div className="absolute top-14 right-0 z-[100] animate-in slide-in-from-top-4 duration-700">
                  <div className="bg-[#2D3A30] text-white px-5 py-4 rounded-xl card-baked-shadow min-w-[200px] relative">
                    <div className="absolute -top-1.5 right-4 w-3 h-3 bg-[#2D3A30] rotate-45"></div>
                    <div className="flex items-start gap-3">
                      <HelpCircle className="w-4 h-4 text-[#B2B7A5] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest mb-1">新手引导</p>
                        <p className="text-[10px] text-white/70 leading-relaxed">开启您的第一个创作企划。</p>
                        <button 
                          onClick={handleDismissGuide}
                          className="mt-3 text-[9px] font-black text-[#A3B18A] hover:text-white uppercase tracking-widest flex items-center gap-1"
                        >
                          我知道了 <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard 
          orders={orders} 
          priorityOrderIds={priorityOrderIds} 
          onUpdatePriorityIds={setPriorityOrderIds} 
          onEditOrder={handleStartEdit} 
          onUpdateOrder={handleSaveOrder} 
          settings={settings} 
          onQuickAdd={() => setIsCreateModalOpen(true)} 
          schedulingInsights={schedulingInsights}
          isSchedulingAiLoading={isSchedulingAiLoading}
        />}
        {activeTab === 'calendar' && <CalendarView orders={orders} onEditOrder={handleStartEdit} settings={settings} />}
        {activeTab === 'orders' && <OrderList 
          orders={orders} 
          onEditOrder={handleStartEdit} 
          onDeleteOrder={handleDeleteOrder} 
          onUpdateOrder={handleSaveOrder} 
          settings={settings} 
          orderListInsights={orderListInsights} 
          isAiLoading={isOrderListAiLoading} 
        />}
        {activeTab === 'finance' && <FinanceView 
          orders={orders} 
          settings={settings} 
          financeInsights={financeInsights} 
          isAiLoading={isFinanceAiLoading} 
        />}
        {activeTab === 'settings' && <SettingsView 
          settings={settings} 
          setSettings={handleUpdateSettings} 
          fullAiAnalysis={fullAiAnalysis}
          isFullAiLoading={isFullAiLoading}
          onGenerateFullAiAnalysis={handleGenerateFullAiAnalysis}
          ordersLength={orders.length}
        />}
      </main>

      <CreateOrderModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingOrder(null); }} onSave={handleSaveOrder} onDelete={handleDeleteOrder} initialOrder={editingOrder} settings={settings} />
      <SyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} orders={orders} settings={settings} onImportOrders={handleImportOrders} onImportSettings={handleImportSettings} />
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={(newOnes) => handleImportOrders(newOnes, 'merge')} />
    </div>
  );
};

export default App;
