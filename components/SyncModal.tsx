
import React, { useState, useRef } from 'react';
import { X, FileSpreadsheet, Download, Upload, FileText, CheckCircle2, AlertCircle, Share, ChevronRight, Cloud } from 'lucide-react';
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

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(orders, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `ArtNexus_Backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast("备份文件已下载至本地");
  };

  const handleExportCSV = () => {
    const headers = ['标题', '优先级', '金额', '来源', '截止日期', '分类', '进度', '备注'];
    const rows = orders.map(o => [
      o.title, o.priority, o.totalPrice, o.source, o.deadline, o.artType, o.progressStage,
      `"${o.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ArtNexus_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    showToast("Excel 表格已生成");
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json) && onImportOrders) {
          onImportOrders(json);
          showToast(`成功恢复 ${json.length} 条企划数据！`);
        }
      } catch (err) {
        alert("文件解析失败，请确保选择了正确的 .json 备份文件。");
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
        
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-violet-50 text-violet-600">
              <Share className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">数据同步与备份</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Local Backup & Cloud Sync</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-300 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {lastAction && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold">{lastAction}</span>
            </div>
          )}

          {/* 网盘同步指南 */}
          <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100">
             <div className="flex items-center gap-2 mb-2 text-indigo-700">
               <Cloud className="w-4 h-4" />
               <span className="text-[11px] font-black uppercase tracking-wider">半自动网盘同步指南</span>
             </div>
             <p className="text-[11px] text-indigo-900/70 leading-relaxed font-medium">
               1. 点击下方按钮<b>导出备份</b>，并保存到手机/电脑的<b>网盘同步文件夹</b>（如 iCloud/OneDrive）。<br/>
               2. 在另一台设备打开网盘，将该文件<b>下载/同步</b>到本地。<br/>
               3. 在本窗口点击<b>从备份文件恢复</b>，即可实现数据互通。
             </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">手动导出</h3>
            <button 
              onClick={handleExportJSON}
              className="w-full flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl hover:border-violet-300 hover:bg-violet-50/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-100 text-violet-600 rounded-2xl group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <Download className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 text-sm tracking-tight">导出备份 (.json)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">推荐：配合网盘实现跨端互通</p>
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
                  <p className="font-bold text-slate-900 text-sm tracking-tight">导出 Excel 表格 (.csv)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">用于财务对账或离线查看</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          </div>

          <div className="h-px bg-slate-50" />

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
                <p className="font-bold text-slate-600 text-sm tracking-tight">从备份文件恢复</p>
                <p className="text-[10px] text-slate-400 mt-0.5">选择您从网盘同步的 .json 文件</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
