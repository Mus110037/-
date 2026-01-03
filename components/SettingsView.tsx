
import React, { useState } from 'react';
import { AppSettings, StageConfig, SourceConfig } from '../types';
import { Plus, Trash2, Save, RotateCcw, LayoutGrid, Tag, Palette, Users, Brush, Percent } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
}

// 保留用户选定的 14 色复古同色系色板
const PRESET_COLORS = [
  '#2D3A30', // 深森林
  '#3E4D3E', // 暗苔藓
  '#6B7A6B', // 灰绿
  '#96A68A', // 浅鼠尾草
  '#D6D2C4', // 暖灰石
  '#E2DEC9', // 复古纸张
  '#7A8B8B', // 灰蓝绿
  '#D4A373', // 粘土橘
  '#B2967D', // 暖褐
  '#8B9A9A', // 钢灰
  '#4F6D58', // 标志绿
  '#263228', // 墨绿
  '#747D63', // 橄榄
  '#464D47'  // 炭黑
];

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  const handleSave = () => {
    setSettings(localSettings);
    alert('设置已成功同步。');
  };

  const removeItem = (key: 'artTypes' | 'personCounts', index: number) => {
    setLocalSettings({ ...localSettings, [key]: localSettings[key].filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* 进度阶段 */}
        <div className="bg-[#FDFBF7] p-6 md:p-8 rounded-2xl border border-[#D6D2C4] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-5 h-5 text-[#4B5E4F]" />
              <h3 className="text-sm font-bold text-[#2C332D] tracking-tight uppercase">创作流阶段配置</h3>
            </div>
            <button 
              onClick={() => setLocalSettings({...localSettings, stages: [...localSettings.stages, { name: '新阶段', progress: 50, color: '#A8A291' }]})} 
              className="p-2 bg-white border border-[#D6D2C4] rounded-xl text-[#4B5E4F] hover:bg-[#F4F1EA] transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {localSettings.stages.map((stage, idx) => (
              <div key={idx} className="p-5 bg-white rounded-xl border border-[#D6D2C4] shadow-sm transition-all">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <input 
                    className="bg-transparent font-bold text-sm text-[#2C332D] outline-none flex-1" 
                    value={stage.name} 
                    onChange={e => {
                      const newStages = [...localSettings.stages];
                      newStages[idx].name = e.target.value;
                      setLocalSettings({ ...localSettings, stages: newStages });
                    }} 
                    placeholder="阶段名称" 
                  />
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center bg-[#F4F1EA] px-2 py-1 rounded-lg border border-[#D6D2C4]">
                      <input 
                        type="number" 
                        className="w-8 bg-transparent text-xs font-bold p-0 text-center text-[#2D3A30] outline-none" 
                        value={stage.progress} 
                        onChange={e => {
                          const newStages = [...localSettings.stages];
                          newStages[idx].progress = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                          setLocalSettings({ ...localSettings, stages: newStages });
                        }} 
                      />
                      <span className="text-[10px] font-bold text-slate-400">%</span>
                    </div>
                    <button 
                      onClick={() => setLocalSettings({...localSettings, stages: localSettings.stages.filter((_, i) => i !== idx)})} 
                      className="p-1.5 text-slate-300 hover:text-rose-600 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(color => (
                    <button 
                      key={color} 
                      onClick={() => {
                        const newStages = [...localSettings.stages];
                        newStages[idx].color = color;
                        setLocalSettings({ ...localSettings, stages: newStages });
                      }} 
                      className={`w-5 h-5 rounded-md transition-all ${
                        stage.color === color 
                          ? 'ring-2 ring-offset-2 ring-[#4B5E4F] scale-110 shadow-sm' 
                          : 'hover:scale-110'
                      }`} 
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* 渠道费率 */}
          <div className="bg-[#FDFBF7] p-6 md:p-8 rounded-2xl border border-[#D6D2C4] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-[#4B5E4F]" />
                <h3 className="text-sm font-bold text-[#2C332D] tracking-tight uppercase">渠道费率设定</h3>
              </div>
              <button 
                onClick={() => setLocalSettings({...localSettings, sources: [...localSettings.sources, { name: '新渠道', fee: 0 }]})} 
                className="p-2 bg-white border border-[#D6D2C4] rounded-xl text-[#4B5E4F] hover:bg-[#F4F1EA] transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {localSettings.sources.map((source, idx) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-[#D6D2C4]">
                  <input 
                    className="bg-transparent font-bold text-sm text-[#2C332D] outline-none flex-1" 
                    value={source.name} 
                    onChange={e => {
                      const newSources = [...localSettings.sources];
                      newSources[idx].name = e.target.value;
                      setLocalSettings({ ...localSettings, sources: newSources });
                    }} 
                  />
                  <div className="flex items-center gap-1 bg-[#F4F1EA] rounded-lg border border-[#D6D2C4] px-2 py-1">
                    <Percent className="w-3 h-3 text-slate-400" />
                    <input 
                      type="number" 
                      className="w-8 bg-transparent text-xs font-bold text-[#2D3A30] outline-none text-center" 
                      value={source.fee} 
                      onChange={e => {
                        const newSources = [...localSettings.sources];
                        newSources[idx].fee = parseInt(e.target.value) || 0;
                        setLocalSettings({ ...localSettings, sources: newSources });
                      }} 
                    />
                  </div>
                  <button 
                    onClick={() => setLocalSettings({...localSettings, sources: localSettings.sources.filter((_, i) => i !== idx)})} 
                    className="text-slate-300 hover:text-rose-600 transition-all p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 稿件属性 */}
          <div className="bg-[#FDFBF7] p-6 md:p-8 rounded-2xl border border-[#D6D2C4] shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Brush className="w-5 h-5 text-[#4B5E4F]" />
              <h3 className="text-sm font-bold text-[#2C332D] tracking-tight uppercase">艺术稿件定义</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {localSettings.artTypes.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-[#D6D2C4] font-bold text-xs text-[#2C332D]">
                    {t} 
                    <button 
                      onClick={() => removeItem('artTypes', idx)} 
                      className="text-slate-300 hover:text-rose-500"
                    >
                      <Plus className="w-3.5 h-3.5 rotate-45" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => setLocalSettings({...localSettings, artTypes: [...localSettings.artTypes, '新分类']})} 
                  className="px-3 py-1.5 border border-dashed border-[#D6D2C4] rounded-lg text-slate-400 hover:border-[#4B5E4F] hover:text-[#4B5E4F] transition-all text-xs font-bold"
                >
                  + 追加标签
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
        <button 
          onClick={() => setLocalSettings(settings)} 
          className="flex items-center justify-center gap-2 px-8 py-3 bg-white text-slate-400 border border-[#D6D2C4] rounded-xl font-bold text-xs hover:bg-[#F4F1EA] transition-all"
        >
          <RotateCcw className="w-4 h-4" /> 重置修改
        </button>
        <button 
          onClick={handleSave} 
          className="flex items-center justify-center gap-2 px-10 py-3 bg-[#4B5E4F] text-white rounded-xl font-bold text-xs shadow-md hover:opacity-90 transition-all"
        >
          <Save className="w-4 h-4" /> 保存设置
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
