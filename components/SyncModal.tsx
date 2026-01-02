
import React, { useState } from 'react';
import { X, Copy, Download, Link, CheckCircle2, Info, Globe, FileSpreadsheet, Calendar as CalendarIcon, ExternalLink, Zap } from 'lucide-react';
import { Order } from '../types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, orders }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sheets' | 'calendar'>('sheets');

  if (!isOpen) return null;

  // 将数据转换为 TSV 格式
  const handleCopyTSV = () => {
    const headers = ['标题', '优先级', '金额', '来源', '截止日期', '录入日期', '分类', '状态', '进度', '备注'];
    const rows = orders.map(o => [
      o.title,
      o.priority,
      o.totalPrice,
      o.source,
      o.deadline,
      o.createdAt,
      o.artType,
      o.status,
      o.progressStage,
      o.description.replace(/\n/g, ' ')
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadCSV = () => {
    const headers = ['Title,Priority,Price,Source,Deadline,CreatedAt,Type,Status,Progress,Description'];
    const rows = orders.map(o => {
      return `"${o.title}","${o.priority}",${o.totalPrice},"${o.source}","${o.deadline}","${o.createdAt}","${o.artType}","${o.status}","${o.progressStage}","${o.description.replace(/"/g, '""')}"`;
    });
    const csvContent = "\uFEFF" + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ArtNexus_Sheets_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 生成 iCal (.ics) 文件内容
  const handleExportICS = () => {
    const formatDate = (dateStr: string) => {
      return dateStr.replace(/-/g, '');
    };

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ArtNexus Pro//Creative Schedule//CN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ].join('\r\n');

    orders.forEach(order => {
      const ddl = formatDate(order.deadline);
      icsContent += '\r\n' + [
        'BEGIN:VEVENT',
        `UID:${order.id}@artnexus.pro`,
        `DTSTAMP:${formatDate(new Date().toISOString().split('T')[0])}T000000Z`,
        `DTSTART;VALUE=DATE:${ddl}`,
        `SUMMARY:[DDL] ${order.title} (${order.source})`,
        `DESCRIPTION:类别: ${order.artType}\\n金额: ¥${order.totalPrice}\\n备注: ${order.description.replace(/\n/g, '\\n')}`,
        'STATUS:CONFIRMED',
        'TRANSP:TRANSPARENT',
        'END:VEVENT'
      ].join('\r\n');
    });

    icsContent += '\r\nEND:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ArtNexus_Deadlines_${new Date().toISOString().split('T')[0]}.ics`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl transition-colors ${activeTab === 'sheets' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
              {activeTab === 'sheets' ? <FileSpreadsheet className="w-6 h-6" /> : <CalendarIcon className="w-6 h-6" />}
            </div>
            <h2 className="text-xl font-bold text-slate-900">数据同步中心</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-8 pt-6 flex gap-2">
          <button 
            onClick={() => setActiveTab('sheets')}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all border ${activeTab === 'sheets' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
          >
            Google Sheets
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all border ${activeTab === 'calendar' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
          >
            Google Calendar
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
             <Zap className="w-3.5 h-3.5 text-amber-500" />
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">当前同步模式：一键式半自动 (隐私安全模式)</span>
          </div>

          {activeTab === 'sheets' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">推荐操作</h3>
                </div>
                <button 
                  onClick={handleCopyTSV}
                  className={`w-full group relative flex items-center gap-4 p-5 rounded-3xl border-2 transition-all ${
                    copied ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:border-emerald-200 hover:bg-white'
                  }`}
                >
                  <div className={`p-3 rounded-xl transition-colors ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 group-hover:text-emerald-500 shadow-sm'}`}>
                    {copied ? <CheckCircle2 className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                  </div>
                  <div className="text-left">
                    <p className={`font-bold ${copied ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {copied ? '已复制到剪贴板！' : '一键格式化复制 (TSV)'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">复制后在 Google Sheets 中直接粘贴即可</p>
                  </div>
                </button>
              </div>
              <button 
                onClick={handleDownloadCSV}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-violet-200 transition-all font-bold text-sm text-slate-600"
              >
                <Download className="w-4 h-4" /> 下载 CSV 文件备份
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-blue-900 text-sm">全量 DDL 同步 (ICS)</h3>
                </div>
                <p className="text-xs text-blue-600/80 leading-relaxed mb-6">
                  抓取所有未完成订单的截稿日，生成标准日历包。
                </p>
                <button 
                  onClick={handleExportICS}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                  <Download className="w-4 h-4" /> 生成并下载日历文件
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">导入指南</p>
                <a 
                  href="https://calendar.google.com/calendar/u/0/r/settings/export" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-xs font-bold text-slate-600">前往 Google 日历设置页</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                </a>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-50">
            <div className="flex items-start gap-2 p-4 bg-violet-50/50 rounded-2xl">
              <Info className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
              <div className="text-[10px] text-violet-600/80 leading-relaxed">
                <p className="font-bold mb-1">为什么不是全自动实时同步？</p>
                <p>为了保障您的数据不被第三方服务器存储。目前的一键复制方案无需授权，且能完美适配 Google 表格的任意列布局。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
