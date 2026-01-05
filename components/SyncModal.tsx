
import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle2, GitMerge, Info, Copy, ClipboardPaste, Zap, Share2, ClipboardCheck, Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
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
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [clipboardValue, setClipboardValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tokenAreaRef = useRef<HTMLTextAreaElement>(null);

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
      throw new Error(`Base64转换失败: ${e.message}`);
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
    const buf = new TextEncoder().encode(str);
    const stream = new Blob([buf]).stream().pipeThrough(new CompressionStream('deflate'));
    const response = new Response(stream);
    const compressedBuf = await response.arrayBuffer();
    return bytesToBase64(new Uint8Array(compressedBuf));
  };

  const decompress = async (base64: string): Promise<string> => {
    const compressedBuf = base64ToBytes(base64);
    const stream = new Blob([compressedBuf]).stream().pipeThrough(new DecompressionStream('deflate'));
    const response = new Response(stream);
    return await response.text();
  };

  const handleGenerateToken = async () => {
    setIsGenerating(true);
    setSyncError(null);
    try {
      const combinedData = { orders: minifyOrders(orders), settings };
      const dataStr = JSON.stringify(combinedData);
      const compressed = await compress(dataStr);
      const token = `PCS:${compressed}`;
      setGeneratedToken(token);
      
      // 尝试自动复制
      try {
        await navigator.clipboard.writeText(token);
        setLastAction("口令已生成并复制！");
        setTimeout(() => setLastAction(null), 2000);
      } catch (copyErr) {
        // 如果自动复制由于移动端权限被拒，不报错，让用户手动复制文本框内容
        console.warn("自动复制被拦截，请手动复制文本框内容");
      }
    } catch (err: any) {
      setSyncError(`生成失败: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const processImportToken = async (token: string) => {
    const rawToken = token.trim().replace(/[\s\uFEFF\xA0\u200B\u200C\u200D]/g, '');
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

      if (importedOrders.length === 0) {
        throw new Error("解析出的企划列表为空，请检查口令是否完整。");
      }

      const previewList = importedOrders.slice(0, 3).map(o => `· ${o.title}`).join('\n');
      const confirmMsg = [
        `识别成功！`,
        `企划数：${importedOrders.length} 个`,
        importedOrders.length > 0 ? `${previewList}${importedOrders.length > 3 ? '\n...' : ''}` : '',
        `\n⚠️ 同步将【全量覆盖】当前设备数据。`,
        `确定同步吗？`
      ].filter(Boolean).join('\n');

      if (confirm(confirmMsg)) {
        if (onImportOrders) onImportOrders(importedOrders, 'replace');
        if (importedSettings && onImportSettings) onImportSettings(importedSettings);
        showToastAndClose("同步成功！");
        setClipboardValue('');
      }
    } catch (e: any) {
      console.error("同步解析错误:", e);
      setSyncError(`解析失败: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 修复错误：添加缺失的 handleQuickReadClipboard 函数以读取剪贴板口令
  const handleQuickReadClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setClipboardValue(text);
        processImportToken(text);
      }
    } catch (err: any) {
      setSyncError(`读取剪贴板失败: ${err.message}`);
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
              <p className="text-[10px] text-[#4F6D58] font-black uppercase tracking-widest mt-1">移动端兼容版</p>
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
            <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl font-bold text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div><p><strong>同步提示：</strong> {syncError}</p></div>
            </div>
          )}

          {/* 生成区域 */}
          <div className="space-y-4">
             <div className="bg-[#F4F1EA] p-6 rounded-3xl border-2 border-[#D1D9D3] space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black text-[#2D3A30] uppercase tracking-widest">发送数据</h3>
                   <button 
                     onClick={handleGenerateToken} 
                     disabled={isGenerating}
                     className="px-4 py-2 bg-[#3A5A40] text-white text-[10px] font-black rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                   >
                     {generatedToken ? "重新生成" : "生成同步口令"}
                   </button>
                </div>

                {generatedToken && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <textarea
                      ref={tokenAreaRef}
                      readOnly
                      value={generatedToken}
                      className="w-full p-4 bg-white border border-[#D6D2C4] rounded-xl text-[10px] font-mono break-all h-24 outline-none focus:border-[#D4A373]"
                      onClick={() => tokenAreaRef.current?.select()}
                      placeholder="口令内容..."
                    />
                    <div className="flex gap-2">
                       <button 
                         onClick={() => {
                           navigator.clipboard.writeText(generatedToken);
                           setLastAction("口令已复制！");
                           setTimeout(() => setLastAction(null), 2000);
                         }}
                         className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold text-[10px] hover:bg-amber-100 transition-all"
                       >
                         <Copy className="w-3.5 h-3.5" /> 点击复制口令
                       </button>
                       <button 
                         onClick={async () => {
                           const file = new File([generatedToken], "Piecasso_Backup.txt", { type: 'text/plain' });
                           try { await navigator.share({ files: [file], title: 'Piecasso 数据备份' }); } catch(e) {}
                         }}
                         disabled={!supportsShare}
                         className="flex items-center justify-center p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl disabled:opacity-30"
                       >
                         <Share2 className="w-4 h-4" />
                       </button>
                    </div>
                    <p className="text-[9px] text-amber-600 font-bold text-center">↑ 自动复制若失败，请长按上方框内文本手动复制</p>
                  </div>
                )}
             </div>

             {/* 导入区域 */}
             <div className="pt-4 border-t border-[#E2E8E4] space-y-4">
                <button 
                  onClick={handleQuickReadClipboard} 
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-3 p-5 bg-[#3A5A40] text-white rounded-3xl hover:opacity-90 shadow-xl transition-all disabled:opacity-50 active:scale-95"
                >
                  <ClipboardCheck className="w-5 h-5" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">一键读取剪贴板同步</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <ClipboardPaste className="w-4 h-4" />
                  </div>
                  <input 
                    ref={inputRef}
                    type="text" 
                    value={clipboardValue}
                    onChange={(e) => {
                      setClipboardValue(e.target.value);
                      if (e.target.value.includes('PCS:')) processImportToken(e.target.value);
                    }}
                    placeholder="或在此手动粘贴口令..."
                    className="w-full pl-11 pr-4 py-5 bg-[#F4F1EA] border-2 border-transparent focus:border-[#3A5A40] rounded-2xl text-[12px] font-medium outline-none transition-all"
                  />
                </div>
             </div>
          </div>
          
          <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-blue-900 uppercase tracking-tight">小贴士</p>
              <p className="text-[9px] text-blue-700 leading-relaxed">
                手机浏览器有严格的安全保护。建议先点击“生成口令”，看到文本后长按选择“全选”并“复制”，再到另一台设备点击“一键读取”。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
