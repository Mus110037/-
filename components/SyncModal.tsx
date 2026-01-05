
import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle2, GitMerge, Info, Copy, ClipboardPaste, Zap, Share2, ClipboardCheck, Loader2, AlertTriangle } from 'lucide-react';
import { Order, OrderStatus, AppSettings } from '../types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  settings: AppSettings;
  onImportOrders?: (orders: Order[], mode: 'append' | 'merge' | 'replace') => void;
  onImportSettings?: (settings: AppSettings) => void;
}

const VALUE_MAP: Record<string, Record<string, string>> = {
  priority: { '高': 'H', '中': 'M', '低': 'L' },
  commissionType: { '商用': 'C', '私用': 'P' },
  personCount: { '单人': 'S', '双人': 'D', '多人': 'M' },
  status: { '进行中': 'P', '已完成': 'C', '已取消': 'X' },
};

const REVERSE_VALUE_MAP: Record<string, Record<string, string>> = {};
for (const key in VALUE_MAP) {
  REVERSE_VALUE_MAP[key] = Object.fromEntries(
    Object.entries(VALUE_MAP[key]).map(([k, v]) => [v, k])
  );
}

const KEY_MAP: Record<string, string> = {
  title: 't', totalPrice: 'v', deadline: 'd', progressStage: 'g',
  commissionType: 'm', personCount: 'p', artType: 'y', source: 'o',
  priority: 'l', description: 'r', createdAt: 'c', status: 's',
  duration: 'u', actualDuration: 'a',
};

const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
);

const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, orders, settings, onImportOrders, onImportSettings }) => {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [clipboardValue, setClipboardValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const supportsShare = typeof navigator.share !== 'undefined';

  const showToastAndClose = (msg: string) => {
    setLastAction(msg);
    setSyncError(null);
    setTimeout(() => { setLastAction(null); onClose(); }, 1500);
  };

  const bytesToBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const base64ToBytes = (base64: string): Uint8Array => {
    try {
      const sanitized = base64.replace(/[^A-Za-z0-9+/=]/g, '');
      const binaryString = atob(sanitized);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (e: any) {
      throw new Error(`口令转换失败: ${e.message}`);
    }
  };

  const minifyOrders = (data: Order[]) => {
    return data.map(item => {
      const minified: any = {};
      Object.entries(KEY_MAP).forEach(([fullKey, minKey]) => {
        let value = (item as any)[fullKey];
        if (VALUE_MAP[fullKey] && value !== undefined) value = VALUE_MAP[fullKey][value];
        if (value !== undefined) minified[minKey] = value;
      });
      return minified;
    });
  };

  const unminifyOrders = (minData: any[]): Order[] => {
    if (!Array.isArray(minData)) return [];
    return minData.map((item, idx) => {
      const expanded: any = {};
      Object.entries(REVERSE_MAP).forEach(([minKey, fullKey]) => {
        let value = item[minKey];
        if (REVERSE_VALUE_MAP[fullKey] && value !== undefined) value = REVERSE_VALUE_MAP[fullKey][value];
        if (value !== undefined) expanded[fullKey] = value;
      });
      return {
        ...expanded,
        id: expanded.id || `sync-${Date.now()}-${idx}`,
        version: expanded.version || 1,
        updatedAt: new Date().toISOString(),
        status: expanded.status || (expanded.progressStage === '已成稿' ? OrderStatus.COMPLETED : OrderStatus.PENDING),
      } as Order;
    });
  };

  const compress = async (str: string): Promise<string> => {
    if (typeof CompressionStream === 'undefined') throw new Error("设备不支持压缩");
    const buf = new TextEncoder().encode(str);
    const stream = new Blob([buf]).stream().pipeThrough(new CompressionStream('deflate'));
    const response = new Response(stream);
    const compressedBuf = await response.arrayBuffer();
    return bytesToBase64(new Uint8Array(compressedBuf));
  };

  const decompress = async (base64: string): Promise<string> => {
    if (typeof DecompressionStream === 'undefined') throw new Error("设备不支持解压");
    const compressedBuf = base64ToBytes(base64);
    const stream = new Blob([compressedBuf]).stream().pipeThrough(new DecompressionStream('deflate'));
    const response = new Response(stream);
    return await response.text();
  };

  const handleCopyToClipboard = async () => {
    setIsGenerating(true);
    setSyncError(null);
    try {
      const combinedData = { orders: minifyOrders(orders), settings };
      const dataStr = JSON.stringify(combinedData);
      const compressed = await compress(dataStr);
      const token = `PCS:${compressed}`;
      await navigator.clipboard.writeText(token);
      showToastAndClose("口令已成功复制！");
    } catch (err: any) {
      setSyncError(`生成失败: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const processImportToken = async (token: string) => {
    const rawToken = token.replace(/[\s\uFEFF\xA0\u200B\u200C\u200D]/g, '');
    if (!rawToken) return;

    setIsGenerating(true);
    setSyncError(null);

    try {
      let encodedData = '';
      if (rawToken.startsWith('PCS:')) encodedData = rawToken.substring(4);
      else if (rawToken.startsWith('PC:')) encodedData = rawToken.substring(3);
      else if (rawToken.includes(':')) encodedData = rawToken.split(':').pop() || '';
      else encodedData = rawToken;

      const decodedStr = await decompress(encodedData);
      const parsed = JSON.parse(decodedStr);
      
      const importedOrders = parsed.orders ? unminifyOrders(parsed.orders) : [];
      const importedSettings = parsed.settings as AppSettings;

      // 增强确认提示
      const confirmMsg = [
        `识别到以下内容：`,
        `· 企划数量：${importedOrders.length} 个`,
        `· 包含设置：${importedSettings ? '是' : '否'}`,
        `\n⚠️ 同步将【全量覆盖】当前设备的所有数据，确定继续吗？`
      ].join('\n');

      if (confirm(confirmMsg)) {
        console.log("正在执行同步覆盖...", importedOrders.length, "个企划");
        if (onImportOrders) onImportOrders(importedOrders, 'replace');
        if (importedSettings && onImportSettings) onImportSettings(importedSettings);
        showToastAndClose("数据同步成功！");
        setClipboardValue('');
      }
    } catch (e: any) {
      console.error("同步处理异常:", e);
      setSyncError(`解析失败: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickReadClipboard = async () => {
    try {
      setSyncError(null);
      const text = await navigator.clipboard.readText();
      const cleanedText = text.replace(/[\s\uFEFF\xA0\u200B]/g, '');
      if (cleanedText && (cleanedText.includes('PCS:') || cleanedText.includes('PC:'))) {
        processImportToken(cleanedText);
      } else {
        setSyncError("剪贴板未发现有效口令。");
        inputRef.current?.focus();
      }
    } catch (err) {
      setSyncError("请长按下方输入框选择“粘贴”。");
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1B241D]/70 backdrop-blur-md" onClick={onClose}>
      <div className="bg-[#FDFBF7] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-[#E2E8E4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#D4A373] text-white shadow-lg">
              {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2D3A30]">Piecasso 同步</h2>
              <p className="text-[10px] text-[#4F6D58] font-black uppercase tracking-widest mt-1">跨端数据迁移方案</p>
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

          {syncError && (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl font-bold text-[11px] flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p><strong>同步提示：</strong> {syncError}</p>
                <button onClick={() => { setSyncError(null); setClipboardValue(''); }} className="mt-2 text-[9px] font-black text-rose-800 underline uppercase">清除重试</button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleCopyToClipboard} 
                disabled={isGenerating}
                className="flex flex-col items-center gap-2 p-5 bg-amber-50 border border-amber-100 rounded-3xl hover:bg-amber-100 transition-all disabled:opacity-50 active:scale-95"
              >
                <Copy className="w-5 h-5 text-amber-600" />
                <span className="text-[10px] font-bold text-amber-900">复制当前口令</span>
              </button>
              <button 
                onClick={async () => {
                  if (orders.length === 0) return alert("企划列表为空");
                  setIsGenerating(true);
                  try {
                    const combinedData = { orders: minifyOrders(orders), settings };
                    const dataStr = JSON.stringify(combinedData);
                    const compressed = await compress(dataStr);
                    const token = `PCS:${compressed}`;
                    const file = new File([token], "Piecasso备份.txt", { type: 'text/plain' });
                    await navigator.share({ files: [file], title: 'Piecasso 同步数据' });
                  } catch(e) { console.error(e); } finally { setIsGenerating(false); }
                }} 
                disabled={isGenerating || !supportsShare}
                className="flex flex-col items-center gap-2 p-5 bg-blue-50 border border-blue-100 rounded-3xl hover:bg-blue-100 transition-all disabled:opacity-50 active:scale-95"
              >
                <Share2 className="w-5 h-5 text-blue-600" />
                <span className="text-[10px] font-bold text-blue-900">分享备份文件</span>
              </button>
            </div>

            <div className="pt-4 border-t border-[#E2E8E4] space-y-4">
               <button 
                onClick={handleQuickReadClipboard} 
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-3 p-5 bg-[#3A5A40] text-white rounded-3xl hover:opacity-90 shadow-xl transition-all disabled:opacity-50 active:scale-95"
               >
                 <ClipboardCheck className="w-5 h-5" />
                 <span className="text-[11px] font-bold uppercase tracking-widest">一键从剪贴板同步</span>
               </button>

               <div className="relative">
                 <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                   <ClipboardPaste className="w-4 h-4 text-slate-400" />
                 </div>
                 <input 
                   ref={inputRef}
                   type="text" 
                   value={clipboardValue}
                   onChange={(e) => {
                     setClipboardValue(e.target.value);
                     if (e.target.value.includes('PCS:')) {
                        processImportToken(e.target.value);
                     }
                   }}
                   placeholder="手动粘贴：长按并选择粘贴..."
                   className="w-full pl-11 pr-4 py-5 bg-[#F4F1EA] border-2 border-transparent focus:border-[#3A5A40] rounded-2xl text-[12px] font-medium outline-none transition-all placeholder:text-slate-400"
                 />
               </div>
               
               {clipboardValue.trim() && !isGenerating && (
                 <button
                   onClick={() => processImportToken(clipboardValue)}
                   className="w-full flex items-center justify-center gap-3 p-4 bg-[#D4A373] text-white rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-95"
                 >
                   <Zap className="w-4 h-4" />
                   <span className="text-[11px] font-bold uppercase tracking-widest">确认导入此数据</span>
                 </button>
               )}
            </div>
          </div>
          
          <div className="p-5 bg-[#F4F1EA] rounded-3xl border border-[#D1D9D3] flex items-start gap-4">
            <Info className="w-4 h-4 text-[#4F6D58] mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[#2D3A30] uppercase tracking-tight">导入提示</p>
              <p className="text-[9px] text-[#4F6D58] leading-relaxed">
                导入操作是不可逆的。如果您有多台设备，请务必先通过“复制当前口令”备份旧设备数据。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
