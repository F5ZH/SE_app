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
    pregenerateNextNodes,
    evaluateWordUsage,
    generateAdventureSummary,
    initializeWordEnergies,
    updateWordEnergy,
    checkGrammarInstantly
} from '../utils/wordOdyssey';
import {
    getMateState,
    completeOdysseySession
} from '../utils/wordMate';
import {
    getOdysseyGreeting,
    getOdysseyGoodChoice,
    getOdysseyEnergyUp,
    getOdysseyCompletion
} from '../utils/chat';
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
import MateAvatar from './MateAvatar';
import './WordOdyssey.css';

interface WordOdysseyProps {
    words: Word[];
    onClose: () => void;
}

const WordOdyssey: React.FC<WordOdysseyProps> = ({ words, onClose }) => {
    // 单词姬状态
    const [mateState, setMateState] = useState(getMateState());
    const [mateDialogue, setMateDialogue] = useState<string>('');

    // 用户自定义冒险场景（主要模式）
    const [userAdventure, setUserAdventure] = useState<string>('');

    // 用户自定义单词数量（null表示自动）
    const [customWordCount, setCustomWordCount] = useState<number | null>(null);

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

    // 自由模式相关状态
    const [showGuidance, setShowGuidance] = useState(false); // 是否显示引导（默认隐藏，鼓励自主思考）
    const [instantFeedback, setInstantFeedback] = useState<any>(null); // 即时反馈
    const [isChecking, setIsChecking] = useState(false); // 是否正在检查

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // 初始化时显示单词姬的开场白
    useState(() => {
        const greetings = [
            "主人，想去哪里冒险呢？✨",
            "让我带主人展开一段精彩的冒险吧～你想去什么地方？🗺️",
            "主人想探索什么样的世界呢？告诉我吧！💭",
            "我可以带主人去任何地方冒险哦～说说你的想法！🌟"
        ];
        setMateDialogue(greetings[Math.floor(Math.random() * greetings.length)]);
    });

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

        // 单词姬对话已在按钮点击时设置，这里不再重复

        setIsGenerating(true);
        setError('');

        try {
            // 根据用户设置或自适应选择单词数量
            const targetWordCount = customWordCount !== null
                ? Math.min(customWordCount, words.length)
                : Math.min(words.length, 50); // 自动模式最多50个

            const selectedWords = words.slice(0, targetWordCount);

            // 创建配置副本，添加用户自定义冒险
            const configWithAdventure = {
                ...config,
                customAdventure: userAdventure.trim() // 传递用户的自定义冒险
            };

            // 初始化会话
            const newSession: AdventureSession = {
                id: `session_${Date.now()}`,
                config: configWithAdventure,
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
                configWithAdventure,
                [],
                null,
                apiKey
            );

            newSession.storyNodes.push(firstNode);
            setSession(newSession);
            setCurrentNode(firstNode);
            setGameState('playing');
            // 开始游戏时，指导默认隐藏，鼓励用户自主思考
            setShowGuidance(false);

            // 🚀 异步预生成第一个节点的所有后续选项（不阻塞UI）
            if (configWithAdventure.mode === GameMode.GUIDED && firstNode.choices && firstNode.choices.length > 0) {
                pregenerateNextNodes(
                    firstNode,
                    newSession.words,
                    configWithAdventure,
                    [],
                    apiKey
                ).then(nextNodesMap => {
                    // 更新节点的预生成内容
                    firstNode.nextNodes = nextNodesMap;
                    // 标记选项已预生成
                    firstNode.choices?.forEach(choice => {
                        if (nextNodesMap.has(choice.id)) {
                            choice.pregenerated = true;
                        }
                    });
                    console.log('✅ 首节点预生成完成');
                }).catch(err => {
                    console.error('预生成失败（不影响游戏）:', err);
                });
            }
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
                        // 单词姬赞扬好的选择
                        if (evaluation.correct && evaluation.energyChange > 0) {
                            setMateDialogue(getOdysseyGoodChoice(mateState.level, evaluation.word));
                            // 显示能量提升提示
                            setTimeout(() => {
                                setMateDialogue(getOdysseyEnergyUp(mateState.level, evaluation.energyChange));
                            }, 2000);
                        }
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
                        // 单词姬赞扬
                        setMateDialogue(getOdysseyGoodChoice(mateState.level, wordToReward.word));
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

            // 🚀 优先使用预生成的节点，没有才实时生成
            if (currentNode.nextNodes && currentNode.nextNodes.has(choiceId)) {
                console.log('✨ 使用预生成的节点，零延迟！');
                const pregeneratedNode = currentNode.nextNodes.get(choiceId)!;

                // 更新会话
                updatedSession.storyNodes.push(pregeneratedNode);
                setSession(updatedSession);
                setCurrentNode(pregeneratedNode);
                setShowGuidance(false);

                // 🚀 立即异步预生成这个节点的后续选项
                if (session.config.mode === GameMode.GUIDED && pregeneratedNode.choices && pregeneratedNode.choices.length > 0) {
                    pregenerateNextNodes(
                        pregeneratedNode,
                        updatedSession.words,
                        updatedSession.config,
                        updatedSession.storyNodes,
                        apiKey
                    ).then(nextNodesMap => {
                        pregeneratedNode.nextNodes = nextNodesMap;
                        pregeneratedNode.choices?.forEach(choice => {
                            if (nextNodesMap.has(choice.id)) {
                                choice.pregenerated = true;
                            }
                        });
                        console.log('✅ 预生成完成');
                    }).catch(err => {
                        console.error('预生成失败（不影响游戏）:', err);
                    });
                }

                setIsGenerating(false);
            } else {
                // 没有预生成，实时生成
                console.log('⏳ 实时生成节点...');
                await generateNextNode(updatedSession, response);
            }
        } catch (err: any) {
            setError(err.message || '处理选择失败');
            setIsGenerating(false);
        }
    };

    // 处理输入变化（带防抖的即时检查）
    const handleInputChange = (value: string) => {
        setPlayerInput(value);
        setInstantFeedback(null);

        // 清除之前的定时器
        if (inputDebounceRef.current) {
            clearTimeout(inputDebounceRef.current);
        }

        // 如果输入为空或太短，不检查
        if (!value || value.trim().length < 5) {
            return;
        }

        // 设置新的防抖定时器（1秒后检查）
        inputDebounceRef.current = setTimeout(async () => {
            setIsChecking(true);
            try {
                const feedback = await checkGrammarInstantly(value, apiKey);
                setInstantFeedback(feedback);
            } catch (err) {
                console.error('即时检查失败:', err);
            } finally {
                setIsChecking(false);
            }
        }, 1000);
    };

    // 处理自由输入
    const handleFreeResponse = async () => {
        if (!session || !currentNode || !playerInput.trim()) return;

        setIsGenerating(true);
        setError('');
        setInstantFeedback(null); // 清除即时反馈

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
            // 新节点生成时，重置指导为隐藏状态，鼓励用户自主思考
            setShowGuidance(false);

            // 🚀 生成完成后立即异步预生成后续选项
            if (currentSession.config.mode === GameMode.GUIDED && nextNode.choices && nextNode.choices.length > 0) {
                pregenerateNextNodes(
                    nextNode,
                    updatedSession.words,
                    updatedSession.config,
                    updatedSession.storyNodes,
                    apiKey
                ).then(nextNodesMap => {
                    nextNode.nextNodes = nextNodesMap;
                    nextNode.choices?.forEach(choice => {
                        if (nextNodesMap.has(choice.id)) {
                            choice.pregenerated = true;
                        }
                    });
                    console.log('✅ 预生成完成');
                }).catch(err => {
                    console.error('预生成失败（不影响游戏）:', err);
                });
            }
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
            maxRounds = 8;
            targetProgress = 60; // 降低要求，但需要至少60%
        } else if (wordCount <= 10) {
            // 6-10个单词：标准模式
            minRounds = 5;
            maxRounds = 12;
            targetProgress = 55;
        } else if (wordCount <= 20) {
            // 11-20个单词：适中模式
            minRounds = 8;
            maxRounds = 18;
            targetProgress = 50;
        } else if (wordCount <= 30) {
            // 21-30个单词：长期模式
            minRounds = 10;
            maxRounds = 22;
            targetProgress = 45;
        } else {
            // 30+个单词：超长模式
            minRounds = 12;
            maxRounds = 30;
            targetProgress = 40;
        }

        // 判断是否应该完成
        // 必须同时满足：1) 达到最小轮数 AND 2) 达到目标进度
        // 或者：达到最大轮数限制（防止无限循环）
        const progressMet = progress >= targetProgress && currentRound >= minRounds;
        const maxRoundsMet = currentRound >= maxRounds;

        // 重要：只有在有实质性进度的情况下才能完成
        // 如果进度太低（<20%），即使达到最大轮数也要求至少达到20%
        const hasMinimalProgress = progress >= 20;
        const shouldComplete = progressMet || (maxRoundsMet && hasMinimalProgress);

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

            // 计算奖励
            const sessionDuration = Math.round((currentSession.endTime! - currentSession.startTime) / 60000); // 分钟
            const wordsUsed = adventureSummary.unlockedWords; // 解锁的单词数即为使用过的单词数
            const totalWords = currentSession.words.length;
            const turnsCount = currentSession.storyNodes.length;

            const reward = completeOdysseySession(
                wordsUsed,
                totalWords,
                turnsCount,
                sessionDuration
            );

            // 更新单词姬状态
            setMateState(reward.state);

            // 显示单词姬的总结评价
            setMateDialogue(getOdysseyCompletion(
                reward.state.level,
                wordsUsed,
                totalWords,
                reward.affectionGain,
                reward.expGain
            ));

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
            {/* 单词姬头像 */}
            <div className="mate-companion-card">
                <MateAvatar
                    mate={mateState}
                    showMoodIndicator={true}
                />
                <div className="companion-info">
                    <div className="companion-title">
                        <Sparkles size={16} />
                        <span>{mateState.name}陪你冒险</span>
                    </div>
                    <div className="companion-desc">
                        在冒险中灵活运用单词，{mateState.name}会为你加油打气！
                    </div>
                </div>
            </div>

            <div className="config-header">
                <h2>
                    <Sparkles size={24} />
                    Word Odyssey
                </h2>
                <p className="config-subtitle">交互式语言冒险 RPG</p>
            </div>

            {/* 用户自定义冒险场景（主要模式） */}
            <div className="config-section adventure-input-section">
                <h3>
                    ✨ 描述你想要的冒险
                </h3>
                <textarea
                    className="adventure-input"
                    placeholder="例如：
• 在温馨的咖啡馆遇见有趣的人
• 探索神秘的古代图书馆
• 在未来城市体验高科技生活
• 和朋友一起野营、观察星空
• 在魔法学院学习各种魔法
描述你想要的氛围和场景，可以是轻松的、冒险的、温馨的..."
                    value={userAdventure}
                    onChange={(e) => setUserAdventure(e.target.value)}
                    rows={5}
                />
                <p className="adventure-hint">
                    💡 告诉{mateState.name}你想要什么样的冒险～可以是探索、日常、交友、学习等任何场景
                </p>
            </div>

            {/* 快捷主题选择（可选辅助） */}
            <div className="config-section">
                <h3>
                    💫 或者选择快捷主题
                    <span className="optional-tag">（可选）</span>
                </h3>
                <div className="theme-grid">
                    {Object.entries(THEME_INFO).map(([key, info]) => (
                        <button
                            key={key}
                            className={`theme-card ${config.theme === key ? 'selected' : ''}`}
                            onClick={() => {
                                setConfig({ ...config, theme: key as AdventureTheme });
                                // 点击快捷主题时自动填入提示文本
                                if (!userAdventure) {
                                    const adventureHints: Record<string, string> = {
                                        [AdventureTheme.FANTASY]: '我想在魔法世界展开奇幻冒险',
                                        [AdventureTheme.MYSTERY]: '我想在神秘城市破解悬案',
                                        [AdventureTheme.SCIFI]: '我想探索未知的星际空间',
                                        [AdventureTheme.ROMANCE]: '我想经历一段浪漫的恋爱故事',
                                        [AdventureTheme.WORKPLACE]: '我想在职场中挑战自己',
                                        [AdventureTheme.CAMPUS]: '我想体验精彩的校园生活'
                                    };
                                    setUserAdventure(adventureHints[key] || '');
                                }
                            }}
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

            {/* 单词数量选择器 */}
            <div className="config-section">
                <h3>📚 单词数量</h3>
                <div className="word-count-selector">
                    <div className="word-count-presets">
                        <button
                            className={`word-count-btn ${customWordCount === null ? 'selected' : ''}`}
                            onClick={() => setCustomWordCount(null)}
                        >
                            <div className="preset-label">自动</div>
                            <div className="preset-desc">根据词库自适应</div>
                        </button>
                        {[5, 10, 15, 20, 30].map(count => (
                            <button
                                key={count}
                                className={`word-count-btn ${customWordCount === count ? 'selected' : ''}`}
                                onClick={() => setCustomWordCount(count)}
                                disabled={words.length < count}
                            >
                                <div className="preset-label">{count}个</div>
                                <div className="preset-desc">快速完成</div>
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
                                placeholder="自动"
                                className="word-count-input"
                            />
                        </label>
                    </div>
                </div>
            </div>

            <div className="config-info">
                {(() => {
                    // 使用用户设置的数量或自动计算
                    const wordCount = customWordCount !== null
                        ? Math.min(customWordCount, words.length)
                        : Math.min(words.length, 50); // 自动模式最多50个

                    let requirements;

                    if (wordCount <= 5) {
                        requirements = { min: 3, max: 8, progress: 60 };
                    } else if (wordCount <= 10) {
                        requirements = { min: 5, max: 12, progress: 55 };
                    } else if (wordCount <= 20) {
                        requirements = { min: 8, max: 18, progress: 50 };
                    } else if (wordCount <= 30) {
                        requirements = { min: 10, max: 22, progress: 45 };
                    } else {
                        requirements = { min: 12, max: 30, progress: 40 };
                    }

                    return (
                        <>
                            <p>📚 本次冒险将使用 <strong>{wordCount}</strong> 个单词 {customWordCount !== null && '(自定义)'}</p>
                            <p>🎯 通关要求: 进度达到 <strong>{requirements.progress}%</strong> + 至少 <strong>{requirements.min}</strong> 轮互动</p>
                            <p>⏱️ 预计时长: <strong>{requirements.min}-{requirements.max}</strong> 轮互动 (约 {Math.ceil(requirements.max * 1.5)} 分钟)</p>
                            <p style={{ color: '#999', fontSize: '13px', marginTop: '8px' }}>💡 每轮互动中正确使用单词可提升进度</p>
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
                    onClick={() => {
                        // 如果用户有自定义冒险描述，使用个性化引导
                        if (userAdventure.trim()) {
                            const customGreetings = [
                                `好的！让我带主人去"${userAdventure.substring(0, 20)}..."冒险～✨`,
                                `嗯嗯！"${userAdventure.substring(0, 20)}..."听起来很精彩，出发吧！🗺️`,
                                `有意思！${userAdventure.substring(0, 20)}...让我设计几个挑战～💭`
                            ];
                            setMateDialogue(customGreetings[Math.floor(Math.random() * customGreetings.length)]);
                        } else {
                            // 没有自定义场景，使用主题引导
                            const themeInfo = THEME_INFO[config.theme];
                            setMateDialogue(getOdysseyGreeting(mateState.level, words.length, themeInfo.name));
                        }

                        // 延迟一下再开始，让用户看到单词姬的引导
                        setTimeout(handleStartAdventure, 1500);
                    }}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={20} className="spin" />
                            {mateState.name}正在设计冒险...
                        </>
                    ) : (
                        <>
                            <Play size={20} />
                            和{mateState.name}一起冒险
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
                {/* 单词姬对话提示 */}
                {mateDialogue && (
                    <div className="mate-dialogue-floating">
                        <div className="mate-avatar-small">
                            <MateAvatar
                                mate={mateState}
                                showMoodIndicator={false}
                            />
                        </div>
                        <div className="dialogue-bubble">
                            {mateDialogue}
                        </div>
                    </div>
                )}

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

                    {/* 通关要求提示 */}
                    {(() => {
                        const wordCount = session.words.length;
                        const currentRound = session.storyNodes.length;
                        const requirements = calculateCompletionRequirements(wordCount, currentRound, progress);
                        const progressNeeded = Math.max(0, requirements.targetProgress - progress);
                        const roundsNeeded = Math.max(0, requirements.minRounds - currentRound);

                        return (
                            <div className="completion-hint">
                                {progress >= requirements.targetProgress && currentRound >= requirements.minRounds ? (
                                    <span className="hint-success">✅ 已达成通关条件！</span>
                                ) : (
                                    <span className="hint-info">
                                        🎯 目标: {requirements.targetProgress}% |
                                        轮数: {currentRound}/{requirements.minRounds}
                                        {progressNeeded > 0 && ` | 还需 ${progressNeeded.toFixed(0)}% 进度`}
                                        {roundsNeeded > 0 && ` | 还需 ${roundsNeeded} 轮`}
                                    </span>
                                )}
                            </div>
                        );
                    })()}

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
                                        className={`choice-btn ${choice.pregenerated ? 'pregenerated' : ''}`}
                                        onClick={() => handleChoice(choice.id, choice.text)}
                                    >
                                        {choice.pregenerated && (
                                            <span className="preloaded-indicator" title="已预加载，即时响应">
                                                ⚡
                                            </span>
                                        )}
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

                                {/* 引导提示 */}
                                {currentNode.guidanceHint && showGuidance && (
                                    <div className="guidance-box">
                                        <div className="guidance-header">
                                            <BookOpen size={16} />
                                            <span>回答指导</span>
                                            <button
                                                className="guidance-toggle"
                                                onClick={() => setShowGuidance(false)}
                                            >
                                                隐藏
                                            </button>
                                        </div>
                                        <p className="guidance-text">{currentNode.guidanceHint}</p>
                                        {currentNode.suggestedResponse && (
                                            <div className="suggested-response">
                                                <span className="label">参考示例：</span>
                                                <span className="example">{currentNode.suggestedResponse}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 显示引导按钮（当隐藏时） */}
                                {currentNode.guidanceHint && !showGuidance && (
                                    <button
                                        className="show-guidance-btn"
                                        onClick={() => setShowGuidance(true)}
                                    >
                                        <BookOpen size={14} />
                                        显示回答指导
                                    </button>
                                )}

                                {/* 输入框 */}
                                <div className="input-group">
                                    <textarea
                                        className="input input-textarea"
                                        placeholder="用英文输入你的回答..."
                                        value={playerInput}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleFreeResponse();
                                            }
                                        }}
                                        rows={3}
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

                                {/* 即时反馈 */}
                                {isChecking && (
                                    <div className="instant-feedback checking">
                                        <Loader2 size={14} className="spin" />
                                        <span>正在检查...</span>
                                    </div>
                                )}

                                {instantFeedback && instantFeedback.hasErrors && (
                                    <div className="instant-feedback error">
                                        <XCircle size={16} />
                                        <div className="feedback-list">
                                            {instantFeedback.suggestions.map((item: any, idx: number) => (
                                                <div key={idx} className="feedback-item">
                                                    <span className="feedback-type">{
                                                        item.type === 'grammar' ? '语法' :
                                                            item.type === 'spelling' ? '拼写' : '表达'
                                                    }：</span>
                                                    <span className="feedback-message">{item.message}</span>
                                                    {item.suggestion && (
                                                        <span className="feedback-suggestion">
                                                            → {item.suggestion}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {instantFeedback && !instantFeedback.hasErrors && playerInput.trim().length > 5 && (
                                    <div className="instant-feedback success">
                                        <CheckCircle size={16} />
                                        <span>看起来不错！</span>
                                    </div>
                                )}

                                {/* 目标词汇提示 */}
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
                {/* 单词姬评价 */}
                {mateDialogue && (
                    <div className="mate-completion-card">
                        <MateAvatar
                            mate={mateState}
                            showMoodIndicator={true}
                        />
                        <div className="completion-dialogue">
                            <div className="mate-name">{mateState.name}</div>
                            <div className="dialogue-text">{mateDialogue}</div>
                        </div>
                    </div>
                )}

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
