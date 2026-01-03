
import React, { useState, useRef } from 'react';
import { X, Camera, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseMihuashiScreenshot } from '../services/geminiService';
import { Order, OrderStatus, DEFAULT_STAGES } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (orders: Order[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setPreview(base64);
      setLoading(true);
      
      const results = await parseMihuashiScreenshot(base64);
      setParsedData(results);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const mapProgressToStage = (desc: string): string => {
    if (desc.includes('线稿')) return '线稿';
    if (desc.includes('草稿')) return '草稿';
    if (desc.includes('色稿')) return '色稿';
    if (desc.includes('细化')) return '细化';
    if (desc.includes('成稿') || desc.includes('100%')) return '成稿';
    return '未开始';
  };

  const confirmImport = () => {
    // Fix: Added missing 'version' and 'updatedAt' properties to comply with the Order interface.
    const newOrders: Order[] = parsedData.map((item, idx) => ({
      id: `mihuashi-${Date.now()}-${idx}`,
      title: item.title,
      priority: '中',
      duration: 5,
      deadline: item.deadline,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
      version: 1,
      status: OrderStatus.PENDING,
      progressStage: mapProgressToStage(item.progressDesc),
      commissionType: '商用',
      personCount: '单人',
      artType: '插图',
      source: '米画师',
      totalPrice: item.totalPrice,
      description: `从米画师截图自动导入。原始进度：${item.progressDesc}`,
    }));
    
    onImport(newOrders);
    onClose();
    setPreview(null);
    setParsedData([]);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#3A5A40] text-white rounded-xl"><Sparkles className="w-4 h-4" /></div>
            <h3 className="font-bold text-slate-900 uppercase tracking-tight">米画师企划智能同步</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-all"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-8 space-y-6">
          {!preview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:border-[#3A5A40] hover:bg-slate-50 transition-all cursor-pointer group"
            >
              <div className="p-4 bg-slate-100 rounded-full text-slate-400 group-hover:bg-[#3A5A40] group-hover:text-white transition-all">
                <Camera className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">点击上传米画师后台截图</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">支持识别企划标题、DDL 与金额</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative h-48 rounded-2xl overflow-hidden border border-slate-200">
                <img src={preview} className="w-full h-full object-cover blur-[2px] opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-[#3A5A40] animate-spin" />
                      <p className="text-xs font-bold text-[#3A5A40] animate-pulse">AI 正在阅读截图信息...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="text-xs font-bold text-emerald-600">识别完成</p>
                    </div>
                  )}
                </div>
              </div>

              {parsedData.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {parsedData.map((item, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate">{item.title}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">DDL: {item.deadline} · {item.progressDesc}</p>
                      </div>
                      <p className="text-[11px] font-black text-slate-900 shrink-0">¥{item.totalPrice}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {!loading && parsedData.length === 0 && (
                 <div className="p-4 bg-amber-50 text-amber-700 rounded-xl flex items-center gap-3 text-[11px] font-medium border border-amber-100">
                    <AlertCircle className="w-4 h-4" /> 未能在图片中识别到清晰的企划列表。
                 </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setPreview(null); setParsedData([]); }} className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-100">重新上传</button>
                <button 
                  disabled={loading || parsedData.length === 0} 
                  onClick={confirmImport}
                  className="py-4 bg-[#3A5A40] text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-xl disabled:opacity-50"
                >
                  确认加入排期
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
