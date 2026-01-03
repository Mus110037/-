
import React, { useState } from 'react';
import { AppSettings, StageConfig, SourceConfig } from '../types';
import { Plus, Trash2, Save, RotateCcw, LayoutGrid, Tag, Palette, Users, Brush, Percent } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
}

// 模拟 Apple 系统配色方案：鲜亮色系 & 沉稳深色
const PRESET_COLORS = [
  '#8E8E93', // Gray
  '#007AFF', // Blue
  '#5856D6', // Indigo
  '#AF52DE', // Purple
  '#34C759', // Green
  '#FF2D55', // Pink
  '#1C1C1E', // Dark
  '#FF9500', // Orange
  '#FF3B30', // Red
  '#5AC8FA', // Teal
  '#FFCC00', // Yellow
  '#A3B18A', // Sage
  '#3A5A40', // Forest
  '#2D3A30'  // Deep
];

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  const handleSave = () => {
    setSettings(localSettings);
    alert('保存成功！\n\n已有的企划订单将自动应用新费率、颜色及名称变更。');
  };

  const removeItem = (key: 'artTypes' | 'personCounts', index: number) => {
    setLocalSettings({ ...localSettings, [key]: localSettings[key].filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-10">
        
        {/* 进度阶段 */}
        <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 md:mb-8 px-1">
            <div className="flex items-center gap-2 md:gap-3">
              <LayoutGrid className="w-4 h-4 md:w-5 md:h-5 text-slate-900" />
              <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight uppercase">创作流阶段</h3>
            </div>
            <button onClick={() => setLocalSettings({...localSettings, stages: [...localSettings.stages, { name: '新阶段', progress: 50, color: '#8E8E93' }]})} className="p-2 bg-slate-50 text-slate-900 rounded-xl hover:bg-slate-100 border border-slate-200 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {localSettings.stages.map((stage, idx) => (
              <div key={idx} className="p-4 md:p-5 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <input className="bg-transparent font-black text-sm text-slate-900 outline-none flex-1 min-w-0" value={stage.name} onChange={e => {
                    const newStages = [...localSettings.stages];
                    newStages[idx].name = e.target.value;
                    setLocalSettings({ ...localSettings, stages: newStages });
                  }} placeholder="阶段名称" />
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                      <input type="number" className="w-8 bg-transparent text-xs font-black p-0 text-center text-slate-900 outline-none" value={stage.progress} onChange={e => {
                        const newStages = [...localSettings.stages];
                        newStages[idx].progress = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                        setLocalSettings({ ...localSettings, stages: newStages });
                      }} />
                      <span className="text-[10px] font-black text-slate-400">%</span>
                    </div>
                    <button onClick={() => setLocalSettings({...localSettings, stages: localSettings.stages.filter((_, i) => i !== idx)})} className="p-1.5 text-slate-300 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {PRESET_COLORS.map(color => (
                    <button 
                      key={color} 
                      onClick={() => {
                        const newStages = [...localSettings.stages];
                        newStages[idx].color = color;
                        setLocalSettings({ ...localSettings, stages: newStages });
                      }} 
                      className={`w-6 h-6 md:w-7 md:h-7 rounded-full border transition-all relative ${
                        stage.color === color 
                          ? 'scale-110 shadow-lg' 
                          : 'border-white hover:scale-110'
                      }`} 
                      style={{ 
                        backgroundColor: color,
                        borderColor: stage.color === color ? '#2D3A30' : 'transparent',
                        boxShadow: stage.color === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 md:space-y-10">
          {/* 接稿渠道与费率 */}
          <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6 md:mb-8 px-1">
              <div className="flex items-center gap-2 md:gap-3">
                <Tag className="w-4 h-4 md:w-5 md:h-5 text-slate-900" />
                <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight uppercase">渠道费率</h3>
              </div>
              <button onClick={() => setLocalSettings({...localSettings, sources: [...localSettings.sources, { name: '新渠道', fee: 0 }]})} className="p-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 transition-all">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {localSettings.sources.map((source, idx) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 group transition-all">
                  <input className="bg-transparent font-bold text-xs text-slate-900 outline-none flex-1 min-w-0" value={source.name} onChange={e => {
                    const newSources = [...localSettings.sources];
                    newSources[idx].name = e.target.value;
                    setLocalSettings({ ...localSettings, sources: newSources });
                  }} />
                  <div className="flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-1 rounded-lg shrink-0">
                    <Percent className="w-2 h-2 md:w-2.5 md:h-2.5 text-slate-400" />
                    <input type="number" className="w-6 md:w-8 bg-transparent text-[9px] md:text-[10px] font-bold text-slate-900 outline-none text-center" value={source.fee} onChange={e => {
                      const newSources = [...localSettings.sources];
                      newSources[idx].fee = parseInt(e.target.value) || 0;
                      setLocalSettings({ ...localSettings, sources: newSources });
                    }} />
                  </div>
                  <button onClick={() => setLocalSettings({...localSettings, sources: localSettings.sources.filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-red-600 transition-all p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* 其他配置 */}
          <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-8 px-1">
              <Brush className="w-4 h-4 md:w-5 md:h-5 text-slate-900" />
              <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight uppercase">稿件属性库</h3>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">艺术分类</p>
                <div className="flex flex-wrap gap-2">
                  {localSettings.artTypes.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[10px] md:text-[11px] text-slate-900">
                      {t} <button onClick={() => removeItem('artTypes', idx)} className="text-slate-300 hover:text-red-500 p-0.5"><Plus className="w-3 h-3 rotate-45" /></button>
                    </div>
                  ))}
                  <button onClick={() => setLocalSettings({...localSettings, artTypes: [...localSettings.artTypes, '新分类']})} className="px-3 py-1.5 md:px-4 md:py-2 border border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all text-[10px] md:text-[11px] font-bold">追加分类</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 pt-6 md:pt-10 px-1">
        <button onClick={() => setLocalSettings(settings)} className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-white text-slate-500 border border-slate-200 rounded-2xl font-bold uppercase text-[10px] md:text-[11px] hover:bg-slate-50 transition-all">
          <RotateCcw className="w-4 h-4" /> 撤回重置
        </button>
        <button onClick={handleSave} className="flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase text-[10px] md:text-[11px] shadow-xl hover:bg-slate-800 transition-all">
          <Save className="w-4 h-4" /> 保存设置
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
