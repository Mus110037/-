
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Sparkles, Loader2, CheckCircle2, AlertCircle, Clipboard, Wand2, FileSpreadsheet, Info, ChevronRight, AlertTriangle } from 'lucide-react';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

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

  const excelDateToJS = (serial: any) => {
    if (!serial) return new Date().toISOString().split('T')[0];
    if (typeof serial === 'string') {
      const parts = serial.split(/[-/.]/);
      if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      return serial;
    }
    if (typeof serial === 'number') {
      try {
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        return date_info.toISOString().split('T')[0];
      } catch (e) {
        return new Date().toISOString().split('T')[0];
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    setIsConfirming(false);
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
        setErrorMsg("AI 识别图片失败，请尝试上传 Excel。");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const processExcel = (file: File) => {
    setLoading(true);
    setPreview(null);
    setParsedData([]);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (rawRows.length === 0) {
          setErrorMsg("表格似乎是空的。");
          setLoading(false);
          return;
        }

        let headerRowIndex = -1;
        const keywords = ['企划', '金额', '日期', '截稿', '标题'];
        
        for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
          const row = rawRows[i];
          if (row && row.some(cell => cell && keywords.some(k => String(cell).includes(k)))) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          setErrorMsg("未识别到标准表头（需包含：企划、金额、截稿日期等）。");
          setLoading(false);
          return;
        }

        const headers = rawRows[headerRowIndex];
        const dataRows = rawRows.slice(headerRowIndex + 1);
        const findColIdx = (keys: string[]) => headers.findIndex(h => h && keys.some(k => String(h).trim().includes(k)));

        const colIdx = {
          title: findColIdx(['企划', '名称', '标题', '项目']),
          price: findColIdx(['金额', '酬劳', '价格', '实收']),
          deadline: findColIdx(['截稿日期', '日期', '截止', '交付']),
          createdAt: findColIdx(['加入企划时间', '创建时间']),
          personCount: findColIdx(['企划人数', '人数']),
          artType: findColIdx(['企划类型', '类型']),
          stage: findColIdx(['进度百分比', '进度', '状态']),
          source: findColIdx(['来源', '平台']),
          desc: findColIdx(['备注', '描述', '视觉进度条'])
        };

        const mappedData = dataRows
          .filter(row => row && row.length > 0 && (colIdx.title >= 0 ? row[colIdx.title] : true))
          .map(row => ({
            title: colIdx.title >= 0 ? row[colIdx.title] : '未命名企划',
            totalPrice: colIdx.price >= 0 ? (parseFloat(row[colIdx.price]) || 0) : 0,
            deadline: colIdx.deadline >= 0 ? excelDateToJS(row[colIdx.deadline]) : new Date().toISOString().split('T')[0],
            createdAt: colIdx.createdAt >= 0 ? excelDateToJS(row[colIdx.createdAt]) : new Date().toISOString().split('T')[0],
            personCount: colIdx.personCount >= 0 ? String(row[colIdx.personCount] || '单人') : '单人',
            artType: colIdx.artType >= 0 ? String(row[colIdx.artType] || '插图') : '插图',
            progressStage: colIdx.stage >= 0 ? String(row[colIdx.stage] || '未开始') : '未开始',
            source: colIdx.source >= 0 ? String(row[colIdx.source] || 'Excel') : 'Excel',
            progressDesc: colIdx.desc >= 0 ? String(row[colIdx.desc] || '') : ''
          }));

        if (mappedData.length === 0) {
          setErrorMsg("未能从表格中提取到有效数据。");
        } else {
          setParsedData(mappedData);
        }
      } catch (err) {
        setErrorMsg("文件读取失败。");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteImport = () => {
    if (parsedData.length === 0) return;
    
    const newOrders: Order[] = parsedData.map((item, idx) => ({
      id: `import-${Date.now()}-${idx}`,
      title: item.title,
      priority: '中',
      duration: 5,
      deadline: item.deadline,
      createdAt: item.createdAt,
      updatedAt: new Date().toISOString(),
      version: 1,
      status: (item.progressStage === '成稿' || item.progressStage === '100%') ? OrderStatus.COMPLETED : OrderStatus.PENDING,
      progressStage: item.progressStage,
      commissionType: '商用',
      personCount: item.personCount,
      artType: item.artType,
      source: item.source,
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
    setErrorMsg(null);
    setIsConfirming(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (excelInputRef.current) excelInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#1B241D]/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className={`bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-300 ${isDragging ? 'scale-105 border-4 border-dashed border-[#3A5A40]' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#3A5A40] text-white rounded-2xl shadow-lg"><Wand2 className="w-5 h-5" /></div>
            <div>
              <h3 className="text-xl font-bold text-[#2D3A30] tracking-tight">排单助手</h3>
              <p className="text-[10px] text-[#4F6D58] font-black uppercase tracking-widest mt-1">支持 Excel 导入与图片识别</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-all"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8 space-y-8">
          {(!preview && parsedData.length === 0 && !loading && !errorMsg) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:border-[#3A5A40] hover:bg-[#F2F4F0] transition-all cursor-pointer group">
                <div className="p-4 bg-white shadow-md rounded-2xl group-hover:bg-[#3A5A40] group-hover:text-white transition-all"><Camera className="w-8 h-8" /></div>
                <div className="text-center px-4">
                  <p className="text-xs font-bold text-[#2D3A30]">截图识别</p>
                  <p className="text-[9px] text-slate-400 mt-1">粘贴或拖拽后台截图</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" accept="image/*" />
              </div>
              <div onClick={() => excelInputRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:border-[#3A5A40] hover:bg-[#F2F4F0] transition-all cursor-pointer group">
                <div className="p-4 bg-white shadow-md rounded-2xl group-hover:bg-[#3A5A40] group-hover:text-white transition-all text-[#3A5A40]"><FileSpreadsheet className="w-8 h-8" /></div>
                <div className="text-center px-4">
                  <p className="text-xs font-bold text-[#2D3A30]">Excel/CSV 导入</p>
                  <p className="text-[9px] text-slate-400 mt-1">智能匹配并全量载入</p>
                </div>
                <input type="file" ref={excelInputRef} onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" accept=".xlsx,.xls,.csv" />
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {loading && (
                 <div className="h-48 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 text-[#3A5A40] animate-spin" />
                    <p className="text-[10px] font-black text-[#2D3A30] tracking-widest uppercase">数据解析构建中...</p>
                 </div>
              )}

              {errorMsg && (
                 <div className="p-10 text-center bg-rose-50 rounded-[2rem] border border-rose-100">
                    <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
                    <p className="text-xs font-bold text-rose-800 leading-relaxed">{errorMsg}</p>
                    <button onClick={handleReset} className="mt-6 px-8 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">重试</button>
                 </div>
              )}

              {parsedData.length > 0 && !loading && (
                <div className="space-y-6">
                  {!isConfirming ? (
                    <>
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-[0.2em]">待载入项 ({parsedData.length})</h4>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg"><Info className="w-3 h-3 text-amber-600" /><span className="text-[8px] text-amber-700 font-black">覆盖模式</span></div>
                      </div>
                      <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                        {parsedData.map((item, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-[#F2F4F0] rounded-2xl border border-transparent hover:border-[#3A5A40] transition-all">
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-black text-[#2D3A30] truncate">{item.title}</p>
                              <p className="text-[8px] text-[#4F6D58] font-bold mt-1 uppercase">截止: {item.deadline} · {item.progressStage}</p>
                            </div>
                            <div className="text-right"><p className="text-[14px] font-black text-[#2D3A30]">¥{item.totalPrice.toLocaleString()}</p></div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleReset} className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-100">取消</button>
                        <button onClick={() => setIsConfirming(true)} className="py-4 bg-[#2D3A30] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">下一步 <ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center space-y-6 animate-in zoom-in duration-300">
                      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2"><AlertTriangle className="w-10 h-10 text-amber-500" /></div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">确认重置工作区？</h4>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">载入操作将<span className="text-rose-600 font-bold">永久删除</span>当前设备上的所有企划数据，并替换为 Excel/截图中的内容。</p>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <button onClick={handleExecuteImport} className="py-5 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-rose-200 active:scale-95 transition-all">确认并全量载入</button>
                        <button onClick={() => setIsConfirming(false)} className="py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">返回修改</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
