
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Download, Upload, CheckCircle2, Cloud, ChevronRight, Link2, AlertTriangle, Smartphone, History, ShieldAlert } from 'lucide-react';
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

  // 环境检测：是否处于受限的 iframe 沙盒中
  const isSandboxed = window.self !== window.top;

  // 键盘 Esc 退出逻辑
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      // 加载本地自动快照
      const saved = localStorage.getItem('artnexus_auto_snapshots');
      if (saved) setLocalBackups(JSON.parse(saved).reverse().slice(0, 3));
    }
  }, [isOpen]);

  const showToastAndClose = (msg: string) => {
    setLastAction(msg);
    // 操作成功后延迟自动关闭，提升体验
    setTimeout(() => {
      setLastAction(null);
      onClose();
    }, 1500);
  };

  const handleLinkFile = async () => {
    setError(null);
    try {
      if (isSandboxed) {
        throw new Error("SandboxRestricted");
      }

      const handle = await (window as any).showSaveFilePicker({
        suggestedName: 'artnexus_sync.json',
        types: [{ description: 'ArtNexus 实时同步文件', accept: { 'application/json': ['.json'] } }],
      });
      
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(orders, null, 2));
      await writable.close();
      
      localStorage.setItem('artnexus_linked_file', 'true');
      showToastAndClose("已关联网盘！正在实时同步...");
    } catch (err: any) {
      if (err.message === "SandboxRestricted" || err.name === "SecurityError") {
        setError({
          title: "环境限制",
          msg: "由于当前处于安全沙盒，请使用下方的“一键存入网盘”或“手动备份”。"
        });
      } else if (err.name !== 'AbortError') {
        setError({ title: "关联失败", msg: "浏览器拒绝了访问请求。" });
      }
    }
  };

  const handleQuickExport = async () => {
    const dataStr = JSON.stringify(orders, null, 2);
    
    // 手机端/支持分享的环境尝试 Web Share API
    if (!isSandboxed && navigator.share && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      try {
        const file = new File([dataStr], `artnexus_sync.json`, { type: 'application/json' });
        await navigator.share({ files: [file], title: 'ArtNexus 同步', text: '存入网盘文件夹' });
        showToastAndClose("已调起系统分享");
        return;
      } catch (e) {}
    }
    
    // 下载回退方案
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `artnexus_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToastAndClose("备份文件已开始下载");
  };

  const restoreSnapshot = (snapshotOrders: Order[]) => {
    if (onImportOrders) {
      onImportOrders(snapshotOrders);
      showToastAndClose("数据已恢复至选定版本");
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md transition-all duration-300" 
      onClick={onClose}
    >
      <div 
        className="bg-[#FDFCF9] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header - 增加关闭按钮权重 */}
        <div className="p-8 border-b border-[#E6E2D3] flex items-center justify-between bg-white relative">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#A3B18A] text-white">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2D2D2A] tracking-tight">智能备份中心</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Version Control & Sync</p>
            </div>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            className="group p-3 -mr-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all cursor-pointer active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4 text-amber-800 animate-in slide-in-from-top-2">
              <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600" />
              <div className="space-y-1">
                <p className="text-[12px] font-black">{error.title}</p>
                <p className="text-[10px] leading-relaxed opacity-80">{error.msg}</p>
              </div>
            </div>
          )}

          {lastAction && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 font-bold text-xs animate-pulse">
              <CheckCircle2 className="w-4 h-4" /> {lastAction}
            </div>
          )}

          {/* 策略一：自动化方案 */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">数据同步策略</h3>
            <button 
              onClick={isSandboxed ? handleQuickExport : handleLinkFile}
              className={`w-full flex items-center justify-between p-6 rounded-3xl transition-all group shadow-lg ${isSandboxed ? 'bg-[#A3B18A] text-white hover:opacity-90' : 'bg-[#333333] text-white hover:bg-black'}`}
            >
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                  {isSandboxed ? <Smartphone className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-bold text-sm tracking-tight">{isSandboxed ? '一键存入网盘' : '关联网盘文件'}</p>
                  <p className="text-[9px] text-white/60 mt-0.5 font-medium">{isSandboxed ? '沙盒环境：点此导出并覆盖网盘备份文件' : '静默同步：实时保存修改至本地网盘路径'}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 opacity-30 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="h-px bg-slate-100" />

          {/* 策略二：本地快照 */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <History className="w-3 h-3" /> 自动版本记录 (本地快照)
            </h3>
            <div className="space-y-2">
              {localBackups.length > 0 ? localBackups.map((snap, i) => (
                <button 
                  key={i} 
                  onClick={() => restoreSnapshot(snap.data)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-[#A3B18A] hover:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D9D5CB] group-hover:bg-[#A3B18A]"></div>
                    <span className="text-[11px] font-bold text-slate-600">{snap.time}</span>
                    <span className="text-[9px] text-slate-400">({snap.data.length} 条数据)</span>
                  </div>
                  <span className="text-[9px] font-black text-[#A3B18A] uppercase tracking-widest opacity-0 group-hover:opacity-100">一键恢复</span>
                </button>
              )) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">暂无记录，修改数据将自动生成</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
             <button 
              onClick={() => fileInputRef.current?.click()} 
              className="p-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold text-slate-500 hover:text-slate-900 hover:border-slate-400 flex items-center justify-center gap-2 transition-colors"
             >
                <Upload className="w-3 h-3" /> 载入备份
                <input type="file" ref={fileInputRef} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        onImportOrders?.(JSON.parse(ev.target?.result as string));
                        showToastAndClose("文件导入成功");
                      } catch(e) { alert("文件格式无效"); }
                    };
                    reader.readAsText(file);
                  }
                }} className="hidden" />
             </button>
             <button 
              onClick={handleQuickExport} 
              className="p-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold text-slate-500 hover:text-slate-900 hover:border-slate-400 flex items-center justify-center gap-2 transition-colors"
             >
                <Download className="w-3 h-3" /> 下载全量
             </button>
          </div>
        </div>
        
        {/* Footer Hint */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">点击背景或按 ESC 键即可关闭</p>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
