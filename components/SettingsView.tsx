
import React, { useState } from 'react';
import { AppSettings, StageConfig } from '../types';
import { Plus, Trash2, Save, RotateCcw, LayoutGrid, Tag, Palette, Users, Brush } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
}

const PRESET_COLORS = [
  '#CBD5E1', '#BEE3F8', '#C3DAFE', '#E9D5FF', '#BCF0DA', 
  '#FEE2E2', '#10B981', '#FDE68A', '#FCA5A5', '#DDD6FE'
];

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  const handleSave = () => {
    setSettings(localSettings);
    alert('自定义设置已更新！');
  };

  const addItem = (key: 'sources' | 'artTypes' | 'personCounts', defaultValue: string) => {
    setLocalSettings({
      ...localSettings,
      [key]: [...localSettings[key], defaultValue]
    });
  };

  const updateItem = (key: 'sources' | 'artTypes' | 'personCounts', index: number, value: string) => {
    const newList = [...localSettings[key]];
    newList[index] = value;
    setLocalSettings({ ...localSettings, [key]: newList });
  };

  const removeItem = (key: 'sources' | 'artTypes' | 'personCounts', index: number) => {
    setLocalSettings({
      ...localSettings,
      [key]: localSettings[key].filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        
        {/* 进度阶段与配色 */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-6 h-6 text-slate-900" />
              <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase">创作流程阶段</h3>
            </div>
            <button onClick={() => setLocalSettings({...localSettings, stages: [...localSettings.stages, { name: '新阶段', progress: 50, color: '#BEE3F8' }]})} className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {localSettings.stages.map((stage, idx) => (
              <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                <div className="flex items-center gap-4 mb-3">
                  <input 
                    className="bg-transparent font-bold text-sm text-slate-700 outline-none flex-1"
                    value={stage.name}
                    onChange={e => {
                      const newStages = [...localSettings.stages];
                      newStages[idx].name = e.target.value;
                      setLocalSettings({ ...localSettings, stages: newStages });
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      className="w-14 bg-white border border-slate-200 rounded-lg text-xs font-bold p-1 text-center text-slate-600"
                      value={stage.progress}
                      onChange={e => {
                        const newStages = [...localSettings.stages];
                        newStages[idx].progress = parseInt(e.target.value) || 0;
                        setLocalSettings({ ...localSettings, stages: newStages });
                      }}
                    />
                    <span className="text-[10px] font-bold text-slate-400">%</span>
                    <button onClick={() => setLocalSettings({...localSettings, stages: localSettings.stages.filter((_, i) => i !== idx)})} className="p-1.5 text-slate-300 hover:text-red-500 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                   {PRESET_COLORS.map(color => (
                     <button key={color} onClick={() => {
                        const newStages = [...localSettings.stages];
                        newStages[idx].color = color;
                        setLocalSettings({ ...localSettings, stages: newStages });
                      }}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${stage.color === color ? 'border-slate-800 scale-110 shadow-sm' : 'border-white'}`}
                      style={{ backgroundColor: color }}
                     />
                   ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-10">
          {/* 企划分类定义 */}
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Brush className="w-6 h-6 text-slate-900" />
                <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase">企划分类定义</h3>
              </div>
              <button onClick={() => addItem('artTypes', '新分类')} className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {localSettings.artTypes.map((type, idx) => (
                <div key={idx} className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl group border border-transparent hover:border-slate-200 transition-all">
                  <input className="bg-transparent font-bold text-xs text-slate-600 outline-none flex-1" value={type} onChange={e => updateItem('artTypes', idx, e.target.value)} />
                  <button onClick={() => removeItem('artTypes', idx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* 企划人数/复杂度 */}
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-slate-900" />
                <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase">人数与复杂度</h3>
              </div>
              <button onClick={() => addItem('personCounts', '新规模')} className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {localSettings.personCounts.map((count, idx) => (
                <div key={idx} className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl group border border-transparent hover:border-slate-200 transition-all">
                  <input className="bg-transparent font-bold text-xs text-slate-600 outline-none flex-1" value={count} onChange={e => updateItem('personCounts', idx, e.target.value)} />
                  <button onClick={() => removeItem('personCounts', idx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* 渠道管理 */}
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Tag className="w-6 h-6 text-slate-900" />
                <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase">接稿渠道库</h3>
              </div>
              <button onClick={() => addItem('sources', '新平台')} className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {localSettings.sources.map((source, idx) => (
                <div key={idx} className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl group border border-transparent hover:border-slate-200 transition-all">
                  <input className="bg-transparent font-bold text-[10px] text-slate-600 outline-none flex-1" value={source} onChange={e => updateItem('sources', idx, e.target.value)} />
                  <button onClick={() => removeItem('sources', idx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-5 pt-10">
        <button onClick={() => setLocalSettings(settings)} className="flex items-center justify-center gap-2 px-10 py-5 bg-white text-slate-400 border border-slate-200 rounded-2xl font-bold uppercase text-[11px] hover:bg-slate-50 transition-all">
          <RotateCcw className="w-4 h-4" /> 撤回修改
        </button>
        <button onClick={handleSave} className="flex items-center justify-center gap-2 px-14 py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase text-[11px] shadow-lg shadow-slate-100 hover:bg-slate-800 transition-all">
          <Save className="w-4 h-4" /> 应用工作区
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
