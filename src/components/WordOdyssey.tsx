import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../types';
import {
    AdventureTheme,
    GameMode,
    AdventureConfig,
    AdventureSession,
    StoryNode,
    PlayerResponse,
    THEME_INFO,
    generateAdventureStory,
    evaluateWordUsage,
    generateAdventureSummary,
    initializeWordEnergies,
    updateWordEnergy
} from '../utils/wordOdyssey';
import {
    Play,
    Send,
    Settings,
    Zap,
    Award,
    TrendingUp,
    BookOpen,
    ArrowLeft,
    Loader2,
    CheckCircle,
    XCircle,
    Sparkles
} from 'lucide-react';
import Modal from './Modal';
import './WordOdyssey.css';

interface WordOdysseyProps {
    words: Word[];
    onClose: () => void;
}

const WordOdyssey: React.FC<WordOdysseyProps> = ({ words, onClose }) => {
    // 配置状态
    const [config, setConfig] = useState<AdventureConfig>({
        theme: AdventureTheme.FANTASY,
        mode: GameMode.GUIDED,
        difficulty: 'medium',
        sessionDuration: 15
    });

    const [apiKey, setApiKey] = useState<string>(
        localStorage.getItem('deepseek_api_key') || ''
    );
    const [showSettings, setShowSettings] = useState(false);

    // 游戏状态
    const [gameState, setGameState] = useState<'config' | 'playing' | 'summary'>('config');
    const [session, setSession] = useState<AdventureSession | null>(null);
    const [currentNode, setCurrentNode] = useState<StoryNode | null>(null);
    const [playerInput, setPlayerInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    // 总结数据
    const [summary, setSummary] = useState<any>(null);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    // 滚动到底部
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [session?.storyNodes, session?.playerResponses]);

    // 开始冒险
    const handleStartAdventure = async () => {
        if (!apiKey) {
            setShowSettings(true);
            return;
        }

        if (words.length === 0) {
            setError('没有可用的单词来创建冒险');
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            // 根据单词数量自适应选择单词（最多50个）
            const maxWords = Math.min(words.length, 50);
            const selectedWords = words.slice(0, maxWords);

            // 初始化会话
            const newSession: AdventureSession = {
                id: `session_${Date.now()}`,
                config,
                words: selectedWords,
                wordEnergies: initializeWordEnergies(selectedWords),
                storyNodes: [],
                playerResponses: [],
                startTime: Date.now(),
                completed: false
            };

            // 生成第一个故事节点
            const firstNode = await generateAdventureStory(
                newSession.words,
                config,
                [],
                null,
                apiKey
            );

            newSession.storyNodes.push(firstNode);
            setSession(newSession);
            setCurrentNode(firstNode);
            setGameState('playing');
        } catch (err: any) {
            setError(err.message || '开始冒险失败，请稍后重试');
        } finally {
            setIsGenerating(false);
        }
    };

    // 处理选择
    const handleChoice = async (choiceId: string, choiceText: string) => {
        if (!session || !currentNode) return;

        setIsGenerating(true);
        setError('');

        try {
            const response: PlayerResponse = {
                text: choiceText,
                usedWords: [],
                timestamp: Date.now()
            };

            // 找到选择对应的目标单词
            const choice = currentNode.choices?.find(c => c.id === choiceId);
            const targetWord = choice?.targetWord;

            // 评估词汇使用（即使是选择题，也要评估并给予能量奖励）
            let updatedEnergies = new Map(session.wordEnergies);

            if (targetWord) {
                // 在引导模式下，选择包含目标词的选项，自动给予能量奖励
                const evaluations = await evaluateWordUsage(
                    choiceText,
                    session.words,
                    apiKey
                );

                evaluations.forEach(evaluation => {
                    const updated = updateWordEnergy(updatedEnergies, evaluation);
                    if (updated) {
                        response.usedWords.push(evaluation.word);
                    }
                });

                // 如果没有检测到词汇使用，但选项明确标注了目标词，给予基础奖励
                if (evaluations.length === 0 && targetWord) {
                    const wordToReward = session.words.find(
                        w => w.word.toLowerCase() === targetWord.toLowerCase()
                    );
                    if (wordToReward) {
                        const mockEvaluation = {
                            word: wordToReward.word,
                            correct: true,
                            feedback: '选择了正确的行动！',
                            energyChange: 10
                        };
                        updateWordEnergy(updatedEnergies, mockEvaluation);
                        response.usedWords.push(wordToReward.word);
                    }
                }
            }

            // 更新会话
            const updatedSession = {
                ...session,
                wordEnergies: updatedEnergies
            };
            updatedSession.playerResponses.push(response);
            setSession(updatedSession);

            // 生成下一个节点
            await generateNextNode(updatedSession, response);
        } catch (err: any) {
            setError(err.message || '处理选择失败');
        } finally {
            setIsGenerating(false);
        }
    };

    // 处理自由输入
    const handleFreeResponse = async () => {
        if (!session || !currentNode || !playerInput.trim()) return;

        setIsGenerating(true);
        setError('');

        try {
            const response: PlayerResponse = {
                text: playerInput,
                usedWords: [],
                timestamp: Date.now()
            };

            // 评估词汇使用
            const evaluations = await evaluateWordUsage(
                playerInput,
                session.words,
                apiKey
            );

            // 更新能量值
            const updatedEnergies = new Map(session.wordEnergies);
            evaluations.forEach(evaluation => {
                const updated = updateWordEnergy(updatedEnergies, evaluation);
                if (updated) {
                    response.usedWords.push(evaluation.word);
                }
            });

            // 更新会话
            const updatedSession = {
                ...session,
                wordEnergies: updatedEnergies
            };
            updatedSession.playerResponses.push(response);
            setSession(updatedSession);
            setPlayerInput('');

            // 显示反馈
            if (evaluations.length > 0) {
                // TODO: 显示词汇使用反馈动画
            }

            // 生成下一个节点
            await generateNextNode(updatedSession, response);
        } catch (err: any) {
            setError(err.message || '处理回答失败');
        } finally {
            setIsGenerating(false);
        }
    };

    // 生成下一个故事节点
    const generateNextNode = async (
        currentSession: AdventureSession,
        lastResponse: PlayerResponse
    ) => {
        setIsGenerating(true);

        try {
            // 检查是否应该结束
            const progress = calculateProgress(currentSession);
            const currentRound = currentSession.storyNodes.length;
            const wordCount = currentSession.words.length;

            // 根据单词数量自适应调整通关要求
            const requirements = calculateCompletionRequirements(wordCount, currentRound, progress);

            // 通关条件（满足任一即可）：
            // 1. 进度达标且满足最小轮数
            // 2. 达到最大轮数限制
            if (requirements.shouldComplete) {
                await finishAdventure(currentSession);
                return;
            }

            // 生成新节点
            const nextNode = await generateAdventureStory(
                currentSession.words,
                currentSession.config,
                currentSession.storyNodes,
                lastResponse,
                apiKey
            );

            const updatedSession = { ...currentSession };
            updatedSession.storyNodes.push(nextNode);
            setSession(updatedSession);
            setCurrentNode(nextNode);
        } catch (err: any) {
            setError(err.message || '生成剧情失败');
        } finally {
            setIsGenerating(false);
        }
    };

    // 计算通关要求（根据单词数量自适应）
    const calculateCompletionRequirements = (
        wordCount: number,
        currentRound: number,
        progress: number
    ): {
        minRounds: number;
        maxRounds: number;
        targetProgress: number;
        shouldComplete: boolean;
    } => {
        let minRounds: number;
        let maxRounds: number;
        let targetProgress: number;

        // 根据单词数量分段调整
        if (wordCount <= 5) {
            // 1-5个单词：快速模式
            minRounds = 3;
            maxRounds = 6;
            targetProgress = 80;
        } else if (wordCount <= 10) {
            // 6-10个单词：标准模式
            minRounds = 5;
            maxRounds = 10;
            targetProgress = 75;
        } else if (wordCount <= 20) {
            // 11-20个单词：适中模式
            minRounds = 6;
            maxRounds = 14;
            targetProgress = 70;
        } else if (wordCount <= 30) {
            // 21-30个单词：长期模式
            minRounds = 8;
            maxRounds = 18;
            targetProgress = 65;
        } else {
            // 30+个单词：超长模式
            minRounds = 10;
            maxRounds = 25;
            targetProgress = 60;
        }

        // 判断是否应该完成
        const progressMet = progress >= targetProgress && currentRound >= minRounds;
        const maxRoundsMet = currentRound >= maxRounds;
        const shouldComplete = progressMet || maxRoundsMet;

        return {
            minRounds,
            maxRounds,
            targetProgress,
            shouldComplete
        };
    };

    // 完成冒险
    const finishAdventure = async (currentSession: AdventureSession) => {
        setIsGenerating(true);

        try {
            currentSession.endTime = Date.now();
            currentSession.completed = true;

            const adventureSummary = await generateAdventureSummary(currentSession, apiKey);
            setSummary(adventureSummary);
            setGameState('summary');
        } catch (err: any) {
            setError('生成总结失败');
        } finally {
            setIsGenerating(false);
        }
    };

    // 计算进度
    const calculateProgress = (currentSession: AdventureSession): number => {
        const energies = Array.from(currentSession.wordEnergies.values());
        const totalEnergy = energies.reduce((sum, e) => sum + e.energy, 0);
        const maxEnergy = energies.length * 100;
        return (totalEnergy / maxEnergy) * 100;
    };

    // 保存 API Key
    const handleSaveApiKey = () => {
        localStorage.setItem('deepseek_api_key', apiKey);
        setShowSettings(false);
        alert('API Key已保存');
    };

    // 渲染配置界面
    const renderConfigScreen = () => (
        <div className="odyssey-config">
            <div className="config-header">
                <h2>
                    <Sparkles size={24} />
                    Word Odyssey
                </h2>
                <p className="config-subtitle">交互式语言冒险 RPG</p>
            </div>

            <div className="config-section">
                <h3>选择冒险主题</h3>
                <div className="theme-grid">
                    {Object.entries(THEME_INFO).map(([key, info]) => (
                        <button
                            key={key}
                            className={`theme-card ${config.theme === key ? 'selected' : ''}`}
                            onClick={() => setConfig({ ...config, theme: key as AdventureTheme })}
                        >
                            <span className="theme-icon">{info.icon}</span>
                            <span className="theme-name">{info.name}</span>
                            <span className="theme-desc">{info.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="config-section">
                <h3>游戏模式</h3>
                <div className="mode-options">
                    <button
                        className={`mode-btn ${config.mode === GameMode.GUIDED ? 'selected' : ''}`}
                        onClick={() => setConfig({ ...config, mode: GameMode.GUIDED })}
                    >
                        <BookOpen size={20} />
                        <div>
                            <div className="mode-name">引导模式</div>
                            <div className="mode-desc">选择题为主，适合初学者</div>
                        </div>
                    </button>
                    <button
                        className={`mode-btn ${config.mode === GameMode.FREE ? 'selected' : ''}`}
                        onClick={() => setConfig({ ...config, mode: GameMode.FREE })}
                    >
                        <Sparkles size={20} />
                        <div>
                            <div className="mode-name">自由模式</div>
                            <div className="mode-desc">开放输入，挑战更高</div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="config-section">
                <h3>难度等级</h3>
                <div className="difficulty-options">
                    {['easy', 'medium', 'hard'].map((level) => (
                        <button
                            key={level}
                            className={`difficulty-btn ${config.difficulty === level ? 'selected' : ''}`}
                            onClick={() => setConfig({ ...config, difficulty: level as any })}
                        >
                            {level === 'easy' && '⭐ 初级'}
                            {level === 'medium' && '⭐⭐ 中级'}
                            {level === 'hard' && '⭐⭐⭐ 高级'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="config-info">
                {(() => {
                    const wordCount = Math.min(words.length, 50); // 最多50个单词
                    let requirements;

                    if (wordCount <= 5) {
                        requirements = { min: 3, max: 6, progress: 80 };
                    } else if (wordCount <= 10) {
                        requirements = { min: 5, max: 10, progress: 75 };
                    } else if (wordCount <= 20) {
                        requirements = { min: 6, max: 14, progress: 70 };
                    } else if (wordCount <= 30) {
                        requirements = { min: 8, max: 18, progress: 65 };
                    } else {
                        requirements = { min: 10, max: 25, progress: 60 };
                    }

                    return (
                        <>
                            <p>📚 本次冒险将使用 <strong>{wordCount}</strong> 个单词</p>
                            <p>🎯 通关要求: 进度达到 <strong>{requirements.progress}%</strong> + 至少 <strong>{requirements.min}</strong> 轮互动</p>
                            <p>⏱️ 预计时长: <strong>{requirements.min}-{requirements.max}</strong> 轮互动 (约 {Math.ceil(requirements.max * 1.5)} 分钟)</p>
                        </>
                    );
                })()}
            </div>

            <div className="config-actions">
                <button className="btn btn-secondary" onClick={onClose}>
                    <ArrowLeft size={16} />
                    返回
                </button>
                <button className="btn btn-secondary" onClick={() => setShowSettings(true)}>
                    <Settings size={16} />
                    API设置
                </button>
                <button
                    className="btn btn-primary btn-lg"
                    onClick={handleStartAdventure}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={20} className="spin" />
                            生成中...
                        </>
                    ) : (
                        <>
                            <Play size={20} />
                            开始冒险
                        </>
                    )}
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}
        </div>
    );

    // 渲染游戏界面
    const renderGameScreen = () => {
        if (!session || !currentNode) return null;

        const progress = calculateProgress(session);
        const energies = Array.from(session.wordEnergies.values());

        return (
            <div className="odyssey-game">
                {/* 顶部进度栏 */}
                <div className="game-header">
                    <div className="progress-section">
                        <div className="progress-label">
                            <TrendingUp size={16} />
                            整体进度
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="progress-text">{progress.toFixed(0)}%</span>
                    </div>

                    <div className="word-energies">
                        {energies.map(energy => (
                            <div key={energy.wordId} className="energy-badge" title={energy.word}>
                                <Zap
                                    size={14}
                                    className={energy.unlocked ? 'unlocked' : ''}
                                />
                                <span>{energy.energy}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 故事内容区 */}
                <div className="game-content" ref={chatContainerRef}>
                    {session.storyNodes.map((node, idx) => (
                        <div key={node.id} className="story-segment">
                            <div className="story-narrative">
                                <div className="narrative-icon">📖</div>
                                <div className="narrative-text">{node.narrative}</div>
                            </div>

                            {session.playerResponses[idx] && (
                                <div className="player-response">
                                    <div className="response-icon">👤</div>
                                    <div className="response-text">
                                        {session.playerResponses[idx].text}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {isGenerating && (
                        <div className="generating-indicator">
                            <Loader2 size={24} className="spin" />
                            <span>AI 正在编织剧情...</span>
                        </div>
                    )}
                </div>

                {/* 交互区 */}
                {!isGenerating && (
                    <div className="game-interaction">
                        {config.mode === GameMode.GUIDED && currentNode.choices ? (
                            <div className="choices-container">
                                <p className="interaction-prompt">选择你的行动:</p>
                                {currentNode.choices.map(choice => (
                                    <button
                                        key={choice.id}
                                        className="choice-btn"
                                        onClick={() => handleChoice(choice.id, choice.text)}
                                    >
                                        <span className="choice-text">{choice.text}</span>
                                        {choice.targetWord && (
                                            <span className="choice-word">
                                                <Zap size={12} />
                                                {choice.targetWord}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="input-container">
                                <p className="interaction-prompt">
                                    {currentNode.openPrompt || '你会如何回应？'}
                                </p>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="用英文输入你的回答..."
                                        value={playerInput}
                                        onChange={(e) => setPlayerInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleFreeResponse()}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleFreeResponse}
                                        disabled={!playerInput.trim()}
                                    >
                                        <Send size={16} />
                                        发送
                                    </button>
                                </div>
                                <div className="target-words-hint">
                                    <Sparkles size={14} />
                                    目标词汇: {currentNode.targetWords.join(', ')}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}
            </div>
        );
    };

    // 渲染总结界面
    const renderSummaryScreen = () => {
        if (!session || !summary) return null;

        const energies = Array.from(session.wordEnergies.values());

        return (
            <div className="odyssey-summary">
                <div className="summary-header">
                    <Award size={48} className="summary-icon" />
                    <h2>冒险完成！</h2>
                    <p className="summary-subtitle">你的语言之旅统计</p>
                </div>

                <div className="summary-stats">
                    <div className="stat-card">
                        <div className="stat-value">{summary.unlockedWords}/{summary.totalWords}</div>
                        <div className="stat-label">解锁单词</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{(summary.correctUsageRate * 100).toFixed(0)}%</div>
                        <div className="stat-label">正确率</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{summary.totalInteractions}</div>
                        <div className="stat-label">互动次数</div>
                    </div>
                </div>

                <div className="word-details">
                    <h3>单词掌握情况</h3>
                    <div className="word-list">
                        {energies.map(energy => (
                            <div key={energy.wordId} className="word-item">
                                <div className="word-header">
                                    <span className="word-name">{energy.word}</span>
                                    {energy.unlocked ? (
                                        <CheckCircle size={20} className="icon-success" />
                                    ) : (
                                        <XCircle size={20} className="icon-muted" />
                                    )}
                                </div>
                                <div className="word-stats">
                                    <div className="energy-bar">
                                        <div
                                            className="energy-fill"
                                            style={{ width: `${energy.energy}%` }}
                                        />
                                    </div>
                                    <span className="energy-text">{energy.energy}/100</span>
                                </div>
                                <div className="word-usage">
                                    使用 {energy.correctUses}/{energy.totalAttempts} 次
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="insights-section">
                    <h3>学习洞察</h3>
                    <div className="insights-list">
                        {summary.insights.map((insight: string, idx: number) => (
                            <div key={idx} className="insight-item">
                                <Sparkles size={16} />
                                <span>{insight}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="summary-actions">
                    <button className="btn btn-secondary" onClick={() => setGameState('config')}>
                        <Play size={16} />
                        再来一次
                    </button>
                    <button className="btn btn-primary" onClick={onClose}>
                        <CheckCircle size={16} />
                        完成
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="word-odyssey">
            {gameState === 'config' && renderConfigScreen()}
            {gameState === 'playing' && renderGameScreen()}
            {gameState === 'summary' && renderSummaryScreen()}

            {/* API Key设置模态窗 */}
            <Modal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                title="配置 DeepSeek API Key"
            >
                <div style={{ padding: '20px' }}>
                    <p style={{ marginBottom: '16px', color: '#666' }}>
                        Word Odyssey 需要 DeepSeek API 来生成动态冒险故事。
                        <a
                            href="https://platform.deepseek.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#2196F3', marginLeft: '4px' }}
                        >
                            获取 API Key
                        </a>
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
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowSettings(false)}
                        >
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

export default WordOdyssey;
