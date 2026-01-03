
import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Upload, CheckCircle2, Cloud, ChevronRight, Share, Trash2, GitMerge, FileText, Info, Copy, ClipboardPaste, Zap, AlertTriangle, Share2, ClipboardCheck } from 'lucide-react';
import { Order } from '../types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onImportOrders?: (orders: Order[], mode: 'append' | 'merge' | 'replace') => void;
}

const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, orders, onImportOrders }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [showClipboardInput, setShowClipboardInput] = useState(false);
  const [clipboardValue, setClipboardValue] = useState('');
  const [isLowercasedWarning, setIsLowercasedWarning] = useState(false);

  const supportsShare = typeof navigator.share !== 'undefined';

  const showToastAndClose = (msg: string) => {
    setLastAction(msg);
    setTimeout(() => { setLastAction(null); onClose(); }, 1500);
  };

  const generateFileName = () => `ArtNexus_Backup_${new Date().toISOString().split('T')[0]}.json`;

  const safeBtoa = (str: string) => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  };

  const safeAtob = (str: string) => {
    try {
      return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (e) {
      return null;
    }
  };

  const getSyncToken = () => {
    const dataStr = JSON.stringify(orders);
    const encoded = safeBtoa(dataStr);
    return `ARTNEXUS:${encoded}`;
  };

  const handleCopyToClipboard = () => {
    const finalToken = getSyncToken();
    navigator.clipboard.writeText(finalToken).then(() => {
      alert("同步口令已复制！\n\n小贴士：粘贴时请确保大小写不被系统修改。");
    }).catch(err => {
      prompt("请手动复制口令：", finalToken);
    });
  };

  const handleShareTokenAsFile = async () => {
    if (!supportsShare) {
      alert("当前浏览器不支持原生分享，请使用“复制口令”手动粘贴。");
      return;
    }
    const token = getSyncToken();
    const file = new File([token], "艺策同步口令.txt", { type: 'text/plain' });
    try {
      await navigator.share({ 
        files: [file], 
        title: '艺策同步口令',
        text: '使用 AirDrop 传送此文件可避免粘贴时的大写变小写问题。'
      });
    } catch (err) {
      console.log("分享已取消");
    }
  };

  const processImportToken = (token: string) => {
    const regex = /ARTNEXUS:([A-Za-z0-9+/=%\s\n\r]+)/i;
    const match = token.match(regex);

    if (!match || !match[1]) {
      alert("解析失败：格式不正确。口令需以 ARTNEXUS: 开头。");
      return;
    }

    const encodedPart = match[1].replace(/[\s\n\r]/g, '');
    const hasUpperCase = /[A-Z]/.test(encodedPart);

    try {
      const decodedData = safeAtob(encodedPart);
      if (!decodedData) throw new Error("Decode Failed");

      const parsedOrders = JSON.parse(decodedData);
      // 口令同步通常用于设备间协作，使用 'merge' 模式
      onImportOrders?.(parsedOrders, 'merge');
      showToastAndClose("数据同步完成！");
      setClipboardValue('');
      setShowClipboardInput(false);
    } catch (e) {
      alert("解析失败，请确保复制了完整的口令。");
    }
  };

  const handleQuickReadClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.toLowerCase().includes('artnexus:')) {
        setClipboardValue(text);
        processImportToken(text);
      } else {
        alert("剪贴板中未发现有效的同步口令。");
      }
    } catch (err) {
      alert("无法访问剪贴板，请手动粘贴。");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1B241D]/70 backdrop-blur-md" onClick={onClose}>
      <div className="bg-[#FDFDFB] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-[#E2E8E4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#3A5A40] text-white shadow-lg"><Cloud className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-bold text-[#2D3A30]">同步中心</h2>
              <p className="text-[10px] text-[#4F6D58] font-black uppercase tracking-widest mt-1">Backup & Restore Hub</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {lastAction && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4" /> {lastAction}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-widest px-1 flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> 极速口令同步 (合并)
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCopyToClipboard} className="flex flex-col items-center gap-2 p-5 bg-amber-50 border border-amber-100 rounded-3xl hover:bg-amber-100 transition-all group">
                <Copy className="w-5 h-5 text-amber-600" />
                <span className="text-[10px] font-bold text-amber-900">生成口令</span>
              </button>
              <button onClick={handleShareTokenAsFile} className="flex flex-col items-center gap-2 p-5 bg-[#3A5A40] text-white rounded-3xl shadow-md active:scale-95 transition-all">
                <Share2 className="w-5 h-5" />
                <span className="text-[10px] font-bold">AirDrop 文件</span>
              </button>
            </div>

            <button 
              onClick={() => {
                setShowClipboardInput(!showClipboardInput);
                setIsLowercasedWarning(false);
              }} 
              className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:border-amber-400 transition-all flex items-center justify-center gap-2"
            >
              <ClipboardPaste className="w-4 h-4" />
              <span className="text-[11px] font-bold">导入同步口令</span>
            </button>
            
            {showClipboardInput && (
              <div className="p-5 bg-[#F2F4F0] rounded-[2rem] space-y-4 animate-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">输入区域</span>
                  <button 
                    onClick={handleQuickReadClipboard} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-amber-600 transition-colors"
                  >
                    <ClipboardCheck className="w-3 h-3" /> 智能读取剪贴板
                  </button>
                </div>
                
                <textarea 
                  className={`w-full p-4 bg-white border rounded-2xl text-[10px] font-medium outline-none transition-all shadow-inner border-slate-200 focus:border-amber-500`}
                  rows={4} 
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="在此粘贴 ARTNEXUS: 开头的代码..."
                  value={clipboardValue}
                  onChange={e => setClipboardValue(e.target.value)}
                />

                <button 
                  onClick={() => processImportToken(clipboardValue)} 
                  disabled={!clipboardValue.trim()}
                  className="w-full py-4 bg-[#2D3A30] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30"
                >
                  解析并合并数据
                </button>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-100" />

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-widest">全量数据恢复 (替换)</h3>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded uppercase">清空现有内容</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={async () => {
                const dataStr = JSON.stringify(orders, null, 2);
                const file = new File([dataStr], generateFileName(), { type: 'application/json' });
                if (supportsShare) {
                  try { await navigator.share({ files: [file], title: '全量备份' }); showToastAndClose("已发送"); } catch (e) {}
                } else {
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = generateFileName();
                  link.click();
                }
              }} className="w-full flex items-center justify-between p-5 bg-white border border-slate-200 text-[#2D3A30] rounded-3xl hover:border-[#3A5A40] transition-all group">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-[#F2F4F0] group-hover:bg-[#3A5A40] group-hover:text-white rounded-xl transition-colors"><Download className="w-4 h-4" /></div>
                  <div className="text-left">
                    <span className="font-bold text-xs block">生成全量备份文件</span>
                    <span className="text-[8px] opacity-50 block uppercase tracking-tighter">下载当前所有企划</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-30" />
              </button>

              <button 
                onClick={() => {
                  if(confirm("警告：载入备份文件将清空当前所有企划，并以备份文件为准。是否继续？")) {
                    fileInputRef.current?.click();
                  }
                }} 
                className="w-full flex items-center justify-between p-5 bg-white border border-slate-200 text-[#2D3A30] rounded-3xl hover:border-amber-500 hover:bg-amber-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-[#F2F4F0] group-hover:bg-amber-500 group-hover:text-white rounded-xl transition-colors"><Upload className="w-4 h-4" /></div>
                  <div className="text-left">
                    <span className="font-bold text-xs block">载入备份文件 (替换式)</span>
                    <span className="text-[8px] text-amber-600 font-bold block uppercase tracking-tighter">清空并恢复至此文件状态</span>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                       try {
                         const data = JSON.parse(ev.target?.result as string);
                         // 备份恢复使用 'replace' 模式，清空现有数据
                         onImportOrders?.(data, 'replace');
                         showToastAndClose("数据已全量替换");
                       } catch(e) { alert("文件解析失败，请确保是有效的 JSON 备份文件。"); }
                    };
                    reader.readAsText(file);
                  }
                }} className="hidden" accept=".json,application/json" />
                <ChevronRight className="w-4 h-4 opacity-30" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
