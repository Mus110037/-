
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Sparkles, Loader2, CheckCircle2, AlertCircle, Clipboard, MousePointerSquareDashed, Wand2, Edit3, FileSpreadsheet, FileJson, Info } from 'lucide-react';
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
      // 处理类似 "2026-1-2" 的字符串
      const parts = serial.split(/[-/]/);
      if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      return serial;
    }
    if (typeof serial === 'number') {
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return date_info.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
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
        setErrorMsg("AI 识别图片失败，请尝试上传 Excel 或手动录入。");
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
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 使用 header: 1 获取原始二维数组，以支持非首行表头
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (rawRows.length === 0) {
          setErrorMsg("表格似乎是空的。");
          setLoading(false);
          return;
        }

        // 寻找表头行
        let headerRowIndex = -1;
        const keywords = ['企划', '金额', '日期', '截稿', '标题'];
        
        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (row.some(cell => typeof cell === 'string' && keywords.some(k => cell.includes(k)))) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          setErrorMsg("未能在 Excel 中找到识别标志（如：企划、金额、截稿日期）。请检查表头名称。");
          setLoading(false);
          return;
        }

        const headers = rawRows[headerRowIndex];
        const dataRows = rawRows.slice(headerRowIndex + 1);

        const findColIdx = (keys: string[]) => {
          return headers.findIndex(h => typeof h === 'string' && keys.some(k => h.trim().includes(k)));
        };

        const colIdx = {
          title: findColIdx(['企划', '名称', '标题', '项目']),
          price: findColIdx(['金额', '酬劳', '价格', '实收']),
          deadline: findColIdx(['截稿日期', '日期', '截止', '交付']),
          createdAt: findColIdx(['加入企划时间', '创建时间', '时间']),
          personCount: findColIdx(['企划人数', '人数']),
          artType: findColIdx(['企划类型', '类型']),
          stage: findColIdx(['进度百分比', '进度', '状态']),
          source: findColIdx(['来源', '平台']),
          desc: findColIdx(['备注', '描述', '视觉进度条'])
        };

        const mappedData = dataRows
          .filter(row => row.length > 0 && (row[colIdx.title] || row[colIdx.price])) // 至少要有标题或金额
          .map(row => ({
            title: row[colIdx.title] || '未命名项目',
            totalPrice: parseFloat(row[colIdx.price]) || 0,
            deadline: excelDateToJS(row[colIdx.deadline]),
            createdAt: excelDateToJS(row[colIdx.createdAt]),
            personCount: row[colIdx.personCount] || '单人',
            artType: row[colIdx.artType] || '插图',
            progressStage: row[colIdx.stage] || '未开始',
            source: row[colIdx.source] || 'Excel导入',
            progressDesc: row[colIdx.desc] || ''
          }));

        if (mappedData.length === 0) {
          setErrorMsg("解析成功但未提取到有效行，请确保表格内有内容。");
        } else {
          setParsedData(mappedData);
        }
      } catch (err) {
        setErrorMsg("文件读取失败，请确保上传的是有效的 Excel 或 CSV 文件。");
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg("文件读取发生错误。");
      setLoading(false);
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
    if (parsedData.length === 0) return;
    
    if(confirm(`确定载入这 ${parsedData.length} 个企划吗？\n注意：这将完全清空并替换当前工作区的数据。`)) {
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
    }
  };

  const handleReset = () => {
    setPreview(null);
    setParsedData([]);
    setLoading(false);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (excelInputRef.current) excelInputRef.current.value = '';
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
          {(!preview && parsedData.length === 0 && !loading && !errorMsg) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:border-[#3A5A40] hover:bg-[#F2F4F0] transition-all cursor-pointer group"
              >
                <div className="p-4 bg-white shadow-md rounded-2xl group-hover:bg-[#3A5A40] group-hover:text-white transition-all">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="text-center px-4">
                  <p className="text-xs font-bold text-[#2D3A30]">截图识别</p>
                  <p className="text-[9px] text-slate-400 mt-1">粘贴或拖拽米画师/后台截图</p>
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
                <div className="text-center px-4">
                  <p className="text-xs font-bold text-[#2D3A30]">Excel/CSV 导入</p>
                  <p className="text-[9px] text-slate-400 mt-1">智能匹配表头并载入数据</p>
                </div>
                <input type="file" ref={excelInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx,.xls,.csv" />
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              {loading && (
                 <div className="h-40 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-10 h-10 text-[#3A5A40] animate-spin" />
                    <p className="text-[10px] font-black text-[#2D3A30] tracking-widest uppercase">解析并构建计划中...</p>
                 </div>
              )}

              {errorMsg && (
                 <div className="p-10 text-center bg-rose-50 rounded-[2rem] border border-rose-100">
                    <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
                    <p className="text-xs font-bold text-rose-800 leading-relaxed">{errorMsg}</p>
                    <button onClick={handleReset} className="mt-6 px-6 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">重新尝试</button>
                 </div>
              )}

              {parsedData.length > 0 && !loading && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-[0.2em]">解析完成 ({parsedData.length} 项)</h4>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg">
                      <Info className="w-3 h-3 text-amber-600" />
                      <span className="text-[8px] text-amber-700 font-black uppercase">全量替换模式</span>
                    </div>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2.5 pr-2">
                    {parsedData.map((item, i) => (
                      <div key={i} className="group flex items-center gap-4 p-4 bg-[#F2F4F0] rounded-2xl border border-transparent hover:border-[#3A5A40] transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-black text-[#2D3A30] truncate">{item.title}</p>
                          <div className="flex gap-2 mt-1.5">
                             <span className="text-[8px] text-[#4F6D58] font-black uppercase bg-white/70 px-2 py-0.5 rounded border border-slate-200 shadow-sm">截止: {item.deadline}</span>
                             <span className="text-[8px] text-[#3A5A40] font-black uppercase bg-[#3A5A40]/5 px-2 py-0.5 rounded border border-[#3A5A40]/10 shadow-sm">{item.progressStage}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] font-black text-[#2D3A30]">¥{item.totalPrice.toLocaleString()}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{item.source}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button onClick={handleReset} className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200">返回重选</button>
                    <button 
                      onClick={confirmImport}
                      className="py-4 bg-[#2D3A30] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> 确认载入并清空旧项
                    </button>
                  </div>
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
