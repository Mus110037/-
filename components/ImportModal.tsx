
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Sparkles, Loader2, CheckCircle2, AlertCircle, Clipboard, MousePointerSquareDashed, Wand2, Edit3, FileSpreadsheet, FileJson } from 'lucide-react';
import { parseMihuashiScreenshot } from '../services/geminiService';
import { Order, OrderStatus } from '../types';
import * as XLSX from 'xlsx';

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
  const excelInputRef = useRef<HTMLInputElement>(null);

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
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
    
    if (isExcel) {
      processExcel(file);
      return;
    }

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

  const processExcel = (file: File) => {
    setLoading(true);
    setPreview(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // 智能映射 Excel 列名
        const mappedData = jsonData.map((row: any) => {
          const findKey = (keywords: string[]) => {
            const key = Object.keys(row).find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
            return key ? row[key] : null;
          };

          return {
            title: findKey(['名称', '标题', '项目', '企划', 'title', 'name']) || '未命名项目',
            totalPrice: parseFloat(findKey(['金额', '酬劳', '价格', 'price', 'cost', 'money'])) || 0,
            deadline: findKey(['日期', '截稿', '交付', '截止', 'deadline', 'date', 'time']) || new Date().toISOString().split('T')[0],
            progressDesc: findKey(['备注', '描述', '进度', 'desc', 'note']) || 'Excel 导入'
          };
        });

        setParsedData(mappedData);
      } catch (err) {
        alert('Excel 解析失败，请检查文件格式。');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const confirmImport = () => {
    const newOrders: Order[] = parsedData.map((item, idx) => ({
      id: `import-${Date.now()}-${idx}`,
      title: item.title,
      priority: '中',
      duration: 5,
      deadline: String(item.deadline).includes('-') ? item.deadline : new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
      version: 1,
      status: OrderStatus.PENDING,
      progressStage: '未开始',
      commissionType: '商用',
      personCount: '单人',
      artType: '插图',
      source: '批量导入',
      totalPrice: item.totalPrice,
      description: item.progressDesc,
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
            <div className="p-3 bg-[#3A5A40] text-white rounded-2xl shadow-lg"><Wand2 className="w-5 h-5" /></div>
            <div>
              <h3 className="text-xl font-bold text-[#2D3A30] tracking-tight">智能排单助手</h3>
              <p className="text-[10px] text-[#4F6D58] font-black uppercase tracking-widest mt-1">支持图片识别与 Excel 自动排单</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-all"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8 space-y-8">
          {(!preview && parsedData.length === 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:border-[#3A5A40] hover:bg-[#F2F4F0] transition-all cursor-pointer group"
              >
                <div className="p-4 bg-white shadow-md rounded-2xl group-hover:bg-[#3A5A40] group-hover:text-white transition-all">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-[#2D3A30]">图片识别</p>
                  <p className="text-[9px] text-slate-400 mt-1">粘贴或拖拽后台截图</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>

              <div 
                onClick={() => excelInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:border-[#3A5A40] hover:bg-[#F2F4F0] transition-all cursor-pointer group"
              >
                <div className="p-4 bg-white shadow-md rounded-2xl group-hover:bg-[#3A5A40] group-hover:text-white transition-all text-[#3A5A40]">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-[#2D3A30]">Excel/CSV 导入</p>
                  <p className="text-[9px] text-slate-400 mt-1">自动识别表头并排单</p>
                </div>
                <input type="file" ref={excelInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx,.xls,.csv" />
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              {preview && (
                <div className="relative h-40 rounded-3xl overflow-hidden border border-slate-200 shadow-inner group">
                  <img src={preview} className={`w-full h-full object-cover transition-all duration-700 ${loading ? 'blur-sm grayscale' : ''}`} />
                  {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#3A5A40]/10">
                      <Loader2 className="w-8 h-8 text-[#3A5A40] animate-spin mb-2" />
                      <p className="text-[10px] font-black text-[#2D3A30] tracking-widest uppercase">AI 分析中...</p>
                    </div>
                  )}
                </div>
              )}

              {loading && !preview && (
                 <div className="h-40 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-10 h-10 text-[#3A5A40] animate-spin" />
                    <p className="text-[10px] font-black text-[#2D3A30] tracking-widest uppercase">表格解析中...</p>
                 </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-[0.2em]">待导入列表 ({parsedData.length})</h4>
                </div>
                
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2.5 pr-2">
                  {parsedData.length > 0 ? (
                    parsedData.map((item, i) => (
                      <div key={i} className="group flex items-center gap-4 p-4 bg-[#F2F4F0] rounded-2xl border border-transparent hover:border-[#3A5A40] transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-black text-[#2D3A30] truncate">{item.title}</p>
                          <p className="text-[9px] text-[#4F6D58] font-medium mt-1">截止: {item.deadline}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-black text-[#2D3A30]">¥{item.totalPrice}</p>
                        </div>
                      </div>
                    ))
                  ) : !loading ? (
                    <div className="p-8 text-center bg-amber-50 rounded-2xl">
                      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                      <p className="text-xs font-bold text-amber-800">未发现有效数据。</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={handleReset} className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">取消</button>
                <button 
                  disabled={loading || parsedData.length === 0} 
                  onClick={confirmImport}
                  className="py-4 bg-[#2D3A30] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30"
                >
                  确认导入
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
