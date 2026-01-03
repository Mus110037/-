
import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Upload, CheckCircle2, Cloud, ChevronRight, Share, Trash2, GitMerge, FileText, Info, Copy, ClipboardPaste, Zap } from 'lucide-react';
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
  const [showClipboardInput, setShowClipboardInput] = useState(false);
  const [clipboardValue, setClipboardValue] = useState('');

  const supportsShare = typeof navigator.share !== 'undefined';

  const showToastAndClose = (msg: string) => {
    setLastAction(msg);
    setTimeout(() => { setLastAction(null); onClose(); }, 1500);
  };

  const generateFileName = () => `ArtNexus_Master.json`;

  const handleExport = async () => {
    if (supportsShare) {
      const dataStr = JSON.stringify(orders, null, 2);
      const file = new File([dataStr], generateFileName(), { type: 'application/json' });
      try {
        await navigator.share({ files: [file], title: '艺策数据备份' });
        showToastAndClose("已发起备份");
      } catch (err) {
        handleDownloadOnly();
      }
    } else {
      handleDownloadOnly();
    }
  };

  const handleDownloadOnly = () => {
    const dataStr = JSON.stringify(orders, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFileName();
    link.click();
    showToastAndClose("副本已下载");
  };

  const handleCopyToClipboard = () => {
    const dataStr = JSON.stringify(orders);
    const encoded = btoa(encodeURIComponent(dataStr));
    navigator.clipboard.writeText(`ARTNEXUS:${encoded}`).then(() => {
      alert("同步口令已存入剪贴板！\n\n您现在可以直接去另一台设备点击“口令导入”，无需操作文件。");
    });
  };

  const handlePasteFromClipboard = () => {
    if (!clipboardValue.startsWith('ARTNEXUS:')) {
      alert("无效的同步口令");
      return;
    }
    try {
      const encoded = clipboardValue.replace('ARTNEXUS:', '');
      const dataStr = decodeURIComponent(atob(encoded));
      const data = JSON.parse(dataStr);
      onImportOrders?.(data, true);
      showToastAndClose("口令融合成功！");
      setClipboardValue('');
      setShowClipboardInput(false);
    } catch (e) {
      alert("解析口令失败");
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
              <h2 className="text-xl font-bold text-[#2D3A30]">同步中心</h2>
              <p className="text-[10px] text-[#4F6D58] font-black uppercase tracking-widest mt-1">iOS Multi-Sync Hub</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {lastAction && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {lastAction}
            </div>
          )}

          {/* 方案 A：剪贴板闪传（无文件） */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-widest px-1 flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-500" /> 方案 A：剪贴板闪传（推荐）
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCopyToClipboard} className="flex flex-col items-center gap-2 p-5 bg-amber-50 border border-amber-200 rounded-3xl hover:bg-amber-100 transition-all group">
                <Copy className="w-5 h-5 text-amber-600" />
                <span className="text-[10px] font-bold text-amber-900">生成同步口令</span>
              </button>
              <button onClick={() => setShowClipboardInput(!showClipboardInput)} className="flex flex-col items-center gap-2 p-5 bg-white border border-slate-200 rounded-3xl hover:border-amber-400 transition-all group">
                <ClipboardPaste className="w-5 h-5 text-slate-400 group-hover:text-amber-600" />
                <span className="text-[10px] font-bold text-slate-600">粘贴口令导入</span>
              </button>
            </div>
            
            {showClipboardInput && (
              <div className="p-4 bg-[#F2F4F0] rounded-2xl space-y-3 animate-in slide-in-from-top-2">
                <textarea 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-[10px] font-medium focus:border-amber-500 outline-none" 
                  rows={3} 
                  placeholder="在此粘贴另一台设备生成的口令..."
                  value={clipboardValue}
                  onChange={e => setClipboardValue(e.target.value)}
                />
                <button onClick={handlePasteFromClipboard} className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest">开始融合</button>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-100" />

          {/* 方案 B：传统文件备份 */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-widest px-1">方案 B：iCloud 文件备份</h3>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={handleExport} className="w-full flex items-center justify-between p-5 bg-[#2D3A30] text-white rounded-3xl hover:opacity-95 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/10 rounded-xl"><Share className="w-4 h-4" /></div>
                  <span className="font-bold text-xs">生成备份文件</span>
                </div>
                <Download className="w-4 h-4 opacity-30" />
              </button>

              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between p-5 bg-white border border-slate-200 text-[#2D3A30] rounded-3xl hover:border-[#3A5A40] transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-[#F2F4F0] rounded-xl text-[#3A5A40]"><Upload className="w-4 h-4" /></div>
                  <span className="font-bold text-xs">载入文件并融合</span>
                </div>
                <input type="file" ref={fileInputRef} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                       try {
                         const data = JSON.parse(ev.target?.result as string);
                         onImportOrders?.(data, true);
                         showToastAndClose("融合成功");
                       } catch(e) { alert("文件格式错误"); }
                    };
                    reader.readAsText(file);
                  }
                }} className="hidden" />
              </button>
            </div>
          </div>

          {/* 清理建议卡片 */}
          <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Trash2 className="w-4 h-4" />
              <p className="text-[10px] font-black uppercase tracking-wider">存储清理建议</p>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500">
              若您已完成“口令闪传”或“文件融合”，代表当前设备数据已是最新。您可以放心前往 iOS“文件”App，将所有旧的 <code className="bg-slate-200 px-1 rounded">.json</code> 备份一次性删除，保持文件夹整洁。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
