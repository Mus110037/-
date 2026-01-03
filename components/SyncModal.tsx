
import React, { useState, useRef } from 'react';
import { X, FileSpreadsheet, Download, Upload, FileText, CheckCircle2, AlertCircle, Info, ChevronRight, Share } from 'lucide-react';
import { Order } from '../types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onImportOrders?: (orders: Order[]) => void;
}

const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, orders, onImportOrders }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // 1. 导出 JSON (用于恢复数据)
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(orders, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `艺策备份_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast("JSON 备份文件已下载");
  };

  // 2. 导出 CSV (用于 Excel 查看)
  const handleExportCSV = () => {
    const headers = ['标题', '优先级', '金额', '来源', '截止日期', '分类', '进度', '备注'];
    const rows = orders.map(o => [
      o.title,
      o.priority,
      o.totalPrice,
      o.source,
      o.deadline,
      o.artType,
      o.progressStage,
      `"${o.description.replace(/"/g, '""')}"` // 包装备注防止逗号错位
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n"); // \uFEFF 解决 Excel 中文乱码
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `我的排单表_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    showToast("Excel 表格已生成");
  };

  // 3. 导入恢复
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json) && onImportOrders) {
          onImportOrders(json);
          showToast(`成功恢复 ${json.length} 条企划！`);
        }
      } catch (err) {
        alert("文件解析失败，请确保选择了正确的备份文件。");
      }
    };
    reader.readAsText(file);
  };

  const showToast = (msg: string) => {
    setLastAction(msg);
    setTimeout(() => setLastAction(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-violet-50 text-violet-600">
              <Share className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">生成本地备份</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Local Export & Restore</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-8 space-y-6">
          {lastAction && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold">{lastAction}</span>
            </div>
          )}

          {/* 导出选项 */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">数据导出</h3>
            
            <button 
              onClick={handleExportJSON}
              className="w-full flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl hover:border-violet-300 hover:bg-violet-50/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-100 text-violet-600 rounded-2xl group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <Download className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 text-sm">导出系统备份 (.json)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">用于在此网页或其他设备恢复所有数据</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>

            <button 
              onClick={handleExportCSV}
              className="w-full flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 text-sm">导出 Excel 表格 (.csv)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">方便电脑查看、打印或离线记账</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          </div>

          <div className="h-px bg-slate-100" />

          {/* 恢复选项 */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">数据恢复</h3>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-4 p-5 bg-slate-50 border border-dashed border-slate-200 rounded-3xl hover:bg-slate-100 transition-all group"
            >
              <div className="p-3 bg-white text-slate-400 rounded-2xl group-hover:text-violet-600 transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-600 text-sm">从备份文件恢复</p>
                <p className="text-[10px] text-slate-400 mt-0.5">选择您之前导出的 .json 文件</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
            </button>
          </div>

          <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
             <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
             <div className="text-[11px] text-amber-700 leading-relaxed">
               <b>温馨提示：</b>艺策目前采用本地存储。为了确保数据万无一失，建议您每周点击一次“导出系统备份”并保存在手机或电脑里。
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
