
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Sparkles, Loader2, CheckCircle2, AlertCircle, Clipboard, MousePointerSquareDashed, Wand2, Edit3 } from 'lucide-react';
import { parseMihuashiScreenshot } from '../services/geminiService';
import { Order, OrderStatus } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (orders: Order[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 监听全局粘贴事件
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen || loading) return;
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) processFile(blob);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, loading]);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setPreview(base64);
      setLoading(true);
      setParsedData([]);
      
      try {
        const results = await parseMihuashiScreenshot(base64);
        setParsedData(results);
      } catch (err) {
        console.error("解析失败", err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) processFile(file);
  };

  const confirmImport = () => {
    const newOrders: Order[] = parsedData.map((item, idx) => ({
      id: `ai-import-${Date.now()}-${idx}`,
      title: item.title || '未命名企划',
      priority: '中',
      duration: 5,
      deadline: item.deadline || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
      version: 1,
      status: OrderStatus.PENDING,
      progressStage: '未开始',
      commissionType: '商用',
      personCount: '单人',
      artType: '插图',
      source: '米画师',
      totalPrice: item.totalPrice || 0,
      description: `[AI 自动导入] 原始描述: ${item.progressDesc || '无'}`,
    }));
    
    onImport(newOrders);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setPreview(null);
    setParsedData([]);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#1B241D]/60 backdrop-blur-md animate-in fade-in duration-300" 
      onClick={onClose}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
    >
      <div 
        className={`bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-300 ${isDragging ? 'scale-105 border-4 border-dashed border-[#3A5A40]' : ''}`} 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#3A5A40] text-white rounded-2xl shadow-lg animate-pulse"><Wand2 className="w-5 h-5" /></div>
            <div>
              <h3 className="text-xl font-bold text-[#2D3A30] tracking-tight">AI 截图排单助手</h3>
              <p className="text-[10px] text-[#4F6D58] font-black uppercase tracking-widest mt-1">Paste, Drop or Upload</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-all"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8 space-y-8">
          {!preview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[16/9] border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 hover:border-[#3A5A40] hover:bg-[#F2F4F0] transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 opacity-50"></div>
              <div className="p-5 bg-white shadow-xl rounded-3xl text-slate-400 group-hover:scale-110 group-hover:bg-[#3A5A40] group-hover:text-white transition-all z-10">
                <MousePointerSquareDashed className="w-10 h-10" />
              </div>
              <div className="text-center z-10">
                <p className="text-base font-bold text-[#2D3A30]">点击、粘贴(Ctrl+V) 或 拖拽截图</p>
                <p className="text-[11px] text-[#4F6D58] mt-2 font-medium bg-[#EDF1EE] px-4 py-1 rounded-full border border-[#D1D9D3]">支持米画师、画加等后台截图</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              {/* 图片预览与扫描动效 */}
              <div className="relative h-56 rounded-3xl overflow-hidden border border-slate-200 shadow-inner group">
                <img src={preview} className={`w-full h-full object-cover transition-all duration-700 ${loading ? 'blur-sm grayscale' : ''}`} />
                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#3A5A40]/10">
                    {/* 扫描激光线 */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#A3B18A] to-transparent shadow-[0_0_15px_#A3B18A] animate-[scan_2s_linear_infinite]"></div>
                    <Loader2 className="w-10 h-10 text-[#3A5A40] animate-spin mb-4" />
                    <p className="text-sm font-black text-[#2D3A30] animate-pulse tracking-widest uppercase">AI 深度分析中...</p>
                  </div>
                )}
                {!loading && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" /> 识图完成
                  </div>
                )}
              </div>

              {/* 解析结果列表 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-[0.2em]">解析到的企划列表 ({parsedData.length})</h4>
                  {parsedData.length > 0 && <span className="text-[9px] text-slate-400 font-bold">点击条目可进行微调（开发中）</span>}
                </div>
                
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2.5 pr-2">
                  {parsedData.length > 0 ? (
                    parsedData.map((item, i) => (
                      <div key={i} className="group flex items-center gap-4 p-5 bg-[#F2F4F0] rounded-3xl border border-transparent hover:border-[#3A5A40] transition-all">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-[#3A5A40] font-black text-xs shadow-sm">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[13px] font-bold text-[#2D3A30] truncate">{item.title}</p>
                            <Edit3 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-[10px] text-[#4F6D58] font-medium">截止: <span className="font-bold">{item.deadline}</span> · 进度: {item.progressDesc}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] font-black text-[#2D3A30]">¥{item.totalPrice}</p>
                          <p className="text-[8px] text-[#4F6D58] font-black uppercase mt-1">CNY</p>
                        </div>
                      </div>
                    ))
                  ) : !loading ? (
                    <div className="p-8 text-center bg-amber-50 rounded-3xl border border-amber-100">
                      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                      <p className="text-xs font-bold text-amber-800">未能在截图中识别到有效的企划数据。</p>
                      <p className="text-[10px] text-amber-600 mt-1">请尝试上传包含 企划名称、金额、DDL 的清晰后台页面。</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={handleReset} className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">取消重来</button>
                <button 
                  disabled={loading || parsedData.length === 0} 
                  onClick={confirmImport}
                  className="py-4 bg-[#2D3A30] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> 确认加入排单库
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default ImportModal;
