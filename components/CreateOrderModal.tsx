
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, DollarSign, Tag, Clock, AlignLeft, Users, Palette, Share2, Activity, ShieldCheck, Trash2, Briefcase, User } from 'lucide-react';
import { Order, OrderStatus, PersonCount, ArtType, OrderSource, CommissionType, ProgressStage, STAGE_PROGRESS_MAP } from '../types';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  initialOrder?: Order | null;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onSave, onDelete, initialOrder }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    personCount: '单人' as PersonCount,
    artType: '头像' as ArtType,
    source: '米画师' as OrderSource,
    commissionType: '私用' as CommissionType,
    priority: '中' as '高' | '中' | '低',
    totalPrice: '',
    duration: '4',
    deadline: '',
    createdAt: '',
    progressStage: '未开始' as ProgressStage,
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
        progressStage: initialOrder.progressStage || '未开始',
        description: initialOrder.description
      });
    } else {
      setFormData({
        title: '',
        personCount: '单人',
        artType: '头像',
        source: '米画师',
        commissionType: '私用',
        priority: '中',
        totalPrice: '',
        duration: '4',
        deadline: '',
        createdAt: new Date().toISOString().split('T')[0], // 自动录入今天
        progressStage: '未开始',
        description: ''
      });
    }
  }, [initialOrder, isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const orderData: Order = {
      id: initialOrder ? initialOrder.id : `o-${Date.now()}`,
      title: formData.title,
      priority: formData.priority,
      duration: parseInt(formData.duration),
      deadline: formData.deadline,
      createdAt: formData.createdAt,
      status: formData.progressStage === '成稿' ? OrderStatus.COMPLETED : OrderStatus.PENDING,
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

  const personCounts: PersonCount[] = ['单人', '双人', '多人'];
  const artTypes: ArtType[] = ['头像', '胸像', '半身', '全身', '组合页'];
  const sources: OrderSource[] = ['米画师', 'QQ', '画加'];
  const stages: ProgressStage[] = ['未开始', '构图/动态', '色稿', '草稿', '线稿', '细化', '成稿'];

  const currentProgress = STAGE_PROGRESS_MAP[formData.progressStage];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{initialOrder ? '编辑企划详情' : '录入新企划'}</h2>
            {initialOrder && <p className="text-sm text-slate-500 mt-1 truncate max-w-md">正在修改: {initialOrder.title}</p>}
          </div>
          <div className="flex items-center gap-2">
            {initialOrder && onDelete && (
              <button 
                type="button"
                onClick={() => { if(confirm('确定要删除此企划吗？')) { onDelete(initialOrder.id); onClose(); } }}
                className="p-2 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-full transition-all"
                title="删除企划"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <Tag className="w-3 h-3" /> 稿件名称
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <Briefcase className="w-3 h-3" /> 用途分类
                </label>
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                  {['私用', '商用'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, commissionType: type as CommissionType })}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                        formData.commissionType === type 
                        ? 'bg-white text-violet-600 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <Share2 className="w-3 h-3" /> 来源平台
                </label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                  {sources.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, source: s })}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all ${
                        formData.source === s 
                        ? 'bg-white text-violet-600 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <Users className="w-3 h-3" /> 企划人数
                </label>
                <select 
                  className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white outline-none appearance-none"
                  value={formData.personCount}
                  onChange={e => setFormData({...formData, personCount: e.target.value as PersonCount})}
                >
                  {personCounts.map(pc => <option key={pc} value={pc}>{pc}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <DollarSign className="w-3 h-3" /> 总额 (元)
                </label>
                <input
                  required
                  type="number"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-mono"
                  value={formData.totalPrice}
                  onChange={e => setFormData({ ...formData, totalPrice: e.target.value })}
                />
                {(formData.source === '米画师' || formData.source === '画加') && (
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">扣手续费(5%)预计: ¥{(Number(formData.totalPrice) * 0.95).toFixed(0)}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <Calendar className="w-3 h-3" /> 截稿日期
                </label>
                <input
                  required
                  type="date"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all"
                  value={formData.deadline}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <Activity className="w-3 h-3" /> 项目进度 ({formData.progressStage})
                </label>
                <select 
                  className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white outline-none appearance-none"
                  value={formData.progressStage}
                  onChange={e => setFormData({...formData, progressStage: e.target.value as ProgressStage})}
                >
                  {stages.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                   <div 
                     className="h-full bg-violet-500 transition-all duration-500"
                     style={{ width: `${currentProgress}%` }}
                   />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                   优先级
                </label>
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                  {['低', '中', '高'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p as any })}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                        formData.priority === p 
                        ? 'bg-white text-violet-600 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              <AlignLeft className="w-3 h-3" /> 需求备注
            </label>
            <textarea
              rows={2}
              className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all resize-none text-sm"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-[2] px-6 py-4 rounded-2xl font-bold text-white bg-violet-600 shadow-lg shadow-violet-200 hover:bg-violet-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              {initialOrder ? '保存修改' : '确认建立企划'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal;
