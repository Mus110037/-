
import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Upload, CheckCircle2, Cloud, ChevronRight, Link2, Smartphone, History, ShieldAlert, Share } from 'lucide-react';
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
  const [error, setError] = useState<{title: string, msg: string} | null>(null);
  const [localBackups, setLocalBackups] = useState<any[]>([]);
  const fileHandleRef = useRef<any>(null);

  // 环境检测
  const isSandboxed = window.self !== window.top;
  const supportsFileSystemAPI = 'showSaveFilePicker' in window;
  const supportsShare = typeof navigator.share !== 'undefined';
  
  // 优化移动端检测，包含 iPadOS (iPadOS 经常伪装成 MacIntel 但支持多点触控)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // 监听全局自动保存事件
  useEffect(() => {
    const handleAutoSave = async (e: any) => {
      if (fileHandleRef.current) {
        try {
          const writable = await fileHandleRef.current.createWritable();
          await writable.write(JSON.stringify(e.detail, null, 2));
          await writable.close();
          console.log("Auto-saved to file");
        } catch (err) {
          console.error("Auto-save failed", err);
        }
      }
    };
    window.addEventListener('artnexus_auto_save', handleAutoSave);
    return () => window.removeEventListener('artnexus_auto_save', handleAutoSave);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('artnexus_auto_snapshots');
      if (saved) setLocalBackups(JSON.parse(saved).reverse().slice(0, 3));
    }
  }, [isOpen]);

  const showToastAndClose = (msg: string) => {
    setLastAction(msg);
    setTimeout(() => { setLastAction(null); onClose(); }, 1500);
  };

  const handleLinkFile = async () => {
    setError(null);
    
    // 如果是手机/iPad端或不支持 FileSystem API
    if (!supportsFileSystemAPI) {
      if (supportsShare) {
        handleMobileShare();
      } else {
        handleQuickExport();
      }
      return;
    }

    try {
      if (isSandboxed) throw new Error("SandboxRestricted");
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{ description: '艺策数据文件', accept: { 'application/json': ['.json'] } }],
        multiple: false
      });

      const file = await handle.getFile();
      const content = await file.text();
      if (content && onImportOrders) {
        try {
          onImportOrders(JSON.parse(content));
        } catch (e) {
          console.warn("File content invalid");
        }
      }

      fileHandleRef.current = handle;
      localStorage.setItem('artnexus_linked_active', 'true');
      showToastAndClose("文件已关联并同步最新内容");
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError({ title: "关联失败", msg: "无法建立连接。由于系统安全限制，移动端/iPad 请使用一键备份功能。" });
      }
    }
  };

  // 针对 iOS/iPadOS 的优化：一键分享/存入 iCloud
  const handleMobileShare = async () => {
    const dataStr = JSON.stringify(orders, null, 2);
    const fileName = `artnexus_backup_${new Date().toISOString().split('T')[0]}.json`;
    const file = new File([dataStr], fileName, { type: 'application/json' });

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '艺策企划备份',
          text: '这是您的最新企划排期备份文件。'
        });
        showToastAndClose("已开启分享菜单");
      } else {
        // 如果不支持文件分享，尝试分享文本（备选方案）
        handleQuickExport();
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        handleQuickExport(); // 回退到普通下载
      }
    }
  };

  const handleQuickExport = () => {
    const dataStr = JSON.stringify(orders, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `artnexus_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToastAndClose("备份文件已准备下载");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1B241D]/70 backdrop-blur-md" onClick={onClose}>
      <div className="bg-[#FDFDFB] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-[#E2E8E4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#3A5A40] text-white">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2D3A30] tracking-tight">同步与备份</h2>
              <p className="text-[10px] text-[#4F6D58] font-black uppercase tracking-widest mt-1">Data & Sync Settings</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-[#2D3A30] rounded-full transition-all"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4 text-amber-800">
              <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0 text-amber-600" />
              <div className="space-y-1">
                <p className="text-[12px] font-black">{error.title}</p>
                <p className="text-[10px] leading-relaxed opacity-80">{error.msg}</p>
              </div>
            </div>
          )}

          {lastAction && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {lastAction}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-widest px-1">云端/本地存储</h3>
            <button 
              onClick={handleLinkFile}
              className={`w-full flex items-center justify-between p-6 rounded-3xl transition-all group shadow-lg ${!supportsFileSystemAPI ? 'bg-[#3A5A40] text-white' : 'bg-[#2D3A30] text-white'}`}
            >
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-white/20 rounded-2xl">
                  {supportsFileSystemAPI ? <Link2 className="w-5 h-5" /> : <Share className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-bold text-sm tracking-tight">
                    {supportsFileSystemAPI ? '关联本地文件 (PC推荐)' : '一键分享至 iCloud/文件'}
                  </p>
                  <p className="text-[9px] text-white/60 mt-0.5 font-medium">
                    {supportsFileSystemAPI ? '开启时自动读取最新文件' : '支持 iPhone/iPad，点击后选“存储到文件”'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 opacity-30 group-hover:translate-x-1" />
            </button>
          </div>

          <div className="h-px bg-[#E2E8E4]" />

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-widest px-1 flex items-center gap-2">
              <History className="w-3 h-3" /> 历史快照
            </h3>
            <div className="space-y-2">
              {localBackups.length > 0 ? localBackups.map((snap, i) => (
                <button key={i} onClick={() => { onImportOrders?.(snap.data); showToastAndClose("已载入历史快照"); }} className="w-full flex items-center justify-between p-4 bg-white border border-[#E2E8E4] rounded-2xl hover:border-[#3A5A40] transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D1D9D3] group-hover:bg-[#3A5A40]"></div>
                    <span className="text-[11px] font-bold text-slate-600">{snap.time}</span>
                    <span className="text-[9px] text-[#4F6D58]">({snap.data.length} 条记录)</span>
                  </div>
                  <span className="text-[9px] font-black text-[#3A5A40] opacity-0 group-hover:opacity-100">立即恢复</span>
                </button>
              )) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-[#D1D9D3]">
                  <p className="text-[10px] text-[#D1D9D3] font-bold uppercase tracking-widest">暂无本地记录</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
             <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white border border-[#E2E8E4] rounded-2xl text-[10px] font-bold text-[#4F6D58] hover:text-[#2D3A30] flex items-center justify-center gap-2">
                <Upload className="w-3 h-3" /> 导入备份
                <input type="file" ref={fileInputRef} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                       try {
                         onImportOrders?.(JSON.parse(ev.target?.result as string));
                         showToastAndClose("导入成功");
                       } catch(e) {
                         alert("文件格式有误");
                       }
                    };
                    reader.readAsText(file);
                  }
                }} className="hidden" />
             </button>
             <button onClick={handleQuickExport} className="p-4 bg-white border border-[#E2E8E4] rounded-2xl text-[10px] font-bold text-[#4F6D58] hover:text-[#2D3A30] flex items-center justify-center gap-2">
                <Download className="w-3 h-3" /> 下载副本
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
