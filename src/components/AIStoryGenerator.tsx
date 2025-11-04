import React, { useState } from 'react';
import { Word } from '../types';
import {
    generateStoryWithAI,
    generateDemoStory,
    StoryStyle,
    StoryDifficulty,
    StoryConfig,
    GeneratedStory
} from '../utils/aiStoryGenerator';
import {
    getMateState,
    completeStorySession
} from '../utils/wordMate';
import {
    getStoryGreeting,
    getStoryGenerating,
    getStoryFeedback
} from '../utils/chat';
import { BookOpen, Wand2, Volume2, Copy, Settings, Loader2, Sparkles, Award } from 'lucide-react';
import Modal from './Modal';
import MateAvatar from './MateAvatar';
import './AIStoryGenerator.css';

interface AIStoryGeneratorProps {
    words: Word[];
    onClose: () => void;
}

const AIStoryGenerator: React.FC<AIStoryGeneratorProps> = ({ words, onClose }) => {
    // 单词姬状态
    const [mateState, setMateState] = useState(getMateState());
    const [mateDialogue, setMateDialogue] = useState<string>('');
    const [showReward, setShowReward] = useState(false);
    const [rewardData, setRewardData] = useState<{
        affectionGain: number;
        expGain: number;
        leveledUp: boolean;
    } | null>(null);

    // 用户自定义场景（主要模式）
    const [userScene, setUserScene] = useState<string>('');

    // 用户自定义单词数量（null表示全部）
    const [customWordCount, setCustomWordCount] = useState<number | null>(null);

    const [config, setConfig] = useState<StoryConfig>({
        style: StoryStyle.DAILY,
        difficulty: StoryDifficulty.MEDIUM,
        includeTranslation: true
    });
    const [apiKey, setApiKey] = useState<string>(
        localStorage.getItem('deepseek_api_key') || ''
    );
    const [isGenerating, setIsGenerating] = useState(false);
    const [story, setStory] = useState<GeneratedStory | null>(null);
    const [error, setError] = useState<string>('');
    const [showSettings, setShowSettings] = useState(false);

    // 初始化时显示单词姬的开场白
    useState(() => {
        const greetings = [
            "主人，想听什么样的故事呢？✨",
            "让我来给主人讲个故事吧～你想听什么类型的？📖",
            "主人想去什么地方、遇见什么人呢？告诉我吧！💭",
            "我可以给主人讲任何故事哦～说说你的想法吧！🌟"
        ];
        setMateDialogue(greetings[Math.floor(Math.random() * greetings.length)]);
    });

    const styleOptions = [
        { value: StoryStyle.DAILY, label: '📖 日常对话', desc: '贴近生活的日常场景' },
        { value: StoryStyle.MYSTERY, label: '🔍 悬疑推理', desc: '紧张刺激，情节反转' },
        { value: StoryStyle.SCIFI, label: '🚀 科幻冒险', desc: '未来世界，充满想象' },
        { value: StoryStyle.BUSINESS, label: '💼 商务职场', desc: '专业正式的商务场景' },
        { value: StoryStyle.HUMOR, label: '😄 幽默搞笑', desc: '轻松诙谐，妙趣横生' },
        { value: StoryStyle.HISTORY, label: '🏛️ 历史穿越', desc: '穿越时空，历史冒险' }
    ];

    const difficultyOptions = [
        { value: StoryDifficulty.EASY, label: '初级', desc: '简单句式，200-300字' },
        { value: StoryDifficulty.MEDIUM, label: '中级', desc: '适中复杂度，400-600字' },
        { value: StoryDifficulty.HARD, label: '高级', desc: '复杂句式，600-800字' }
    ];

    const handleGenerate = async () => {
        if (words.length === 0) {
            setError('没有可用的单词来生成故事');
            return;
        }

        // 显示单词姬的生成提示
        setMateDialogue(getStoryGenerating(mateState.level));
        setIsGenerating(true);
        setError('');
        setStory(null);

        try {
            // 根据用户设置选择单词数量
            const targetWordCount = customWordCount !== null
                ? Math.min(customWordCount, words.length)
                : words.length; // 自动模式使用全部单词

            const selectedWords = words.slice(0, targetWordCount);

            let generatedStory: GeneratedStory;

            // 创建配置副本，添加用户自定义场景
            const configWithScene = {
                ...config,
                customScene: userScene.trim() // 传递用户的自定义场景
            };

            if (apiKey) {
                generatedStory = await generateStoryWithAI(selectedWords, configWithScene, apiKey);
            } else {
                // 没有API Key时生成示例
                generatedStory = generateDemoStory(selectedWords, configWithScene);
            }

            setStory(generatedStory);

            // 完成故事，给予奖励
            const reward = completeStorySession(
                generatedStory.words.length,
                generatedStory.content.length
            );

            // 更新单词姬状态
            setMateState(reward.state);
            setRewardData({
                affectionGain: reward.affectionGain,
                expGain: reward.expGain,
                leveledUp: reward.leveledUp
            });

            // 显示单词姬的反馈
            setMateDialogue(getStoryFeedback(
                reward.state.level,
                generatedStory.words.length,
                generatedStory.content.length,
                reward.affectionGain,
                reward.expGain
            ));

            setShowReward(true);
        } catch (err: any) {
            setError(err.message || '生成故事失败，请稍后重试');
            setMateDialogue('');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveApiKey = () => {
        localStorage.setItem('deepseek_api_key', apiKey);
        setShowSettings(false);
        alert('API Key已保存');
    };

    const handleCopyStory = () => {
        if (!story) return;
        const text = `${story.title}\n\n${story.content}${story.translation ? '\n\n中文翻译：\n' + story.translation : ''}`;
        navigator.clipboard.writeText(text);
        alert('故事已复制到剪贴板');
    };

    const handleReadAloud = () => {
        if (!story) return;
        const utterance = new SpeechSynthesisUtterance(story.content);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
    };

    return (
        <div className="ai-story-generator">
            {/* 单词姬头像区域 */}
            <div className="mate-header">
                <MateAvatar
                    mate={mateState}
                    showMoodIndicator={true}
                />
                <div className="mate-info">
                    <div className="mate-name">{mateState.name}</div>
                    <div className="mate-stats">
                        <span>Lv.{mateState.level}</span>
                        <span>💕 {mateState.affection}/200</span>
                    </div>
                </div>
            </div>

            {/* 单词姬对话气泡 */}
            {mateDialogue && (
                <div className="mate-dialogue-bubble">
                    <div className="dialogue-content">
                        {mateDialogue}
                    </div>
                </div>
            )}

            <div className="generator-header">
                <h2 className="generator-title">
                    <Wand2 size={24} />
                    AI故事串讲
                </h2>
                <p className="generator-subtitle">
                    {mateState.name}为你讲述包含 <strong>{words.length}</strong> 个单词的故事
                </p>
            </div>

            {!story && (
                <div className="generator-config">
                    {/* 用户自定义场景输入区（主要模式） */}
                    <div className="config-section scene-input-section">
                        <h3 className="config-title">✨ 描述你想要的故事场景</h3>
                        <textarea
                            className="scene-input"
                            placeholder="例如：
• 一个温馨的校园友情故事
• 关于宇宙探险的科幻故事
• 在咖啡馆里发生的温暖故事
• 解开古堡谜题的悬疑故事
• 职场新人成长的励志故事
描述你想要的氛围、场景、人物..."
                            value={userScene}
                            onChange={(e) => setUserScene(e.target.value)}
                            rows={5}
                        />
                        <p className="scene-hint">
                            💡 告诉{mateState.name}你想要什么样的故事～可以是温馨、冒险、悬疑、日常等任何风格
                        </p>
                    </div>

                    {/* 快捷风格选择（可选辅助） */}
                    <div className="config-section">
                        <h3 className="config-title">
                            💫 或者选择快捷风格
                            <span className="optional-tag">（可选）</span>
                        </h3>
                        <div className="style-grid">
                            {styleOptions.map(option => (
                                <div
                                    key={option.value}
                                    className={`style-option ${config.style === option.value ? 'selected' : ''}`}
                                    onClick={() => {
                                        setConfig({ ...config, style: option.value });
                                        // 点击快捷按钮时自动填入提示文本
                                        if (!userScene) {
                                            const sceneHints = {
                                                [StoryStyle.DAILY]: '我想要一个关于日常生活的温馨故事',
                                                [StoryStyle.MYSTERY]: '我想要一个悬疑推理的刺激故事',
                                                [StoryStyle.SCIFI]: '我想要一个科幻冒险的未来故事',
                                                [StoryStyle.BUSINESS]: '我想要一个商务职场的专业故事',
                                                [StoryStyle.HUMOR]: '我想要一个幽默搞笑的轻松故事',
                                                [StoryStyle.HISTORY]: '我想要一个历史穿越的奇妙故事'
                                            };
                                            setUserScene(sceneHints[option.value] || '');
                                        }
                                    }}
                                >
                                    <div className="style-label">{option.label}</div>
                                    <div className="style-desc">{option.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="config-section">
                        <h3 className="config-title">难度等级</h3>
                        <div className="difficulty-options">
                            {difficultyOptions.map(option => (
                                <button
                                    key={option.value}
                                    className={`difficulty-btn ${config.difficulty === option.value ? 'selected' : ''}`}
                                    onClick={() => setConfig({ ...config, difficulty: option.value })}
                                >
                                    <div className="difficulty-label">{option.label}</div>
                                    <div className="difficulty-desc">{option.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 单词数量选择器 */}
                    <div className="config-section">
                        <h3 className="config-title">📚 单词数量</h3>
                        <div className="word-count-selector">
                            <div className="word-count-presets">
                                <button
                                    className={`word-count-btn ${customWordCount === null ? 'selected' : ''}`}
                                    onClick={() => setCustomWordCount(null)}
                                >
                                    <div className="preset-label">全部</div>
                                    <div className="preset-desc">{words.length}个单词</div>
                                </button>
                                {[5, 10, 15, 20, 30].map(count => (
                                    <button
                                        key={count}
                                        className={`word-count-btn ${customWordCount === count ? 'selected' : ''}`}
                                        onClick={() => setCustomWordCount(count)}
                                        disabled={words.length < count}
                                    >
                                        <div className="preset-label">{count}个</div>
                                        <div className="preset-desc">快速学习</div>
                                    </button>
                                ))}
                            </div>
                            {customWordCount !== null && words.length < customWordCount && (
                                <div className="word-count-warning">
                                    ⚠️ 词库只有{words.length}个单词，少于设置的{customWordCount}个
                                </div>
                            )}
                            <div className="custom-word-count">
                                <label>
                                    或输入自定义数量：
                                    <input
                                        type="number"
                                        min="1"
                                        max={words.length}
                                        value={customWordCount || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val) && val > 0) {
                                                setCustomWordCount(Math.min(val, words.length));
                                            } else if (e.target.value === '') {
                                                setCustomWordCount(null);
                                            }
                                        }}
                                        placeholder="全部"
                                        className="word-count-input"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="config-section">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={config.includeTranslation}
                                onChange={(e) => setConfig({ ...config, includeTranslation: e.target.checked })}
                            />
                            <span>包含中文翻译</span>
                        </label>
                    </div>

                    {!apiKey && (
                        <div className="warning-box">
                            <p>⚠️ 未配置DeepSeek API Key，将使用示例故事</p>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(true)}>
                                <Settings size={16} />
                                配置API Key
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="error-box">
                            <p>❌ {error}</p>
                        </div>
                    )}

                    <div className="generator-actions">
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => {
                                // 如果用户有自定义场景，使用更个性化的开场白
                                if (userScene.trim()) {
                                    const customGreetings = [
                                        `好的！让我来给主人讲一个${userScene.substring(0, 20)}...的故事～✨`,
                                        `嗯嗯！关于"${userScene.substring(0, 20)}..."，我已经有灵感了！📖`,
                                        `有意思！${userScene.substring(0, 20)}...让我想想怎么编排～💭`
                                    ];
                                    setMateDialogue(customGreetings[Math.floor(Math.random() * customGreetings.length)]);
                                } else {
                                    // 没有自定义场景，使用通用开场白
                                    setMateDialogue(getStoryGreeting(mateState.level, words.length));
                                }
                                // 延迟一下再生成，让用户看到开场白
                                setTimeout(handleGenerate, 1500);
                            }}
                            disabled={isGenerating || words.length === 0}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={20} className="spin" />
                                    {mateState.name}正在构思故事...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    让{mateState.name}讲故事
                                </>
                            )}
                        </button>
                        <button className="btn btn-secondary" onClick={onClose}>
                            返回
                        </button>
                    </div>
                </div>
            )}

            {story && (
                <div className="story-result">
                    <div className="story-header">
                        <h3 className="story-title">
                            <BookOpen size={20} />
                            {story.title}
                        </h3>
                        <div className="story-meta">
                            <span className="meta-tag">{styleOptions.find(s => s.value === story.style)?.label}</span>
                            <span className="meta-tag">{difficultyOptions.find(d => d.value === story.difficulty)?.label}</span>
                        </div>
                    </div>

                    <div className="story-content">
                        <div className="content-section">
                            <h4>📖 英文故事</h4>
                            <div className="story-text">{story.content}</div>
                        </div>

                        {story.translation && (
                            <div className="content-section">
                                <h4>🇨🇳 中文翻译</h4>
                                <div className="story-text translation">{story.translation}</div>
                            </div>
                        )}

                        <div className="content-section">
                            <h4>📝 包含的单词</h4>
                            <div className="word-tags">
                                {story.words.map(word => (
                                    <span key={word.id} className="word-tag">
                                        {word.word}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="story-actions">
                        <button className="btn btn-secondary" onClick={handleCopyStory}>
                            <Copy size={16} />
                            复制故事
                        </button>
                        <button className="btn btn-secondary" onClick={handleReadAloud}>
                            <Volume2 size={16} />
                            朗读
                        </button>
                        <button className="btn btn-primary" onClick={() => setStory(null)}>
                            <Wand2 size={16} />
                            再听一个故事
                        </button>
                        <button className="btn btn-secondary" onClick={onClose}>
                            返回单词姬
                        </button>
                    </div>

                    {/* 奖励提示 */}
                    {showReward && rewardData && (
                        <div className="reward-banner">
                            <Award size={20} />
                            <div className="reward-text">
                                <span className="reward-item">💕 好感度 +{rewardData.affectionGain}</span>
                                <span className="reward-item">✨ 经验值 +{rewardData.expGain}</span>
                                {rewardData.leveledUp && (
                                    <span className="reward-item level-up">
                                        🎉 升级到 Lv.{mateState.level}！
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* API Key设置模态窗 */}
            <Modal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                title="配置DeepSeek API Key"
            >
                <div style={{ padding: '20px' }}>
                    <p style={{ marginBottom: '16px', color: '#666' }}>
                        请输入您的DeepSeek API Key。您可以在
                        <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3', marginLeft: '4px' }}>
                            DeepSeek平台
                        </a> 获取。
                    </p>
                    <input
                        type="password"
                        className="input"
                        placeholder="sk-..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        style={{ width: '100%', marginBottom: '16px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>
                            取消
                        </button>
                        <button className="btn btn-primary" onClick={handleSaveApiKey}>
                            保存
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AIStoryGenerator;
