import React from 'react';
import { StudyMode, StudySessionConfig } from '../types';
import { BookOpen, Edit3, CheckSquare, Settings, Wand2, Sparkles } from 'lucide-react';

interface StudyModeSelectorProps {
  config: StudySessionConfig;
  onConfigChange: (config: StudySessionConfig) => void;
  onStartStudy: () => void;
}

/**
 * 学习模式选择组件
 * 允许用户选择不同的学习模式
 */
const StudyModeSelector: React.FC<StudyModeSelectorProps> = ({
  config,
  onConfigChange,
  onStartStudy
}) => {
  const studyModes = [
    {
      mode: StudyMode.WORD_TO_TRANSLATION,
      title: '看英语回忆汉语',
      description: '显示英语单词，回忆汉语释义',
      icon: BookOpen,
      color: '#3b82f6'
    },
    {
      mode: StudyMode.TRANSLATION_TO_WORD,
      title: '看汉语拼写英语',
      description: '显示汉语释义，拼写英语单词',
      icon: Edit3,
      color: '#10b981'
    },
    {
      mode: StudyMode.WORD_TO_CHOICE,
      title: '看英语选择汉语',
      description: '显示英语单词，四选一选择汉语释义',
      icon: CheckSquare,
      color: '#f59e0b'
    },
    {
      mode: StudyMode.AI_STORY,
      title: 'AI故事串联学习',
      description: '用AI将单词串联成故事，情境记忆',
      icon: Wand2,
      color: '#8b5cf6'
    },
    {
      mode: StudyMode.WORD_ODYSSEY,
      title: 'Word Odyssey 冒险',
      description: '交互式语言冒险RPG，在剧情中学习',
      icon: Sparkles,
      color: '#ec4899'
    }
  ];

  const handleModeChange = (mode: StudyMode) => {
    onConfigChange({ ...config, mode });
  };

  const handleSettingChange = (key: keyof StudySessionConfig, value: boolean) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="study-mode-selector">
      <div className="selector-header">
        <h2 className="selector-title">
          <Settings size={24} />
          选择学习模式
        </h2>
        <p className="selector-subtitle">选择适合您的学习方式</p>
      </div>

      <div className="mode-options">
        {studyModes.map(({ mode, title, description, icon: Icon, color }) => (
          <div
            key={mode}
            className={`mode-option ${config.mode === mode ? 'selected' : ''}`}
            onClick={() => handleModeChange(mode)}
            style={{ '--mode-color': color } as React.CSSProperties}
          >
            <div className="option-icon">
              <Icon size={24} />
            </div>
            <div className="option-content">
              <h3 className="option-title">{title}</h3>
              <p className="option-description">{description}</p>
            </div>
            <div className="option-radio">
              <div className={`radio-button ${config.mode === mode ? 'checked' : ''}`}>
                {config.mode === mode && <div className="radio-dot" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="study-settings">
        <h3 className="settings-title">学习设置</h3>
        <div className="settings-grid">
          <label className="setting-item">
            <input
              type="checkbox"
              checked={config.showPronunciation}
              onChange={(e) => handleSettingChange('showPronunciation', e.target.checked)}
            />
            <span className="setting-label">显示音标</span>
          </label>

          <label className="setting-item">
            <input
              type="checkbox"
              checked={config.showExample}
              onChange={(e) => handleSettingChange('showExample', e.target.checked)}
            />
            <span className="setting-label">显示例句</span>
          </label>

          <label className="setting-item">
            <input
              type="checkbox"
              checked={config.autoAdvance}
              onChange={(e) => handleSettingChange('autoAdvance', e.target.checked)}
            />
            <span className="setting-label">自动进入下一题</span>
          </label>
        </div>
      </div>

      <div className="selector-actions">
        <button className="btn btn-primary btn-lg" onClick={onStartStudy}>
          <BookOpen size={20} />
          开始学习
        </button>
      </div>
    </div>
  );
};

export default StudyModeSelector;
