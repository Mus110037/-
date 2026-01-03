
import React, { useState, useRef, useEffect } from 'react';
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

  useEffect(() => {
    // 加载本地自动快照
    const saved = localStorage.getItem('artnexus_auto_snapshots');
    if (saved) setLocalBackups(JSON.parse(saved).reverse().slice(0, 3));
  }, [isOpen]);

  const showToast = (msg: string) => {
    setLastAction(msg);
    setTimeout(() => setLastAction(null), 3000);
  };

  const handleLinkFile = async () => {
    setError(null);
    try {
      // 在 iframe 中直接尝试会报错，这里做预检查
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
      showToast("已关联网盘！此后修改将实时同步。");
    } catch (err: any) {
      if (err.message === "SandboxRestricted" || err.name === "SecurityError") {
        setError({
          title: "预览环境权限限制",
          msg: "由于当前处于安全预览沙盒，浏览器禁止直接操作硬盘文件。请使用下方的“一键导出”或“存入网盘”功能。"
        });
      } else if (err.name !== 'AbortError') {
        setError({ title: "关联失败", msg: "浏览器拒绝了访问请求。" });
      }
    }
  };

  const handleQuickExport = async () => {
    const dataStr = JSON.stringify(orders, null, 2);
    // 手机端尝试 Web Share API，PC端直接下载
    if (!isSandboxed && navigator.share && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      try {
        const file = new File([dataStr], `artnexus_sync.json`, { type: 'application/json' });
        await navigator.share({ files: [file], title: 'ArtNexus 同步', text: '存入网盘文件夹' });
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
    showToast("备份文件已准备好");
  };

  const restoreSnapshot = (snapshotOrders: Order[]) => {
    if (onImportOrders) {
      onImportOrders(snapshotOrders);
      showToast("已恢复至历史版本");
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <div className="bg-[#FDFCF9] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        
        <div className="p-8 border-b border-[#E6E2D3] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#A3B18A] text-white">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2D2D2A] tracking-tight">智能备份中心</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Version Control & Sync</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-300 transition-colors"><X className="w-5 h-5" /></button>
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
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" /> {lastAction}
            </div>
          )}

          {/* 策略一：自动化（仅限 HTTPS & 非沙盒） */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">实时同步策略</h3>
            <button 
              onClick={isSandboxed ? handleQuickExport : handleLinkFile}
              className={`w-full flex items-center justify-between p-6 rounded-3xl transition-all group shadow-lg ${isSandboxed ? 'bg-[#A3B18A] text-white' : 'bg-[#333333] text-white'}`}
            >
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-white/20 rounded-2xl">
                  {isSandboxed ? <Smartphone className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-bold text-sm tracking-tight">{isSandboxed ? '一键存入网盘' : '关联网盘文件'}</p>
                  <p className="text-[9px] text-white/60 mt-0.5 font-medium">{isSandboxed ? '由于沙盒限制，请点击此处导出并覆盖旧文件' : '建立持久连接，实现全自动静默保存'}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 opacity-30" />
            </button>
          </div>

          <div className="h-px bg-slate-100" />

          {/* 策略二：自动快照（本地撤回） */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <History className="w-3 h-3" /> 自动版本记录 (Local Snapshots)
            </h3>
            <div className="space-y-2">
              {localBackups.length > 0 ? localBackups.map((snap, i) => (
                <button 
                  key={i} 
                  onClick={() => restoreSnapshot(snap.data)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-[#A3B18A] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D9D5CB] group-hover:bg-[#A3B18A]"></div>
                    <span className="text-[11px] font-bold text-slate-600">{snap.time}</span>
                    <span className="text-[9px] text-slate-400">({snap.data.length} 条数据)</span>
                  </div>
                  <span className="text-[9px] font-black text-[#A3B18A] uppercase tracking-widest opacity-0 group-hover:opacity-100">恢复此版本</span>
                </button>
              )) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">暂无版本记录</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
             <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center justify-center gap-2">
                <Upload className="w-3 h-3" /> 手动上传
                <input type="file" ref={fileInputRef} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => onImportOrders?.(JSON.parse(ev.target?.result as string));
                    reader.readAsText(file);
                  }
                }} className="hidden" />
             </button>
             <button onClick={handleQuickExport} className="p-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold text-slate-500 hover:text-slate-900 flex items-center justify-center gap-2">
                <Download className="w-3 h-3" /> 导出备份
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
