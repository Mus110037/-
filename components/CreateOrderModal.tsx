
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, DollarSign, AlignLeft, Users, Share2, Activity, ShieldCheck, Trash2, Zap, Brush, Layers } from 'lucide-react';
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
    source: settings.sources[0] || '',
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
        source: settings.sources[0] || '',
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

  const priorities: ('高' | '中' | '低')[] = ['高', '中', '低'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm" onClick={onClose}>
      <div ref={modalRef} className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-50 animate-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{initialOrder ? '编辑创作企划' : '开启新创作'}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Order Details Input</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-8">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-widest">企划名称</label>
                <input required className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-700" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-widest">艺术分类</label>
                <div className="flex flex-wrap gap-2">
                  {settings.artTypes.map(t => (
                    <button key={t} type="button" onClick={() => setFormData({ ...formData, artType: t })} className={`px-4 py-2 text-[10px] font-bold rounded-xl border transition-all ${formData.artType === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>{t}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-widest">企划人数规模</label>
                <div className="grid grid-cols-2 gap-2">
                  {settings.personCounts.map(t => (
                    <button key={t} type="button" onClick={() => setFormData({ ...formData, personCount: t })} className={`px-4 py-2.5 text-[10px] font-bold rounded-xl border transition-all ${formData.personCount === t ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200'}`}>{t}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-widest">优先级权重</label>
                <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                  {priorities.map(p => (
                    <button key={p} type="button" onClick={() => setFormData({ ...formData, priority: p })} className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all ${formData.priority === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>{p}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-widest">实收金额</label>
                  <input required type="number" className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white outline-none font-bold text-slate-900" value={formData.totalPrice} onChange={e => setFormData({ ...formData, totalPrice: e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-widest">接稿渠道</label>
                  <select className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white outline-none font-bold text-slate-600 appearance-none" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}>
                    {settings.sources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-widest">交付截止日期</label>
                <input required type="date" className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white outline-none font-bold text-slate-600" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-widest">当前创作进度</label>
                <select className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white outline-none font-bold text-slate-600 appearance-none" value={formData.progressStage} onChange={e => setFormData({ ...formData, progressStage: e.target.value })}>
                  {settings.stages.map(s => <option key={s.name} value={s.name}>{s.name} ({s.progress}%)</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase mb-3 tracking-widest">企划备注</label>
                <textarea rows={2} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white outline-none font-medium text-slate-500 text-[11px]" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="..." />
              </div>
            </div>
          </div>

          <div className="flex gap-5 pt-6">
            {initialOrder && onDelete && (
              <button type="button" onClick={() => { if(confirm('删除后无法找回，确定吗？')) { onDelete(initialOrder.id); onClose(); } }} className="px-8 py-5 rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 transition-all font-bold"><Trash2 className="w-5 h-5" /></button>
            )}
            <button type="submit" className="flex-1 px-8 py-5 rounded-2xl font-bold text-white bg-slate-900 shadow-xl shadow-slate-100 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5" /> {initialOrder ? '完成更新' : '开始排单'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal;
