
import React, { useState, useRef, useEffect } from 'react';
import { X, QrCode, AlertTriangle, Loader2 } from 'lucide-react';
import { BrowserMultiFormatReader, DecodeHintType } from '@zxing/library';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (token: string) => void;
}

const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reader = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      if (reader.current) {
        reader.current.reset(); // Stop scanning and free camera resources
      }
      setError(null);
      setLoading(true);
      return;
    }

    // Initialize ZXing reader
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BrowserMultiFormatReader.QR_CODE]);
    reader.current = new BrowserMultiFormatReader(hints, 500); // Scan every 500ms

    const startScanner = async () => {
      setError(null);
      setLoading(true);
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (videoInputDevices.length > 0) {
          const selectedDeviceId = videoInputDevices[0].deviceId;
          if (videoRef.current) {
            // Start decoding from the video stream
            reader.current.decodeFromConstraints(
              {
                video: { deviceId: selectedDeviceId },
              },
              videoRef.current,
              (result, err) => {
                if (result) {
                  const scannedText = result.getText();
                  console.log("QR Code Scanned:", scannedText);
                  if (scannedText.startsWith('PC:')) { // Only process Piecasso tokens
                    onScan(scannedText);
                    onClose(); // Close modal on successful scan
                  }
                }
                if (err && !reader.current?.stopped) { // Only log if it's an actual error, not just no result
                    // console.warn("No QR code detected yet or scanning error:", err);
                }
              }
            );
            setLoading(false);
          }
        } else {
          setError("未检测到摄像头。请确保设备有可用摄像头。");
          setLoading(false);
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError("摄像头权限被拒绝。请在浏览器设置中允许访问摄像头。");
        } else if (err.name === 'NotFoundError') {
          setError("未检测到摄像头。请确保设备有可用摄像头。");
        } else {
          setError(`启动摄像头失败: ${err.message}`);
        }
        setLoading(false);
        console.error("Camera access error:", err);
      }
    };

    startScanner();

    return () => {
      if (reader.current) {
        reader.current.reset(); // Stop scanning and free camera resources when component unmounts or closes
      }
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#1B241D]/90 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-[#FDFBF7] w-full max-w-lg h-auto min-h-[400px] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-[#E2E8E4] flex items-center justify-between bg-[#FDFBF7]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#3A5A40] text-white shadow-lg">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2D3A30]">扫码导入</h2>
              <p className="text-[10px] text-[#4F6D58] font-black uppercase tracking-widest mt-1">从二维码同步数据</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 p-8 flex flex-col items-center justify-center relative bg-[#F4F1EA]">
          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-[#4F6D58]">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest">正在启动摄像头...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center gap-4 text-center p-4 text-rose-700 bg-rose-50 rounded-xl border border-rose-100 max-w-xs z-10">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-sm font-bold">{error}</p>
              <button onClick={onClose} className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all">关闭</button>
            </div>
          )}

          {!loading && !error && (
            <>
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover z-0" playsInline muted></video>
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="w-64 h-64 border-4 border-[#3A5A40] rounded-xl relative">
                  <span className="absolute -top-6 text-[10px] font-black uppercase tracking-widest text-[#FDFBF7] bg-[#3A5A40] px-3 py-1 rounded-full">请对准二维码</span>
                  {/* Corners for visual guide */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white opacity-70"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white opacity-70"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white opacity-70"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white opacity-70"></div>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="p-8 border-t border-[#E2E8E4] bg-[#FDFBF7] flex justify-center">
          <button onClick={onClose} className="px-6 py-3 bg-[#D6D2C4]/20 text-[#4B5E4F] rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#D6D2C4]/40 transition-all">取消</button>
        </div>
      </div>
    </div>
  );
};

export default QrScannerModal;