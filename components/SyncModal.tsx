
import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Upload, CheckCircle2, Cloud, ChevronRight, Share, Trash2, GitMerge, FileText, Info, Copy, ClipboardPaste, Zap, AlertTriangle, Share2, ClipboardCheck, Loader2, QrCode } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import QRCode from 'qrcode';
import QrScannerModal from './QrScannerModal'; // Import the new QR scanner modal

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onImportOrders?: (orders: Order[], mode: 'append' | 'merge' | 'replace') => void;
}

// Deep compression mapping for values
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

// Deep compression mapping for keys
const KEY_MAP: Record<string, string> = {
  title: 't',
  totalPrice: 'v',
  deadline: 'd',
  progressStage: 'g',
  commissionType: 'm', // 'm' for mode
  personCount: 'p', // 'p' for people
  artType: 'y',
  source: 'o',
  priority: 'l', // 'l' for level
  description: 'r',
  createdAt: 'c',
  status: 's', // 's' for status
  duration: 'u', // Estimated duration
  actualDuration: 'a', // Actual duration
};

const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
);

const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, orders, onImportOrders }) => {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [clipboardValue, setClipboardValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null); // State to hold the token for QR code generation
  const [longTokenWarning, setLongTokenWarning] = useState<string | null>(null); // New state for long token warning
  const [isScannerOpen, setIsScannerOpen] = useState(false); // New state for QR scanner modal
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);


  const supportsShare = typeof navigator.share !== 'undefined';

  // Effect to generate QR code when generatedToken changes and canvas ref is available
  useEffect(() => {
    console.log("useEffect triggered for QR code generation.");
    console.log("generatedToken:", generatedToken ? generatedToken.substring(0, 50) + "..." : "null");
    console.log("qrCanvasRef.current:", qrCanvasRef.current);
    console.log("Modal isOpen:", isOpen);

    if (!isOpen || !generatedToken || !qrCanvasRef.current) {
      // If modal closed, no token, or canvas not ready, clear old QR code and hide.
      setQrCodeDataUrl(null);
      // We keep showQrCode=true if a token generation was started,
      // it's only set to false on explicit close or generation error.
      return;
    }

    // Clear previous QR data URL while new one is being generated
    setQrCodeDataUrl(null); 

    console.log("Attempting to generate QR code...");
    const startTime = performance.now();

    QRCode.toCanvas(qrCanvasRef.current, generatedToken, { width: 256, margin: 2, color: { dark: '#2D3A30', light: '#FDFBF7' } })
      .then(() => {
        const endTime = performance.now();
        console.log(`QR Code generated successfully in ${endTime - startTime} ms.`);
        setQrCodeDataUrl(qrCanvasRef.current!.toDataURL());
      })
      .catch((err) => {
        const endTime = performance.now();
        console.error(`Failed to generate QR code (in useEffect) after ${endTime - startTime} ms:`, err);
        setQrCodeDataUrl(null); // Ensure no corrupted QR shows
        setLongTokenWarning("二维码生成失败，口令可能过长或数据异常。请尝试使用复制/粘贴。");
      });
  }, [generatedToken, isOpen]); // Also depend on isOpen, to clear on close or re-trigger if modal state affects canvas.

  const showToastAndClose = (msg: string) => {
    setLastAction(msg);
    setTimeout(() => { setLastAction(null); onClose(); }, 1500);
  };

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

  const base64ToBytes = async (base64: string): Promise<Uint8Array> => {
    const res = await fetch(`data:application/octet-stream;base64,${base64}`);
    return new Uint8Array(await res.arrayBuffer());
  };

  const minifyData = (data: Order[]) => {
    return data.map(item => {
      const minified: any = {};
      Object.entries(KEY_MAP).forEach(([fullKey, minKey]) => {
        let value = (item as any)[fullKey];
        if (VALUE_MAP[fullKey] && value !== undefined) {
          value = VALUE_MAP[fullKey][value]; // Map the specific value
        }
        if (value !== undefined) {
          minified[minKey] = value;
        }
      });
      return minified;
    });
  };

  const unminifyData = (minData: any[]): Order[] => {
    return minData.map((item, idx) => {
      const expanded: any = {};
      Object.entries(REVERSE_MAP).forEach(([minKey, fullKey]) => {
        let value = item[minKey];
        if (REVERSE_VALUE_MAP[fullKey] && value !== undefined) {
          value = REVERSE_VALUE_MAP[fullKey][value]; // Reverse map the specific value
        }
        if (value !== undefined) {
          expanded[fullKey] = value;
        }
      });
      return {
        ...expanded,
        id: expanded.id || `sync-${Date.now()}-${idx}`,
        version: expanded.version || 1,
        updatedAt: new Date().toISOString(),
        status: expanded.status || (expanded.progressStage === '已成稿' ? OrderStatus.COMPLETED : OrderStatus.PENDING), // Ensure status is correctly set
      } as Order;
    });
  };

  const compress = async (str: string): Promise<string> => {
    const buf = new TextEncoder().encode(str);
    const stream = new Blob([buf]).stream().pipeThrough(new CompressionStream('deflate'));
    const response = new Response(stream);
    const compressedBuf = await response.arrayBuffer();
    return await bytesToBase64(new Uint8Array(compressedBuf));
  };

  const decompress = async (base64: string, algo: 'deflate' | 'gzip' = 'deflate'): Promise<string> => {
    const compressedBuf = await base64ToBytes(base64);
    const stream = new Blob([compressedBuf]).stream().pipeThrough(new DecompressionStream(algo));
    const response = new Response(stream);
    return await response.text();
  };

  const handleCopyToClipboard = async () => {
    if (orders.length === 0) return alert("当前工作区为空。");
    
    console.log("Starting token generation from handleCopyToClipboard...");
    setIsGenerating(true);       // Spinner for '生成口令' button
    setShowQrCode(true);        // Make QR code container visible (with Loader2)
    setGeneratedToken(null);    // Clear previous token, ensures useEffect re-runs if same token generated
    setLongTokenWarning(null);  // Clear previous warning

    try {
      const minified = minifyData(orders);
      const dataStr = JSON.stringify(minified);
      const compressed = await compress(dataStr); // This is the potentially long part
      const finalToken = `PC:${compressed}`;
      
      console.log("Generated raw token length:", finalToken.length);

      // Add long token warning if necessary
      if (finalToken.length > 1500) { // Threshold for warning, can be adjusted
        setLongTokenWarning("注意：口令较长，二维码可能难以扫描。建议优先使用复制/粘贴功能。");
        console.warn("Generated token is long:", finalToken.length, "characters.");
      }
      
      await navigator.clipboard.writeText(finalToken);
      alert("Piecasso 极简口令已复制！");

      setGeneratedToken(finalToken); // Set the token, which will trigger the useEffect for QR code generation

    } catch (err) {
      console.error("口令生成失败 (handleCopyToClipboard):", err);
      alert("口令生成失败。");
      setGeneratedToken(null);
      setShowQrCode(false); // Hide QR code section on error
      setLongTokenWarning("口令生成失败，请检查数据或重试。");
    } finally {
      setIsGenerating(false); // Hides spinner
    }
  };

  const processImportToken = async (token: string) => {
    if (!token.trim()) {
      alert("口令为空，无法导入。");
      return;
    }
    setIsGenerating(true);
    setClipboardValue(token); // Display the scanned token in the input field
    try {
      let decodedData: string | null = null;
      let needsUnminify = false;

      if (token.startsWith('PC:')) {
        const encodedPart = token.split('PC:')[1].trim().replace(/[\s\n\r]/g, '');
        decodedData = await decompress(encodedPart, 'deflate');
        needsUnminify = true;
      } else if (token.includes('AZ:') || token.includes('ARTNEXUS')) {
        // 兼容旧版前缀
        const parts = token.split(':');
        const encodedPart = parts[parts.length - 1].trim().replace(/[\s\n\r]/g, '');
        decodedData = await decompress(encodedPart, 'deflate');
        needsUnminify = true;
      }

      if (!decodedData) throw new Error("Format Error");

      let parsedOrders = JSON.parse(decodedData);
      if (needsUnminify) {
        parsedOrders = unminifyData(parsedOrders);
      }
      
      if(confirm(`识别到 ${parsedOrders.length} 个企划。同步将全量更新当前设备数据，确定继续吗？`)) {
        onImportOrders?.(parsedOrders, 'replace');
        showToastAndClose("口令解析并同步完成！");
        setClipboardValue('');
      }
    } catch (e) {
      alert("口令解析失败：数据损坏或版本不兼容。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickReadClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.startsWith('PC:') || text.includes('AZ:'))) {
        setClipboardValue(text);
        processImportToken(text);
      } else {
        alert("未发现有效的 Piecasso 同步口令。");
      }
    } catch (err) {
      alert("无法读取剪贴板，请手动粘贴。");
    }
  };
  
  const handleReset = () => {
    setClipboardValue('');
    setIsGenerating(false);
    setQrCodeDataUrl(null);
    setShowQrCode(false);
    setGeneratedToken(null); // Also reset generatedToken
    setLongTokenWarning(null); // Also reset warning
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1B241D]/70 backdrop-blur-md" onClick={onClose}>
      <div className="bg-[#FDFBF7] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-[#E2E8E4] flex items-center justify-between bg-[#FDFBF7]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#3A5A40] text-white shadow-lg">
              {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2D3A30]">Piecasso 同步</h2>
              <p className="text-[10px] text-[#4F6D58] font-black uppercase tracking-widest mt-1">跨端烘焙数据方案</p>
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
                <GitMerge className="w-3 h-3 text-amber-500" /> 极简口令同步
              </h3>
            </div>
            
            <div className="grid grid-cols-3 gap-3"> {/* Changed to 3 columns for new button */}
              <button 
                onClick={handleCopyToClipboard} 
                disabled={isGenerating}
                className="flex flex-col items-center gap-2 p-5 bg-amber-50 border border-amber-100 rounded-3xl hover:bg-amber-100 transition-all group disabled:opacity-50"
              >
                <Copy className="w-5 h-5 text-amber-600" />
                <span className="text-[10px] font-bold text-amber-900">生成口令</span>
              </button>
              <button 
                onClick={async () => {
                  if (orders.length === 0) return;
                  setIsGenerating(true);
                  try {
                    const compressed = await compress(JSON.stringify(minifyData(orders)));
                    const token = `PC:${compressed}`;
                    const file = new File([token], "Piecasso口令.txt", { type: 'text/plain' });
                    await navigator.share({ files: [file], title: 'Piecasso 同步口令' });
                  } catch(e) {} finally { setIsGenerating(false); }
                }} 
                disabled={isGenerating || !supportsShare}
                className="flex flex-col items-center gap-2 p-5 bg-blue-50 border border-blue-100 rounded-3xl hover:bg-blue-100 transition-all group disabled:opacity-50"
              >
                <Share2 className="w-5 h-5 text-blue-600" />
                <span className="text-[10px] font-bold text-blue-900">发送文件</span>
              </button>
              <button 
                onClick={() => setIsScannerOpen(true)} // Open scanner modal
                disabled={isGenerating}
                className="flex flex-col items-center gap-2 p-5 bg-emerald-50 border border-emerald-100 rounded-3xl hover:bg-emerald-100 transition-all group disabled:opacity-50"
              >
                <QrCode className="w-5 h-5 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-900">扫码导入</span>
              </button>
            </div>

            {showQrCode && (
              <div className="p-8 space-y-4 text-center animate-in fade-in duration-300 bg-[#F4F1EA] rounded-3xl border border-[#D6D2C4]">
                <h4 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-[0.2em]">扫描二维码同步</h4>
                
                {longTokenWarning && (
                  <div className="p-3 bg-yellow-50 text-yellow-700 rounded-xl font-bold text-[9px] flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> {longTokenWarning}
                  </div>
                )}

                <div className="flex justify-center">
                  {qrCodeDataUrl ? (
                    <canvas ref={qrCanvasRef} className="w-64 h-64 border border-[#E2E8E4] rounded-xl bg-[#FDFBF7]" />
                  ) : (
                    <div className="w-64 h-64 border border-[#E2E8E4] rounded-xl bg-[#FDFBF7] flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-[#A8A291] animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 font-medium">长按图片可保存二维码</p>
                <button
                  onClick={() => setShowQrCode(false)}
                  className="mt-4 px-6 py-2 bg-[#FDFBF7] text-[#4B5E4F] rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#D6D2C4]/20 transition-all border border-[#D6D2C4]"
                >
                  <X className="w-3 h-3 inline-block mr-1" /> 关闭二维码
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-[#E2E8E4] space-y-4">
               <button 
                onClick={handleQuickReadClipboard} 
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-3 p-5 bg-[#3A5A40] text-white rounded-3xl hover:opacity-90 shadow-xl transition-all disabled:opacity-50"
               >
                 <ClipboardCheck className="w-5 h-5" />
                 <span className="text-[11px] font-bold uppercase tracking-widest">一键同步剪贴板</span>
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
                     // Changed: now user clicks "一键同步剪贴板" explicitly for processing.
                     // if (e.target.value.startsWith('PC:')) {
                     //   processImportToken(e.target.value);
                     // }
                   }}
                   placeholder="或手动粘贴 PC: 开头的口令..."
                   className="w-full pl-11 pr-4 py-4 bg-[#F4F1EA] border border-slate-100 rounded-2xl text-[11px] outline-none focus:border-[#3A5A40] transition-all"
                 />
               </div>
            </div>
          </div>
          
          <div className="p-6 bg-[#F4F1EA] rounded-3xl border border-[#D1D9D3] flex items-start gap-4">
            <Info className="w-4 h-4 text-[#4F6D58] mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[#2D3A30] uppercase tracking-tight">同步说明</p>
              <p className="text-[9px] text-[#4F6D58] leading-relaxed">
                Piecasso 口令经过高度压缩，体积仅为原始数据的 20% 左右。建议通过口令进行跨设备或备份操作。
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* QR Scanner Modal */}
      <QrScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={processImportToken} 
      />
    </div>
  );
};

export default SyncModal;