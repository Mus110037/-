
import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Upload, CheckCircle2, Cloud, ChevronRight, Link2, Smartphone, History, ShieldAlert, Share, Trash2 } from 'lucide-react';
import { Order } from '../types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onImportOrders?: (orders: Order[], merge: boolean) => void;
}

const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, orders, onImportOrders }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [error, setError] = useState<{title: string, msg: string} | null>(null);
  const [localBackups, setLocalBackups] = useState<any[]>([]);
  const fileHandleRef = useRef<any>(null);

  const supportsFileSystemAPI = 'showSaveFilePicker' in window;
  const supportsShare = typeof navigator.share !== 'undefined';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('artnexus_auto_snapshots');
      if (saved) setLocalBackups(JSON.parse(saved).reverse());
    }
  }, [isOpen]);

  const showToastAndClose = (msg: string) => {
    setLastAction(msg);
    setTimeout(() => { setLastAction(null); onClose(); }, 1500);
  };

  // 生成精确的文件名
  const generateFileName = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0].replace(/-/g, '');
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
    return `artnexus_backup_${date}_${time}.json`;
  };

  const handleLinkFile = async () => {
    if (!supportsFileSystemAPI) {
      if (supportsShare) handleMobileShare();
      else handleQuickExport();
      return;
    }
    // ... PC端的 FileSystemHandle 逻辑保持不变
  };

  const handleMobileShare = async () => {
    const dataStr = JSON.stringify(orders, null, 2);
    const fileName = generateFileName();
    const file = new File([dataStr], fileName, { type: 'application/json' });

    try {
      await navigator.share({
        files: [file],
        title: '艺策备份',
        text: `版本: ${new Date().toLocaleString()}`
      });
      showToastAndClose("已导出，请选择“存储到文件”");
    } catch (err) {
      handleQuickExport();
    }
  };

  const handleQuickExport = () => {
    const dataStr = JSON.stringify(orders, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFileName();
    link.click();
    showToastAndClose("副本已准备下载");
  };

  const clearSnapshots = () => {
    if (confirm("确定清除所有本地历史快照吗？(不影响文件备份)")) {
      localStorage.removeItem('artnexus_auto_snapshots');
      setLocalBackups([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1B241D]/70 backdrop-blur-md" onClick={onClose}>
      <div className="bg-[#FDFDFB] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-[#E2E8E4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#3A5A40] text-white"><Cloud className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-bold text-[#2D3A30]">同步与备份</h2>
              <p className="text-[10px] text-[#4F6D58] font-black uppercase tracking-widest mt-1">Data & Snapshots</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {lastAction && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {lastAction}
            </div>
          )}

          <div className="space-y-4">
             <div className="flex justify-between items-end px-1">
               <h3 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-widest">外部云端存取</h3>
               {isMobile && <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">iOS 模式</span>}
             </div>
             
             <button onClick={handleLinkFile} className="w-full flex items-center justify-between p-6 bg-[#2D3A30] text-white rounded-3xl hover:opacity-90 transition-all shadow-xl group">
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-white/10 rounded-2xl"><Share className="w-5 h-5" /></div>
                  <div>
                    <p className="font-bold text-sm">备份至 iCloud/网盘</p>
                    <p className="text-[9px] text-white/50 mt-0.5">iOS 会生成新副本，请保留最新一份</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 opacity-30 group-hover:translate-x-1" />
             </button>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-widest flex items-center gap-2">
                <History className="w-3 h-3" /> 本地历史快照 (内部闪回)
              </h3>
              {localBackups.length > 0 && (
                <button onClick={clearSnapshots} className="text-[9px] font-bold text-red-400 hover:text-red-600 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> 清除
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {localBackups.length > 0 ? localBackups.slice(0, 5).map((snap, i) => (
                <div key={i} className="group relative">
                  <button onClick={() => { onImportOrders?.(snap.data, false); showToastAndClose("已从快照恢复"); }} className="w-full flex items-center justify-between p-4 bg-white border border-[#E2E8E4] rounded-2xl hover:border-[#3A5A40] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A]"></div>
                      <span className="text-[11px] font-bold text-slate-600">{snap.time}</span>
                      <span className="text-[9px] text-slate-400">({snap.data.length} 条企划)</span>
                    </div>
                    <span className="text-[9px] font-black text-[#3A5A40] opacity-0 group-hover:opacity-100 uppercase">立即闪回</span>
                  </button>
                </div>
              )) : (
                <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">尚无自动保存记录</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
             <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center justify-center gap-2">
                <Upload className="w-3 h-3" /> 载入备份
                <input type="file" ref={fileInputRef} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                       try {
                         const data = JSON.parse(ev.target?.result as string);
                         const merge = confirm("检测到已有数据，是否与当前数据【合并】？\n取消则会【完全替换】现有内容。");
                         onImportOrders?.(data, merge);
                         showToastAndClose(merge ? "已合并数据" : "已替换数据");
                       } catch(e) { alert("格式无效"); }
                    };
                    reader.readAsText(file);
                  }
                }} className="hidden" />
             </button>
             <button onClick={handleQuickExport} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center justify-center gap-2">
                <Download className="w-3 h-3" /> 仅下载副本
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
