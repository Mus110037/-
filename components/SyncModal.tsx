
import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Upload, CheckCircle2, Cloud, ChevronRight, Link2, Smartphone, History, ShieldAlert, Share2 } from 'lucide-react';
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

  // 环境检测
  const isSandboxed = window.self !== window.top;
  const supportsFileSystemAPI = 'showSaveFilePicker' in window;
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

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
    
    // 如果是 iOS 或不支持 API 的移动端
    if (!supportsFileSystemAPI) {
      const dataStr = JSON.stringify(orders, null, 2);
      
      // 优先尝试 iOS 的 Web Share API
      if (navigator.share) {
        try {
          const file = new File([dataStr], `艺策备份_${new Date().toISOString().split('T')[0]}.json`, { type: 'application/json' });
          await navigator.share({
            files: [file],
            title: '艺策数据备份',
            text: '存入网盘或文件 App'
          });
          showToastAndClose("已调起系统分享");
          return;
        } catch (e) {
          // 用户取消分享不报错
          if ((e as any).name !== 'AbortError') handleQuickExport();
          return;
        }
      }
      
      // 回退到普通下载
      handleQuickExport();
      return;
    }

    try {
      if (isSandboxed) throw new Error("SandboxRestricted");
      
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: 'artnexus_forest_sync.json',
        types: [{ description: 'ArtNexus Forest Sync', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(orders, null, 2));
      await writable.close();
      localStorage.setItem('artnexus_linked_file', 'true');
      showToastAndClose("已成功扎根！实时同步开启");
    } catch (err: any) {
      if (err.message === "SandboxRestricted" || err.name === "SecurityError") {
        setError({ title: "安全限制", msg: "在受限环境内，请使用下方的“一键导出”进行云端备份。" });
      } else if (err.name !== 'AbortError') {
        setError({ title: "关联失败", msg: "当前浏览器或系统版本不支持直接连接硬盘文件。" });
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
    showToastAndClose("备份种子已生成");
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
              <h2 className="text-xl font-bold text-[#2D3A30] tracking-tight">森之云同步</h2>
              <p className="text-[10px] text-[#4F6D58] font-black uppercase tracking-widest mt-1">Eco-Sync Center</p>
            </div>
          </div>
          <button onClick={onClose} className="group p-3 -mr-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all cursor-pointer"><X className="w-6 h-6" /></button>
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
            <h3 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-widest px-1">数据同步策略</h3>
            <button 
              onClick={handleLinkFile}
              className={`w-full flex items-center justify-between p-6 rounded-3xl transition-all group shadow-lg ${!supportsFileSystemAPI ? 'bg-[#4F6D58] text-white' : 'bg-[#2D3A30] text-white'}`}
            >
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                  {supportsFileSystemAPI ? <Link2 className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-bold text-sm tracking-tight">{supportsFileSystemAPI ? '深层关联网盘' : '一键备份至 iCloud/网盘'}</p>
                  <p className="text-[9px] text-white/60 mt-0.5 font-medium">
                    {supportsFileSystemAPI ? '建立实时读写连接，全自动保存修改' : 'iOS 专用：点击后存入您的 iCloud 文件夹'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 opacity-30 group-hover:translate-x-1" />
            </button>
          </div>

          <div className="h-px bg-[#E2E8E4]" />

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-widest px-1 flex items-center gap-2">
              <History className="w-3 h-3" /> 历史生长快照 (本地)
            </h3>
            <div className="space-y-2">
              {localBackups.length > 0 ? localBackups.map((snap, i) => (
                <button key={i} onClick={() => { onImportOrders?.(snap.data); showToastAndClose("已恢复至历史快照"); }} className="w-full flex items-center justify-between p-4 bg-white border border-[#E2E8E4] rounded-2xl hover:border-[#3A5A40] transition-all group text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D1D9D3] group-hover:bg-[#3A5A40]"></div>
                    <span className="text-[11px] font-bold text-slate-600">{snap.time}</span>
                    <span className="text-[9px] text-[#4F6D58]">({snap.data.length} 条数据)</span>
                  </div>
                  <span className="text-[9px] font-black text-[#3A5A40] opacity-0 group-hover:opacity-100">一键恢复</span>
                </button>
              )) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-[#D1D9D3]">
                  <p className="text-[10px] text-[#D1D9D3] font-bold uppercase tracking-widest">暂无记录，修改数据将自动生成</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
             <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white border border-[#E2E8E4] rounded-2xl text-[10px] font-bold text-[#4F6D58] hover:text-[#2D3A30] flex items-center justify-center gap-2">
                <Upload className="w-3 h-3" /> 载入本地
                <input type="file" ref={fileInputRef} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      onImportOrders?.(JSON.parse(ev.target?.result as string));
                      showToastAndClose("文件导入成功");
                    };
                    reader.readAsText(file);
                  }
                }} className="hidden" />
             </button>
             <button onClick={handleQuickExport} className="p-4 bg-white border border-[#E2E8E4] rounded-2xl text-[10px] font-bold text-[#4F6D58] hover:text-[#2D3A30] flex items-center justify-center gap-2">
                <Download className="w-3 h-3" /> 下载全量
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
