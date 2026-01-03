
import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Upload, CheckCircle2, Cloud, ChevronRight, Share, Trash2, GitMerge, FileText, Info, Copy, ClipboardPaste, Zap, AlertTriangle, Share2, ClipboardCheck, Loader2 } from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onImportOrders?: (orders: Order[], mode: 'append' | 'merge' | 'replace') => void;
}

// 深度压缩映射表
const KEY_MAP: Record<string, string> = {
  title: 't',
  totalPrice: 'v',
  deadline: 'd',
  progressStage: 'g',
  commissionType: 'm',
  personCount: 'p',
  artType: 'y',
  source: 'o',
  priority: 'l',
  description: 'r',
  createdAt: 'c',
  status: 's'
};

const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
);

const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, orders, onImportOrders }) => {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [clipboardValue, setClipboardValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const supportsShare = typeof navigator.share !== 'undefined';

  const showToastAndClose = (msg: string) => {
    setLastAction(msg);
    setTimeout(() => { setLastAction(null); onClose(); }, 1500);
  };

  /**
   * 辅助函数：将字节数组转换为 Base64
   */
  const bytesToBase64 = (bytes: Uint8Array): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(',')[1]);
      };
      reader.readAsDataURL(new Blob([bytes]));
    });
  };

  /**
   * 辅助函数：将 Base64 转换为字节数组
   */
  const base64ToBytes = async (base64: string): Promise<Uint8Array> => {
    const res = await fetch(`data:application/octet-stream;base64,${base64}`);
    return new Uint8Array(await res.arrayBuffer());
  };

  /**
   * 映射数据以减少体积
   */
  const minifyData = (data: Order[]) => {
    return data.map(item => {
      const minified: any = {};
      Object.entries(KEY_MAP).forEach(([fullKey, minKey]) => {
        if ((item as any)[fullKey] !== undefined) {
          minified[minKey] = (item as any)[fullKey];
        }
      });
      return minified;
    });
  };

  /**
   * 解析映射数据
   */
  const unminifyData = (minData: any[]): Order[] => {
    return minData.map((item, idx) => {
      const expanded: any = {};
      Object.entries(REVERSE_MAP).forEach(([minKey, fullKey]) => {
        if (item[minKey] !== undefined) {
          expanded[fullKey] = item[minKey];
        }
      });
      // 补全必要字段
      return {
        ...expanded,
        id: expanded.id || `sync-${Date.now()}-${idx}`,
        version: expanded.version || 1,
        updatedAt: new Date().toISOString(),
        duration: expanded.duration || 5
      } as Order;
    });
  };

  /**
   * 数据压缩：使用 Deflate (比 Gzip 更小的头部)
   */
  const compress = async (str: string): Promise<string> => {
    const buf = new TextEncoder().encode(str);
    const stream = new Blob([buf]).stream().pipeThrough(new CompressionStream('deflate'));
    const response = new Response(stream);
    const compressedBuf = await response.arrayBuffer();
    return await bytesToBase64(new Uint8Array(compressedBuf));
  };

  /**
   * 数据解压
   */
  const decompress = async (base64: string, algo: 'deflate' | 'gzip' = 'deflate'): Promise<string> => {
    const compressedBuf = await base64ToBytes(base64);
    const stream = new Blob([compressedBuf]).stream().pipeThrough(new DecompressionStream(algo));
    const response = new Response(stream);
    return await response.text();
  };

  const handleCopyToClipboard = async () => {
    if (orders.length === 0) return alert("当前工作区为空。");
    setIsGenerating(true);
    try {
      const minified = minifyData(orders);
      const dataStr = JSON.stringify(minified);
      const compressed = await compress(dataStr);
      // 使用更短的前缀 AZ: (ArtPulse Zip)
      const finalToken = `AZ:${compressed}`;
      
      await navigator.clipboard.writeText(finalToken);
      alert("极简同步口令已复制！\n\n采用了字段映射+Deflate深度压缩，体积缩减约 80%。");
    } catch (err) {
      alert("口令生成失败。");
    } finally {
      setIsGenerating(false);
    }
  };

  const processImportToken = async (token: string) => {
    if (!token.trim()) return;
    setIsGenerating(true);
    try {
      let decodedData: string | null = null;
      let needsUnminify = false;

      if (token.includes('AZ:')) {
        // 极简版：Deflate + Minified Keys
        const encodedPart = token.split('AZ:')[1].trim().replace(/[\s\n\r]/g, '');
        decodedData = await decompress(encodedPart, 'deflate');
        needsUnminify = true;
      } else if (token.includes('ARTPULSE_Z:') || token.includes('ARTNEXUS_Z:')) {
        // 旧版/新版兼容压缩：Gzip
        const prefix = token.includes('ARTPULSE_Z:') ? 'ARTPULSE_Z:' : 'ARTNEXUS_Z:';
        const encodedPart = token.split(prefix)[1].trim().replace(/[\s\n\r]/g, '');
        decodedData = await decompress(encodedPart, 'gzip');
      }

      if (!decodedData) throw new Error("Format Error");

      let parsedOrders = JSON.parse(decodedData);
      if (needsUnminify) {
        parsedOrders = unminifyData(parsedOrders);
      }
      
      if(confirm(`识别到 ${parsedOrders.length} 个企划。同步将全量更新当前设备数据，确定继续吗？`)) {
        onImportOrders?.(parsedOrders, 'replace');
        showToastAndClose("极简同步完成！");
        setClipboardValue('');
      }
    } catch (e) {
      alert("口令解析失败：数据版本不兼容或已损坏。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickReadClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.includes('AZ:') || text.includes('ARTPULSE_Z:') || text.includes('ARTNEXUS_Z:'))) {
        setClipboardValue(text);
        processImportToken(text);
      } else {
        alert("未发现有效的同步口令。");
      }
    } catch (err) {
      alert("无法读取剪贴板，请手动粘贴。");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1B241D]/70 backdrop-blur-md" onClick={onClose}>
      <div className="bg-[#FDFDFB] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-[#E2E8E4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#3A5A40] text-white shadow-lg">
              {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2D3A30]">同步中心</h2>
              <p className="text-[10px] text-[#4F6D58] font-black uppercase tracking-widest mt-1">Deflate 极简版口令</p>
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
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-widest flex items-center gap-2">
                <GitMerge className="w-3 h-3 text-amber-500" /> 高效跨端同步
              </h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase">
                DEFLATE + MAPPING
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleCopyToClipboard} 
                disabled={isGenerating}
                className="flex flex-col items-center gap-2 p-5 bg-amber-50 border border-amber-100 rounded-3xl hover:bg-amber-100 transition-all group disabled:opacity-50"
              >
                <Copy className="w-5 h-5 text-amber-600" />
                <span className="text-[10px] font-bold text-amber-900">生成极简口令</span>
              </button>
              <button 
                onClick={async () => {
                  if (orders.length === 0) return;
                  setIsGenerating(true);
                  try {
                    const compressed = await compress(JSON.stringify(minifyData(orders)));
                    const token = `AZ:${compressed}`;
                    const file = new File([token], "艺脉极简口令.txt", { type: 'text/plain' });
                    await navigator.share({ files: [file], title: '艺脉极简口令' });
                  } catch(e) {} finally { setIsGenerating(false); }
                }} 
                disabled={isGenerating || !supportsShare}
                className="flex flex-col items-center gap-2 p-5 bg-blue-50 border border-blue-100 rounded-3xl hover:bg-blue-100 transition-all group disabled:opacity-50"
              >
                <Share2 className="w-5 h-5 text-blue-600" />
                <span className="text-[10px] font-bold text-blue-900">发送口令文件</span>
              </button>
            </div>

            <div className="pt-4 border-t border-[#E2E8E4] space-y-4">
               <button 
                onClick={handleQuickReadClipboard} 
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-3 p-5 bg-[#3A5A40] text-white rounded-3xl hover:opacity-90 shadow-xl transition-all disabled:opacity-50"
               >
                 <ClipboardCheck className="w-5 h-5" />
                 <span className="text-[11px] font-bold uppercase tracking-widest">一键读取并同步</span>
               </button>

               <div className="relative">
                 <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                   <ClipboardPaste className="w-4 h-4 text-slate-400" />
                 </div>
                 <input 
                   type="text" 
                   value={clipboardValue}
                   onChange={(e) => {
                     setClipboardValue(e.target.value);
                     if (e.target.value.startsWith('AZ:') || e.target.value.includes('ARTPULSE') || e.target.value.includes('ARTNEXUS')) {
                       processImportToken(e.target.value);
                     }
                   }}
                   placeholder="或手动粘贴 AZ: 开头的口令..."
                   className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] outline-none focus:border-[#3A5A40] transition-all"
                 />
               </div>
            </div>
          </div>
          
          <div className="p-6 bg-[#F2F4F0] rounded-3xl border border-[#D1D9D3] flex items-start gap-4">
            <Info className="w-4 h-4 text-[#4F6D58] mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[#2D3A30] uppercase tracking-tight">关于极致压缩</p>
              <p className="text-[9px] text-[#4F6D58] leading-relaxed">
                我们通过字段映射（如 title→t）结合 Deflate 算法，将数据体积压缩至极限。
                这使得包含数十个企划的口令也能轻松通过社交软件发送，而不被识别为“过长内容”。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
