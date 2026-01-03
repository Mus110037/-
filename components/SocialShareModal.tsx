
import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Share2, Sparkles, Camera, Quote } from 'lucide-react';
import { Order } from '../types';
import { GoogleGenAI } from '@google/genai';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

const SocialShareModal: React.FC<SocialShareModalProps> = ({ isOpen, onClose, orders }) => {
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState("一笔一画，皆是修行。");
  const cardRef = useRef<HTMLDivElement>(null);

  const completedCount = orders.filter(o => o.progressStage === '成稿').length;
  const totalValue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  useEffect(() => {
    if (isOpen) {
      generateQuote();
    }
  }, [isOpen]);

  const generateQuote = async () => {
    setLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `基于以下插画师数据生成一条符合“侘寂风”或“禅宗”意境的简短社交分享语（30字以内）：完成企划 ${completedCount} 项，总产值 ¥${totalValue}。`,
      });
      setQuote(response.text?.trim() || "在繁杂中寻找宁静，在创作中见证圆满。");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <div className="bg-[#FDFCF9] dark:bg-slate-950 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        
        <div className="p-6 flex justify-between items-center border-b border-[#E6E2D3] dark:border-slate-800">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">生成创作报告卡片</h3>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-all text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-8 space-y-8">
           {/* 分享卡片预览区 */}
           <div ref={cardRef} className="aspect-[3/4] bg-[#F9F7F2] dark:bg-slate-900 rounded-[2rem] border border-[#E6E2D3] dark:border-slate-800 p-8 flex flex-col justify-between shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E6E2D3]/20 dark:bg-slate-800/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              
              <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">ArtPulse / 艺脉</p>
                <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">本月创作纪要</h4>
                <div className="w-10 h-0.5 bg-slate-900 dark:bg-slate-100 mt-4"></div>
              </div>

              <div className="space-y-6 relative z-10">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">已封笔项</p>
                       <p className="text-xl font-black text-slate-900 dark:text-slate-100">{completedCount} <span className="text-[10px]">Projects</span></p>
                    </div>
                    <div className="space-y-1 text-right">
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">创作估值</p>
                       <p className="text-xl font-black text-slate-900 dark:text-slate-100">¥{(totalValue/1000).toFixed(1)}k</p>
                    </div>
                 </div>
                 
                 <div className="p-6 bg-white dark:bg-slate-950/50 rounded-2xl border border-[#E6E2D3] dark:border-slate-800 flex flex-col gap-3 italic">
                    <Quote className="w-3 h-3 text-slate-300" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                      {loading ? "正在参悟文案..." : quote}
                    </p>
                 </div>
              </div>

              <div className="flex justify-between items-end relative z-10">
                 <div>
                    <p className="text-[8px] font-bold text-slate-400">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-[7px] text-slate-300 uppercase tracking-widest mt-0.5">Verified by ArtPulse AI</p>
                 </div>
                 <div className="w-12 h-12 bg-slate-900 dark:bg-slate-100 rounded-xl flex items-center justify-center text-white dark:text-slate-900 shadow-lg">
                    <Sparkles className="w-5 h-5" />
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={generateQuote}
                className="py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                <Sparkles className="w-4 h-4" /> 重写文案
              </button>
              <button 
                className="py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:opacity-90 transition-all"
              >
                <Camera className="w-4 h-4" /> 截图分享
              </button>
           </div>
           
           <p className="text-center text-[9px] text-slate-400 font-medium">长按上图即可保存至相册，或直接截图分享</p>
        </div>
      </div>
    </div>
  );
};

export default SocialShareModal;
