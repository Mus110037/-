
import React, { useState, useRef } from 'react';
import { AppSettings, StageConfig, SourceConfig } from '../types';
import { Plus, Trash2, Save, RotateCcw, LayoutGrid, Tag, Users, Brush, Percent, Check, DollarSign, Wallet, BrainCircuit, Sparkles, Loader2, GripVertical } from 'lucide-react'; // Added GripVertical

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  fullAiAnalysis: string;
  isFullAiLoading: boolean;
  onGenerateFullAiAnalysis: () => void;
  ordersLength: number; // To show "no data" message for AI analysis
}

/**
 * 重新设计的“标签感”色板 (Sticky Note Palette)
 * 1. 减少数量：从 14 减至 8，降低选择困难
 * 2. 增加色系差异：涵盖黄、橙、粉、紫、蓝、绿，像一叠分类便利贴
 * 3. 进度逻辑：从高亮浅色（起步）向稳重深色（完成）演进
 */
const PRESET_COLORS = [
  '#FFF9C4', // 经典浅黄 (构思/草稿)
  '#FFECB3', // 暖橙色 (布局/动态)
  '#FCE4EC', // 樱花粉 (线稿/色稿)
  '#F3E5F5', // 丁香紫 (底色/铺色)
  '#E3F2FD', // 晴空蓝 (刻画/光影)
  '#E8F5E9', // 薄荷绿 (细化/调整)
  '#A3B18A', // 鼠尾草绿 (收尾阶段)
  '#4B5E4F'  // 品牌深绿 (完全达成)
];

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings, fullAiAnalysis, isFullAiLoading, onGenerateFullAiAnalysis, ordersLength }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [editingArtTypeIndex, setEditingArtTypeIndex] = useState<number | null>(null);
  const [tempArtTypeName, setTempArtTypeName] = useState<string>('');

  // Drag and Drop Refs
  const draggedStageItem = useRef<number | null>(null);
  const draggedSourceItem = useRef<number | null>(null);
  const draggedArtTypeItem = useRef<number | null>(null);
  const isTouchDragging = useRef(false); // Track if a touch drag is active

  const handleSave = () => {
    setSettings(localSettings);
    alert('设置已成功同步。');
  };

  const removeItem = (key: 'artTypes' | 'personCounts', index: number) => {
    setLocalSettings({ ...localSettings, [key]: localSettings[key].filter((_, i) => i !== index) });
  };

  const handleEditArtType = (index: number, name: string) => {
    setEditingArtTypeIndex(index);
    setTempArtTypeName(name);
  };

  const saveArtTypeEdit = () => {
    if (editingArtTypeIndex !== null && tempArtTypeName.trim() !== '') {
      const newArtTypes = [...localSettings.artTypes];
      newArtTypes[editingArtTypeIndex] = tempArtTypeName.trim();
      setLocalSettings({ ...localSettings, artTypes: newArtTypes });
    }
    setEditingArtTypeIndex(null);
    setTempArtTypeName('');
  };

  // Generic Drag & Drop Handlers (Mouse)
  const handleDragStart = (e: React.DragEvent, index: number, type: 'stages' | 'sources' | 'artTypes') => {
    if (isTouchDragging.current) return; // Prevent mouse drag if touch drag is active
    e.dataTransfer.effectAllowed = "move";
    if (type === 'stages') draggedStageItem.current = index;
    else if (type === 'sources') draggedSourceItem.current = index;
    else if (type === 'artTypes') draggedArtTypeItem.current = index;
    e.currentTarget.classList.add('drag-active');
  };

  const handleDragEnter = (e: React.DragEvent, index: number, type: 'stages' | 'sources' | 'artTypes') => {
    e.preventDefault();
    let currentDraggedItem: number | null = null;
    if (type === 'stages') currentDraggedItem = draggedStageItem.current;
    else if (type === 'sources') currentDraggedItem = draggedSourceItem.current;
    else if (type === 'artTypes') currentDraggedItem = draggedArtTypeItem.current;

    if (currentDraggedItem !== null && currentDraggedItem !== index) {
      e.currentTarget.classList.add('drag-over-target');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over-target');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-active');
    document.querySelectorAll('.drag-over-target').forEach(el => el.classList.remove('drag-over-target')); // Clear all targets
    draggedStageItem.current = null;
    draggedSourceItem.current = null;
    draggedArtTypeItem.current = null;
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number, type: 'stages' | 'sources' | 'artTypes') => {
    e.preventDefault();
    let currentDraggedItem: number | null = null;
    if (type === 'stages') currentDraggedItem = draggedStageItem.current;
    else if (type === 'sources') currentDraggedItem = draggedSourceItem.current;
    else if (type === 'artTypes') currentDraggedItem = draggedArtTypeItem.current;

    if (currentDraggedItem === null || currentDraggedItem === dropIndex) {
      e.currentTarget.classList.remove('drag-over-target');
      return;
    }

    const items = [...(localSettings as any)[type]];
    const [draggedContent] = items.splice(currentDraggedItem, 1);
    items.splice(dropIndex, 0, draggedContent);

    setLocalSettings({ ...localSettings, [type]: items });

    e.currentTarget.classList.remove('drag-over-target');
  };

  // --- Touch Drag & Drop Handlers ---
  const handleTouchStart = (e: React.TouchEvent, index: number, type: 'stages' | 'sources' | 'artTypes') => {
    isTouchDragging.current = true;
    if (type === 'stages') draggedStageItem.current = index;
    else if (type === 'sources') draggedSourceItem.current = index;
    else if (type === 'artTypes') draggedArtTypeItem.current = index;
    e.currentTarget.classList.add('drag-active'); // Apply visual feedback
    e.preventDefault(); // Prevent scrolling and other default touch behaviors
  };

  const handleTouchEnd = (e: React.TouchEvent, type: 'stages' | 'sources' | 'artTypes') => {
    e.currentTarget.classList.remove('drag-active'); // Remove visual feedback from dragged item
    document.querySelectorAll('.drag-over-target').forEach(el => el.classList.remove('drag-over-target')); // Clear any potential target highlights

    let currentDraggedItem: number | null = null;
    if (type === 'stages') currentDraggedItem = draggedStageItem.current;
    else if (type === 'sources') currentDraggedItem = draggedSourceItem.current;
    else if (type === 'artTypes') currentDraggedItem = draggedArtTypeItem.current;

    if (currentDraggedItem === null) {
      isTouchDragging.current = false;
      return;
    }

    const touchedElement = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    let dropTargetElement: HTMLElement | null = null;
    let dropIndex: number | null = null;

    // Traverse up to find a droppable parent
    let current = touchedElement as HTMLElement;
    while (current) {
        if (current.dataset.index && current.dataset.type === type) {
            dropTargetElement = current;
            dropIndex = parseInt(current.dataset.index, 10);
            break;
        }
        current = current.parentElement as HTMLElement;
    }

    if (dropTargetElement && dropIndex !== null && currentDraggedItem !== dropIndex) {
      const items = [...(localSettings as any)[type]];
      const [draggedContent] = items.splice(currentDraggedItem, 1);
      items.splice(dropIndex, 0, draggedContent);
      setLocalSettings({ ...localSettings, [type]: items });
    }

    draggedStageItem.current = null;
    draggedSourceItem.current = null;
    draggedArtTypeItem.current = null;
    isTouchDragging.current = false;
    e.preventDefault(); // Keep preventing default to finish the gesture cleanly
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24">
      {/* Global Drag & Drop Styles and Toggle Switch Styles are now in index.html */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* 进度阶段 */}
        <div className="bg-[#FDFBF7] p-6 md:p-8 rounded-2xl border border-[#D6D2C4] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-5 h-5 text-[#4B5E4F]" />
              <h3 className="text-sm font-bold text-[#2C332D] tracking-tight uppercase">创作流阶段配置</h3>
            </div>
            <button 
              onClick={() => setLocalSettings({...localSettings, stages: [...localSettings.stages, { name: '新阶段', progress: 50, color: PRESET_COLORS[0] }]})} 
              className="p-2 bg-[#FDFBF7] border border-[#D6D2C4] rounded-xl text-[#4B5E4F] hover:bg-[#F4F1EA] transition-all"
              aria-label="添加新阶段"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {localSettings.stages.map((stage, idx) => (
              <div 
                key={idx} 
                data-index={idx} /* Add data-index for touch drop target identification */
                data-type="stages" /* Add data-type for touch drop target identification */
                className={`group p-5 bg-[#FDFBF7] rounded-xl border border-[#D6D2C4] shadow-sm transition-all flex flex-col gap-4`}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, idx, 'stages')}
                onDragEnter={(e) => handleDragEnter(e, idx, 'stages')}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, idx, 'stages')}
                onTouchStart={(e) => handleTouchStart(e, idx, 'stages')}
                onTouchEnd={(e) => handleTouchEnd(e, 'stages')}
              >
                {/* Top row: GripVertical, Stage Name, Progress %, Delete Button */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <GripVertical className="w-5 h-5 text-slate-400 cursor-grab shrink-0" aria-label="拖拽调整顺序" />
                    <input 
                      className="bg-transparent font-bold text-sm text-[#2C332D] outline-none flex-1 truncate" 
                      value={stage.name} 
                      onChange={e => {
                        const newStages = [...localSettings.stages];
                        newStages[idx].name = e.target.value;
                        setLocalSettings({ ...localSettings, stages: newStages });
                      }} 
                      placeholder="阶段名称" 
                    />
                  </div>
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
                      className="p-1.5 text-slate-300 hover:text-rose-600 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      aria-label="删除阶段"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Color Picker & Presets */}
                <div className="flex flex-wrap gap-2.5 items-center w-full justify-start">
                  <span className="text-[9px] font-bold text-[#7A8B7C] uppercase mr-1 shrink-0">颜色:</span>
                  {/* Custom Color Input */}
                  <input
                    type="color"
                    value={stage.color}
                    onChange={e => {
                      const newStages = [...localSettings.stages];
                      newStages[idx].color = e.target.value;
                      setLocalSettings({ ...localSettings, stages: newStages });
                    }}
                    className="w-8 h-8 rounded-lg border-2 border-slate-200 cursor-pointer overflow-hidden transition-all hover:scale-105"
                    title="自定义颜色"
                  />
                  {/* Preset Colors */}
                  {PRESET_COLORS.map(color => (
                    <button 
                      key={color} 
                      onClick={() => {
                        const newStages = [...localSettings.stages];
                        newStages[idx].color = color;
                        setLocalSettings({ ...localSettings, stages: newStages });
                      }} 
                      className={`w-8 h-8 rounded-lg transition-all border shadow-sm ${
                        stage.color === color 
                          ? 'ring-2 ring-offset-2 ring-[#4B5E4F] scale-110' 
                          : 'hover:scale-105 border-slate-100'
                      }`} 
                      style={{ backgroundColor: color }}
                      title={color}
                      aria-label={`选择预设颜色 ${color}`}
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
                className="p-2 bg-[#FDFBF7] border border-[#D6D2C4] rounded-xl text-[#4B5E4F] hover:bg-[#F4F1EA] transition-all"
                aria-label="添加新渠道"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {localSettings.sources.map((source, idx) => (
                <div 
                  key={idx} 
                  data-index={idx} /* Add data-index for touch drop target identification */
                  data-type="sources" /* Add data-type for touch drop target identification */
                  className={`group flex items-center gap-3 px-4 py-3 bg-[#FDFBF7] rounded-xl border border-[#D6D2C4] transition-all`}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, idx, 'sources')}
                  onDragEnter={(e) => handleDragEnter(e, idx, 'sources')}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, idx, 'sources')}
                  onTouchStart={(e) => handleTouchStart(e, idx, 'sources')}
                  onTouchEnd={(e) => handleTouchEnd(e, 'sources')}
                >
                  <GripVertical className="w-5 h-5 text-slate-400 cursor-grab shrink-0" aria-label="拖拽调整顺序" />
                  <input 
                    className="bg-transparent font-bold text-sm text-[#2C332D] outline-none flex-1" 
                    value={source.name} 
                    onChange={e => {
                      const newSources = [...localSettings.sources];
                      newSources[idx].name = e.target.value;
                      setLocalSettings({ ...localSettings, sources: newSources });
                    }} 
                    placeholder="渠道名称"
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
                    className="p-1.5 text-slate-300 hover:text-rose-600 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    aria-label="删除渠道"
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
            <div className="flex flex-wrap gap-2">
              {localSettings.artTypes.map((t, idx) => (
                <div 
                  key={idx} 
                  data-index={idx} /* Add data-index for touch drop target identification */
                  data-type="artTypes" /* Add data-type for touch drop target identification */
                  className={`relative group transition-all flex items-center gap-2 px-3 py-1.5 bg-[#FDFBF7] rounded-lg border border-[#D6D2C4] font-bold text-xs text-[#2C332D] hover:border-[#4B5E4F]`}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, idx, 'artTypes')}
                  onDragEnter={(e) => handleDragEnter(e, idx, 'artTypes')}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, idx, 'artTypes')}
                  onTouchStart={(e) => handleTouchStart(e, idx, 'artTypes')}
                  onTouchEnd={(e) => handleTouchEnd(e, 'artTypes')}
                >
                  <GripVertical className="w-4 h-4 text-slate-400 cursor-grab shrink-0" aria-label="拖拽调整顺序" />
                  {editingArtTypeIndex === idx ? (
                    <input
                      type="text"
                      value={tempArtTypeName}
                      onChange={e => setTempArtTypeName(e.target.value)}
                      onBlur={saveArtTypeEdit}
                      onKeyDown={e => { if (e.key === 'Enter') saveArtTypeEdit(); }}
                      className="bg-transparent outline-none flex-1"
                      autoFocus
                      aria-label="编辑艺术分类"
                    />
                  ) : (
                    <button 
                      onClick={(e) => {e.stopPropagation(); handleEditArtType(idx, t);}}
                      className="flex items-center gap-2 flex-1 text-left"
                      aria-label={`编辑分类 ${t}`}
                    >
                      {t} 
                    </button>
                  )}
                  {editingArtTypeIndex !== idx && (
                    <Plus 
                      className="w-3.5 h-3.5 rotate-45 text-slate-300 group-hover:text-rose-500 cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100" 
                      onClick={(e) => { e.stopPropagation(); removeItem('artTypes', idx); }}
                      aria-label="删除艺术分类"
                    />
                  )}
                </div>
              ))}
              <button 
                onClick={() => setLocalSettings({...localSettings, artTypes: [...localSettings.artTypes, '新分类']})} 
                className="px-3 py-1.5 border border-dashed border-[#D6D2C4] rounded-lg text-slate-400 hover:border-[#4B5E4F] hover:text-[#4B5E4F] transition-all text-xs font-bold"
                aria-label="追加新标签"
              >
                + 追加标签
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI 智能助手设置 */}
      <div className="bg-[#FDFBF7] p-6 md:p-8 rounded-2xl border border-[#D6D2C4] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-5 h-5 text-[#4B5E4F]" />
            <h3 className="text-sm font-bold text-[#2C332D] tracking-tight uppercase">AI 智能助手</h3>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={localSettings.showAiUI} 
              onChange={e => setLocalSettings({...localSettings, showAiUI: e.target.checked})} 
              aria-label="切换 AI 智能助手功能"
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {localSettings.showAiUI && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-[9px] text-[#4F6D58] font-black uppercase tracking-widest mt-1">开启后，可在各页面获取智能见解与报告。</p>
            
            <div className="bg-[#FDFBF7] rounded-2xl p-6 md:p-10 border border-[#D6D2C4] max-w-full mx-auto mt-4 text-center card-baked-shadow">
              <div className="bg-[#4B5E4F] w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <BrainCircuit className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-4 text-[#2D3A30] tracking-tight">AI 饼托 | 完整报告</h2>
              <p className="text-[10px] text-[#4F6D58] font-black uppercase tracking-widest mb-6">全方位智能分析您的创作企划</p>

              <button 
                onClick={onGenerateFullAiAnalysis} 
                disabled={isFullAiLoading}
                className="w-full bg-[#4B5E4F] text-white py-4 rounded-xl font-bold hover:opacity-95 shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                aria-label="生成完整 AI 报告"
              >
                {isFullAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isFullAiLoading ? "正在生成中..." : "生成完整报告"}
              </button>

              {fullAiAnalysis && (
                <div className="mt-8 text-left bg-[#F4F1EA] p-6 rounded-2xl border border-[#D6D2C4] custom-scrollbar max-h-[500px] overflow-y-auto">
                  <h3 className="text-[10px] font-black text-[#4F6D58] uppercase tracking-[0.2em] mb-4">报告内容</h3>
                  <div 
                    className="text-[11px] text-[#2D3A30] leading-relaxed markdown-body"
                    // Marked library needs to be imported and used
                    dangerouslySetInnerHTML={{ __html: fullAiAnalysis }} 
                  />
                </div>
              )}
              {!fullAiAnalysis && !isFullAiLoading && ordersLength === 0 && (
                <div className="mt-8 text-center bg-[#F4F1EA] p-6 rounded-2xl border border-[#D6D2C4] text-[#A8A291]">
                  <p className="text-[10px] font-black uppercase tracking-widest">没有数据，无法生成完整报告。请先添加企划。</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>


      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
        <button 
          onClick={() => setLocalSettings(settings)} 
          className="flex items-center justify-center gap-2 px-8 py-3 bg-[#FDFBF7] text-slate-400 border border-[#D6D2C4] rounded-xl font-bold text-xs hover:bg-[#F4F1EA] transition-all"
          aria-label="重置所有设置修改"
        >
          <RotateCcw className="w-4 h-4" /> 重置修改
        </button>
        <button 
          onClick={handleSave} 
          className="flex items-center justify-center gap-2 px-10 py-3 bg-[#4B5E4F] text-white rounded-xl font-bold text-xs shadow-md hover:opacity-90 transition-all"
          aria-label="保存所有设置"
        >
          <Save className="w-4 h-4" /> 保存设置
        </button>
      </div>
    </div>
  );
};

export default SettingsView;