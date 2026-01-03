
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, DollarSign, AlignLeft, Users, ShieldCheck, Trash2, Zap, Brush, Layers, Activity, Star } from 'lucide-react';
import { Order, OrderStatus, CommissionType, AppSettings } from '../types';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  initialOrder?: Order | null;
  settings: AppSettings;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onSave, onDelete, initialOrder, settings }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    personCount: settings.personCounts[0] || '',
    artType: settings.artTypes[0] || '',
    source: settings.sources[0]?.name || '',
    commissionType: '私用' as CommissionType,
    priority: '中' as '高' | '中' | '低',
    totalPrice: '',
    duration: '4',
    deadline: '',
    createdAt: '',
    progressStage: settings.stages[0]?.name || '',
    description: ''
  });

  useEffect(() => {
    if (initialOrder) {
      setFormData({
        title: initialOrder.title,
        personCount: initialOrder.personCount,
        artType: initialOrder.artType,
        source: initialOrder.source,
        commissionType: initialOrder.commissionType || '私用',
        priority: initialOrder.priority,
        totalPrice: initialOrder.totalPrice.toString(),
        duration: initialOrder.duration.toString(),
        deadline: initialOrder.deadline,
        createdAt: initialOrder.createdAt,
        progressStage: initialOrder.progressStage,
        description: initialOrder.description
      });
    } else {
      setFormData({
        title: '',
        personCount: settings.personCounts[0] || '',
        artType: settings.artTypes[0] || '',
        source: settings.sources[0]?.name || '',
        commissionType: '私用',
        priority: '中',
        totalPrice: '',
        duration: '4',
        deadline: '',
        createdAt: new Date().toISOString().split('T')[0],
        progressStage: settings.stages[0]?.name || '',
        description: ''
      });
    }
  }, [initialOrder, isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stage = settings.stages.find(s => s.name === formData.progressStage);
    const orderData: Order = {
      id: initialOrder ? initialOrder.id : `o-${Date.now()}`,
      title: formData.title,
      priority: formData.priority,
      duration: parseInt(formData.duration),
      deadline: formData.deadline,
      createdAt: formData.createdAt,
      status: (stage?.progress === 100) ? OrderStatus.COMPLETED : OrderStatus.PENDING,
      progressStage: formData.progressStage,
      commissionType: formData.commissionType,
      personCount: formData.personCount,
      artType: formData.artType,
      source: formData.source,
      totalPrice: parseInt(formData.totalPrice) || 0,
      description: formData.description,
    };
    onSave(orderData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div ref={modalRef} className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
        <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase">{initialOrder ? '编辑创作企划' : '开启新创作'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-300 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6 md:space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 md:gap-y-8">
            <div className="space-y-6 md:space-y-8">
              {/* 企划名称 */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2.5 flex items-center gap-2 tracking-widest">企划名称</label>
                <input required className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-900" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>

              {/* 艺术分类 */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2.5 tracking-widest">艺术分类</label>
                <div className="flex flex-wrap gap-2">
                  {settings.artTypes.map(t => (
                    <button key={t} type="button" onClick={() => setFormData({ ...formData, artType: t })} className={`px-4 py-2 text-[10px] font-bold rounded-xl border transition-all ${formData.artType === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>{t}</button>
                  ))}
                </div>
              </div>

              {/* 优先级 - 恢复功能 */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2.5 tracking-widest flex items-center gap-2">
                  优先级
                  <Star className="w-3 h-3" />
                </label>
                <div className="flex gap-2">
                  {(['高', '中', '低'] as const).map(p => (
                    <button 
                      key={p} 
                      type="button" 
                      onClick={() => setFormData({ ...formData, priority: p })}
                      className={`flex-1 py-2.5 rounded-xl border font-bold text-[10px] transition-all ${
                        formData.priority === p 
                          ? (p === '高' ? 'bg-red-50 border-red-200 text-red-600 shadow-sm' : p === '中' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-100 border-slate-200 text-slate-600')
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* 金额 */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2.5 tracking-widest">金额 (CNY)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input required type="number" className="w-full pl-10 pr-5 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none font-bold text-slate-900" value={formData.totalPrice} onChange={e => setFormData({ ...formData, totalPrice: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8">
              {/* 接稿渠道 */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2.5 tracking-widest">接稿渠道</label>
                <select className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none font-bold text-slate-900 appearance-none" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}>
                  {settings.sources.map(s => <option key={s.name} value={s.name}>{s.name} (费率 {s.fee}%)</option>)}
                </select>
              </div>

              {/* 创作进度 - 恢复功能 */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2.5 tracking-widest flex items-center gap-2">
                  当前进度阶段
                  <Activity className="w-3 h-3" />
                </label>
                <select 
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none font-bold text-slate-900 appearance-none" 
                  value={formData.progressStage} 
                  onChange={e => setFormData({ ...formData, progressStage: e.target.value })}
                >
                  {settings.stages.map(s => <option key={s.name} value={s.name}>{s.name} ({s.progress}%)</option>)}
                </select>
              </div>

              {/* 交付日期 */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2.5 tracking-widest">交付日期</label>
                <input required type="date" className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none font-bold text-slate-900" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
              </div>

              {/* 备注信息 */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2.5 tracking-widest">备注信息</label>
                <textarea rows={3} className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none font-medium text-slate-700 text-[11px] resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="输入额外要求..." />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 md:pt-6">
            {initialOrder && onDelete && (
              <button type="button" onClick={() => { if(confirm('确定删除此企划吗？此操作无法撤销。')) { onDelete(initialOrder.id); onClose(); } }} className="px-6 py-4 rounded-xl bg-slate-50 text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all font-bold border border-slate-100"><Trash2 className="w-5 h-5" /></button>
            )}
            <button type="submit" className="flex-1 px-8 py-4 rounded-xl font-bold text-white bg-slate-900 shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5" /> {initialOrder ? '完成更新' : '开始排单'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal;
