
import React, { useState } from 'react';
import { AppSettings, StageConfig, SourceConfig } from '../types';
import { Plus, Trash2, Save, RotateCcw, LayoutGrid, Tag, Palette, Users, Brush, Percent } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
}

const PRESET_COLORS = ['#94A3B8', '#3B82F6', '#6366F1', '#A855F7', '#10B981', '#F43F5E', '#1E293B'];

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  const handleSave = () => {
    setSettings(localSettings);
    alert('工作区设置已更新！系统将根据新费率重新计算实收。');
  };

  const removeItem = (key: 'artTypes' | 'personCounts', index: number) => {
    setLocalSettings({ ...localSettings, [key]: localSettings[key].filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        {/* 进度阶段 */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-5 h-5 text-slate-900" />
              <h3 className="text-lg font-bold text-slate-900 tracking-tight uppercase">创作流阶段</h3>
            </div>
            <button onClick={() => setLocalSettings({...localSettings, stages: [...localSettings.stages, { name: '新阶段', progress: 50, color: '#94A3B8' }]})} className="p-2.5 bg-slate-50 text-slate-900 rounded-xl hover:bg-slate-100 border border-slate-200 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {localSettings.stages.map((stage, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4 mb-3">
                  <input className="bg-transparent font-bold text-sm text-slate-900 outline-none flex-1" value={stage.name} onChange={e => {
                    const newStages = [...localSettings.stages];
                    newStages[idx].name = e.target.value;
                    setLocalSettings({ ...localSettings, stages: newStages });
                  }} />
                  <div className="flex items-center gap-2">
                    <input type="number" className="w-12 bg-white border border-slate-200 rounded-lg text-xs font-bold p-1 text-center text-slate-900" value={stage.progress} onChange={e => {
                      const newStages = [...localSettings.stages];
                      newStages[idx].progress = parseInt(e.target.value) || 0;
                      setLocalSettings({ ...localSettings, stages: newStages });
                    }} />
                    <span className="text-[10px] font-bold text-slate-400">%</span>
                    <button onClick={() => setLocalSettings({...localSettings, stages: localSettings.stages.filter((_, i) => i !== idx)})} className="p-1.5 text-slate-300 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(color => (
                    <button key={color} onClick={() => {
                      const newStages = [...localSettings.stages];
                      newStages[idx].color = color;
                      setLocalSettings({ ...localSettings, stages: newStages });
                    }} className={`w-6 h-6 rounded-full border-2 transition-all ${stage.color === color ? 'border-slate-900 scale-110' : 'border-white'}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-10">
          {/* 接稿渠道与费率 */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-slate-900" />
                <h3 className="text-lg font-bold text-slate-900 tracking-tight uppercase">接稿渠道与手续费率</h3>
              </div>
              <button onClick={() => setLocalSettings({...localSettings, sources: [...localSettings.sources, { name: '新渠道', fee: 0 }]})} className="p-2.5 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 transition-all">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {localSettings.sources.map((source, idx) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 group transition-all">
                  <input className="bg-transparent font-bold text-xs text-slate-900 outline-none flex-1" value={source.name} onChange={e => {
                    const newSources = [...localSettings.sources];
                    newSources[idx].name = e.target.value;
                    setLocalSettings({ ...localSettings, sources: newSources });
                  }} />
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                    <Percent className="w-2.5 h-2.5 text-slate-400" />
                    <input type="number" className="w-8 bg-transparent text-[10px] font-bold text-slate-900 outline-none text-center" value={source.fee} onChange={e => {
                      const newSources = [...localSettings.sources];
                      newSources[idx].fee = parseInt(e.target.value) || 0;
                      setLocalSettings({ ...localSettings, sources: newSources });
                    }} />
                  </div>
                  <button onClick={() => setLocalSettings({...localSettings, sources: localSettings.sources.filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* 其他配置 */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8 px-2">
              <Brush className="w-5 h-5 text-slate-900" />
              <h3 className="text-lg font-bold text-slate-900 tracking-tight uppercase">稿件属性库</h3>
            </div>
            <div className="space-y-8">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">艺术分类</p>
                <div className="flex flex-wrap gap-2">
                  {localSettings.artTypes.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[11px] text-slate-900">
                      {t} <button onClick={() => removeItem('artTypes', idx)} className="text-slate-300 hover:text-red-500"><Plus className="w-3.5 h-3.5 rotate-45" /></button>
                    </div>
                  ))}
                  <button onClick={() => setLocalSettings({...localSettings, artTypes: [...localSettings.artTypes, '新分类']})} className="px-4 py-2 border border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all text-[11px] font-bold">追加分类</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-10">
        <button onClick={() => setLocalSettings(settings)} className="flex items-center justify-center gap-2 px-10 py-5 bg-white text-slate-500 border border-slate-200 rounded-2xl font-bold uppercase text-[11px] hover:bg-slate-50 transition-all">
          <RotateCcw className="w-4 h-4" /> 撤回重置
        </button>
        <button onClick={handleSave} className="flex items-center justify-center gap-2 px-14 py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase text-[11px] shadow-xl hover:bg-slate-800 transition-all">
          <Save className="w-4 h-4" /> 应用并锁定设置
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
