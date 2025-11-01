import React, { useState, useEffect } from 'react';
import { Heart, Star, Sparkles, Map, Gift, Calendar, MessageCircle, Zap, Award, BookOpen } from 'lucide-react';
import { WordMateState, InteractionType, WordMateMood, Achievement } from '../types';
import {
    getMateState,
    updateMateName,
    getLevelProgress,
    getAffectionTitle,
    recordInteraction,
    getAchievements,
    checkAchievements,
    checkDailyCheckin,
    getCurrentCombo,
    getDailyCheckinReward,
    getNextMilestone
} from '../utils/wordMate';
import { getDialogue, getGreetingByTime } from '../data/dialogues';
import { UserContext } from '../utils/chat';
import { studyPlanStorage, wordBookStorage } from '../utils/storage';
import { generateTodayTask, getStudyStats } from '../utils/studyPlan';
import ChatBox from './ChatBox';
import './WordMateHome.css';

interface WordMateHomeProps {
    onStartActivity: (activityType: 'story' | 'adventure' | 'basic') => void;
    onBack: () => void;
}

/**
 * WordMate 主页 - 养成系统核心界面
 */
const WordMateHome: React.FC<WordMateHomeProps> = ({ onStartActivity, onBack }) => {
    const [mate, setMate] = useState<WordMateState>(getMateState());
    const [currentDialogue, setCurrentDialogue] = useState<string>('');
    const [showNameEdit, setShowNameEdit] = useState(false);
    const [newName, setNewName] = useState(mate.name);
    const [showAchievements, setShowAchievements] = useState(false);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [showLevelUpModal, setShowLevelUpModal] = useState(false);
    const [showAchievementModal, setShowAchievementModal] = useState(false);
    const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
    const [canCheckin, setCanCheckin] = useState(false);
    const [showCheckinReward, setShowCheckinReward] = useState(false);
    const [showChatBox, setShowChatBox] = useState(false);
    const [comboCount, setComboCount] = useState(0);
    const [showMilestoneModal, setShowMilestoneModal] = useState(false);
    const [currentMilestone, setCurrentMilestone] = useState<any>(null);

    const levelProgress = getLevelProgress();
    const affectionTitle = getAffectionTitle(mate.affection);
    const nextMilestone = getNextMilestone();
    const dailyReward = getDailyCheckinReward();

    /**
     * 收集用户上下文数据
     */
    const getUserContext = (): UserContext => {
        // 获取当前学习计划和词书
        const currentPlan = studyPlanStorage.getCurrent();
        const wordBooks = wordBookStorage.getAll();
        const currentBook = currentPlan ? wordBooks.find(b => b.id === currentPlan.wordBookId) : null;

        let context: UserContext = {
            mateName: mate.name,
            mateLevel: mate.level,
            mateAffection: mate.affection,
            consecutiveDays: mate.stats.consecutiveDays,
            totalInteractions: mate.stats.totalStudyDays + mate.stats.storiesCompleted + mate.stats.adventuresCompleted
        };

        // 添加学习数据
        if (currentPlan && currentBook) {
            const todayTask = generateTodayTask(currentBook, currentPlan);
            const stats = getStudyStats(currentBook);

            context = {
                ...context,
                todayNewWords: todayTask.totalNew,
                todayReviewWords: todayTask.totalReview,
                totalMastered: stats.masteredWords,
                totalLearning: stats.learnedWords,
                currentPlanName: currentBook.name,
                dailyTarget: currentPlan.dailyNewWords,
                accuracyRate: stats.accuracy,
                studyStreak: mate.stats.consecutiveDays
            };

            // 获取最近学习的单词（最多5个）
            if (todayTask.newWords.length > 0) {
                context.recentWords = todayTask.newWords.slice(0, 5).map(w => ({
                    word: w.word,
                    translation: w.translation
                }));
            } else if (todayTask.reviewWords.length > 0) {
                context.recentWords = todayTask.reviewWords.slice(0, 5).map(w => ({
                    word: w.word,
                    translation: w.translation
                }));
            }
        }

        return context;
    };

    // 初始化问候
    useEffect(() => {
        const greeting = getGreetingByTime(mate.level, mate.affection);
        setCurrentDialogue(greeting.text);

        // 检查是否可以签到
        const isNewDay = checkDailyCheckin();
        setCanCheckin(isNewDay);

        // 加载 combo 计数
        const currentCombo = getCurrentCombo();
        setComboCount(currentCombo);

        // 如果是新的一天，不自动签到，让用户点击
        if (!isNewDay) {
            // 记录问候互动
            recordInteraction(InteractionType.GREETING);
        }

        // 检查成就
        const newAchievements = checkAchievements();
        if (newAchievements.length > 0) {
            setNewAchievements(newAchievements);
            setShowAchievementModal(true);
        }

        // 加载成就列表
        setAchievements(getAchievements());
    }, []);

    // 处理互动
    const handleInteraction = (type: InteractionType) => {
        const { state, leveledUp, comboCount: newCombo, milestone } = recordInteraction(type);
        setMate(state);
        setComboCount(newCombo);

        if (leveledUp) {
            setShowLevelUpModal(true);
        }

        // 显示里程碑奖励
        if (milestone) {
            setCurrentMilestone(milestone);
            setShowMilestoneModal(true);
        }

        const dialogue = getDialogue(type, state.level, state.affection, state.mood);
        setCurrentDialogue(dialogue.text);

        // 检查新成就
        const newAchievements = checkAchievements();
        if (newAchievements.length > 0) {
            setNewAchievements(newAchievements);
            setShowAchievementModal(true);
        }
    };

    // 更新名称
    const handleNameUpdate = () => {
        if (newName.trim()) {
            const updated = updateMateName(newName.trim());
            setMate(updated);
            setShowNameEdit(false);
        }
    };

    // 处理每日签到
    const handleDailyCheckin = () => {
        const currentMate = getMateState();
        const { state, leveledUp, comboCount: newCombo, milestone } = recordInteraction(
            InteractionType.DAILY_CHECKIN,
            `连续签到 ${currentMate.stats.consecutiveDays + 1} 天`
        );

        setMate(state);
        setComboCount(newCombo);
        setCanCheckin(false);
        setShowCheckinReward(true);

        if (leveledUp) {
            setShowLevelUpModal(true);
        }

        // 显示里程碑奖励
        if (milestone) {
            setCurrentMilestone(milestone);
            setShowMilestoneModal(true);
        }

        // 显示签到对话
        const dialogue = getDialogue(InteractionType.DAILY_CHECKIN, state.level, state.affection);
        setCurrentDialogue(dialogue.text);

        // 检查成就
        const newAchievements = checkAchievements();
        if (newAchievements.length > 0) {
            setNewAchievements(newAchievements);
            setShowAchievementModal(true);
        }

        // 3秒后隐藏奖励提示
        setTimeout(() => {
            setShowCheckinReward(false);
        }, 3000);
    };

    // 开始活动
    const handleStartActivity = (activityType: 'story' | 'adventure' | 'basic') => {
        handleInteraction(InteractionType.STUDY_START);
        setTimeout(() => {
            onStartActivity(activityType);
        }, 1000);
    };

    // 获取心情emoji
    const getMoodEmoji = (mood: WordMateMood): string => {
        const emojiMap: Record<WordMateMood, string> = {
            [WordMateMood.HAPPY]: '😊',
            [WordMateMood.EXCITED]: '✨',
            [WordMateMood.NORMAL]: '📚',
            [WordMateMood.TIRED]: '😴',
            [WordMateMood.ENCOURAGING]: '💪',
            [WordMateMood.PROUD]: '🌟',
            [WordMateMood.WORRIED]: '😟'
        };
        return emojiMap[mood];
    };

    // 点击头像触发随机对话
    const handleAvatarClick = () => {
        const randomDialogues = [
            '嘿嘿，你在看我吗？☺️',
            '怎么啦？是想和我聊天吗？💕',
            '有什么问题可以问我哦~',
            '今天学习得怎么样？',
            '要不要一起玩个游戏？',
            '我会一直陪着你的！',
            '加油加油！你最棒了！',
            '休息一下也没关系的~'
        ];
        const randomText = randomDialogues[Math.floor(Math.random() * randomDialogues.length)];
        setCurrentDialogue(randomText);
    };

    return (
        <div className="wordmate-home">
            {/* 返回按钮 */}
            <button className="back-button" onClick={onBack}>
                ← 返回首页
            </button>

            {/* 主要内容区域 */}
            <div className="mate-container">
                {/* 左侧：虚拟形象 */}
                <div className="mate-character-section">
                    <div className="character-card">
                        {/* 立绘占位符 */}
                        <div className="character-avatar" onClick={handleAvatarClick}>
                            <div className="avatar-placeholder">
                                <span className="avatar-emoji">👧</span>
                                <span className="mood-indicator">{getMoodEmoji(mate.mood)}</span>
                            </div>

                            {/* 气泡对话框 */}
                            <div className="speech-bubble">
                                <p className="bubble-text">{currentDialogue}</p>
                                <div className="bubble-tail"></div>
                            </div>
                        </div>

                        {/* 名称 */}
                        <div className="character-name">
                            {showNameEdit ? (
                                <div className="name-edit">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        maxLength={10}
                                        autoFocus
                                    />
                                    <button onClick={handleNameUpdate}>✓</button>
                                    <button onClick={() => setShowNameEdit(false)}>✗</button>
                                </div>
                            ) : (
                                <h2 onClick={() => setShowNameEdit(true)}>
                                    {mate.name} <span className="edit-icon">✏️</span>
                                </h2>
                            )}
                        </div>

                        {/* 等级信息 */}
                        <div className="level-info">
                            <div className="level-badge">
                                <Star size={16} />
                                <span>Lv.{mate.level}</span>
                            </div>
                            <div className="exp-bar">
                                <div
                                    className="exp-fill"
                                    style={{ width: `${levelProgress.percentage}%` }}
                                />
                                <span className="exp-text">
                                    {levelProgress.currentExp} / {levelProgress.requiredExp} EXP
                                </span>
                            </div>
                        </div>

                        {/* 好感度 */}
                        <div className="affection-info">
                            <div className="affection-header">
                                <Heart size={16} fill="#ff6b9d" color="#ff6b9d" />
                                <span>好感度</span>
                                <span className="affection-title">{affectionTitle}</span>
                            </div>
                            <div className="affection-bar">
                                <div
                                    className="affection-fill"
                                    style={{ width: `${mate.affection}%` }}
                                />
                                <span className="affection-text">{mate.affection} / 100</span>
                            </div>
                        </div>

                        {/* Combo 连击显示 */}
                        {comboCount > 0 && (
                            <div className="combo-display" title="2小时内的连续互动次数，每5次增加10%奖励加成（最高100%）">
                                <div className="combo-header">
                                    <Zap size={16} fill="#ffa500" color="#ffa500" />
                                    <span>连击中</span>
                                </div>
                                <div className="combo-info">
                                    <span className="combo-count">{comboCount} Combo</span>
                                    <span className="combo-bonus">+{Math.min(Math.floor(comboCount / 5) * 10, 100)}% 奖励</span>
                                </div>
                            </div>
                        )}

                        {/* 里程碑进度 */}
                        {nextMilestone && (
                            <div className="milestone-progress" title={`达到${nextMilestone.affection}好感度时解锁：${nextMilestone.reward.description}`}>
                                <div className="milestone-header">
                                    <Award size={16} color="#ffd700" />
                                    <span>下一个里程碑</span>
                                </div>
                                <div className="milestone-info">
                                    <span className="milestone-title">{nextMilestone.reward.title}</span>
                                    <span className="milestone-reward">奖励: +{nextMilestone.reward.exp} 经验值</span>
                                </div>
                                <div className="milestone-bar">
                                    <div
                                        className="milestone-fill"
                                        style={{ width: `${(mate.affection / nextMilestone.affection) * 100}%` }}
                                    />
                                    <span className="milestone-text">
                                        {mate.affection} / {nextMilestone.affection}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 右侧：互动区域 */}
                <div className="interaction-section">
                    {/* 每日签到 */}
                    {canCheckin && (
                        <div className="checkin-banner">
                            <button className="checkin-btn" onClick={handleDailyCheckin}>
                                <Calendar size={24} />
                                <div className="checkin-text">
                                    <span className="checkin-title">每日签到</span>
                                    <span className="checkin-desc">
                                        +{dailyReward.affection} 好感度 +{dailyReward.exp} 经验值
                                        {mate.stats.consecutiveDays >= 7 && ' (连续签到奖励!)'}
                                    </span>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* 签到奖励提示 */}
                    {showCheckinReward && (
                        <div className="reward-toast">
                            <Sparkles size={20} />
                            <span>签到成功！已连续打卡 {mate.stats.consecutiveDays} 天 🔥</span>
                        </div>
                    )}

                    {/* 活动按钮 */}
                    <div className="activities">
                        <h3>一起学习吧~</h3>
                        <div className="activity-buttons">
                            <button
                                className="activity-btn chat-btn"
                                onClick={() => setShowChatBox(true)}
                            >
                                <MessageCircle size={24} />
                                <span className="btn-title">自由对话</span>
                                <span className="btn-desc">和我聊聊天吧</span>
                                <span className="btn-reward">💬</span>
                            </button>

                            <button
                                className="activity-btn story-btn"
                                onClick={() => handleStartActivity('story')}
                            >
                                <BookOpen size={24} />
                                <span className="btn-title">AI 故事</span>
                                <span className="btn-desc">在故事中学单词</span>
                                <span className="btn-reward">+10 好感度 ❤️</span>
                            </button>

                            <button
                                className="activity-btn adventure-btn"
                                onClick={() => handleStartActivity('adventure')}
                            >
                                <Map size={24} />
                                <span className="btn-title">Word Odyssey</span>
                                <span className="btn-desc">互动冒险学习</span>
                                <span className="btn-reward">+20 好感度 ❤️</span>
                            </button>

                            <button
                                className="activity-btn basic-btn"
                                onClick={() => handleStartActivity('basic')}
                            >
                                <Sparkles size={24} />
                                <span className="btn-title">基础练习</span>
                                <span className="btn-desc">快速背单词</span>
                                <span className="btn-reward">+5 好感度 ❤️</span>
                            </button>
                        </div>
                    </div>

                    {/* 成就按钮 */}
                    <button
                        className="achievements-btn"
                        onClick={() => setShowAchievements(true)}
                    >
                        <Gift size={20} />
                        查看成就 ({mate.stats.achievementsUnlocked}/{achievements.reduce((sum, a) => sum + a.tiers.length, 0)})
                    </button>
                </div>
            </div>

            {/* 成就列表模态框 */}
            {showAchievements && (
                <div className="modal-overlay" onClick={() => setShowAchievements(false)}>
                    <div className="modal-content achievements-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>🏆 成就列表</h2>
                        <div className="achievements-grid">
                            {achievements.map(achievement => (
                                <div
                                    key={achievement.id}
                                    className="achievement-card-multi"
                                >
                                    <div className="achievement-header">
                                        <div className="achievement-icon">{achievement.icon}</div>
                                        <div className="achievement-title">
                                            <h4>{achievement.name}</h4>
                                            <p>{achievement.description}</p>
                                        </div>
                                    </div>
                                    <div className="achievement-tiers">
                                        {achievement.tiers.map(tier => (
                                            <div
                                                key={tier.tier}
                                                className={`tier-badge ${tier.unlocked ? 'unlocked' : 'locked'} tier-${tier.tier}`}
                                                title={`${tier.reward.title} - 目标: ${tier.target} (奖励: ${tier.reward.affection > 0 ? `+${tier.reward.affection}好感` : ''} ${tier.reward.exp > 0 ? `+${tier.reward.exp}经验` : ''})`}
                                            >
                                                <div className="tier-name">{
                                                    tier.tier === 'bronze' ? '青铜' :
                                                        tier.tier === 'silver' ? '白银' :
                                                            tier.tier === 'gold' ? '黄金' : '钻石'
                                                }</div>
                                                {tier.unlocked && <div className="tier-check">✓</div>}
                                                {!tier.unlocked && <div className="tier-target">{tier.target}</div>}
                                            </div>
                                        ))}
                                    </div>
                                    {achievement.currentTier && (
                                        <div className="current-tier-info">
                                            当前: {achievement.tiers.find(t => t.tier === achievement.currentTier)?.reward.title}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button className="close-btn" onClick={() => setShowAchievements(false)}>
                            关闭
                        </button>
                    </div>
                </div>
            )}

            {/* 升级提示 */}
            {showLevelUpModal && (
                <div className="modal-overlay" onClick={() => setShowLevelUpModal(false)}>
                    <div className="modal-content levelup-modal">
                        <h2>🎉 升级了！</h2>
                        <p className="levelup-text">
                            恭喜你！{mate.name} 升到了 <strong>Lv.{mate.level}</strong>！
                        </p>
                        <p>继续加油，解锁更多精彩内容~</p>
                        <button className="close-btn" onClick={() => setShowLevelUpModal(false)}>
                            太棒了！
                        </button>
                    </div>
                </div>
            )}

            {/* 新成就解锁提示 */}
            {showAchievementModal && newAchievements.length > 0 && (
                <div className="modal-overlay" onClick={() => setShowAchievementModal(false)}>
                    <div className="modal-content achievement-unlock-modal">
                        <h2>🎊 成就解锁！</h2>
                        {newAchievements.map(achievement => {
                            const currentTierData = achievement.tiers.find(t => t.tier === achievement.currentTier);
                            return (
                                <div key={achievement.id} className="new-achievement">
                                    <div className="achievement-icon-large">{achievement.icon}</div>
                                    <h3>{achievement.name}</h3>
                                    {currentTierData && (
                                        <>
                                            <div className={`tier-badge-large tier-${currentTierData.tier}`}>
                                                {currentTierData.tier === 'bronze' ? '🥉 青铜' :
                                                    currentTierData.tier === 'silver' ? '🥈 白银' :
                                                        currentTierData.tier === 'gold' ? '🥇 黄金' : '💎 钻石'}
                                            </div>
                                            <p className="tier-title">{currentTierData.reward.title}</p>
                                            <div className="rewards">
                                                {currentTierData.reward.affection > 0 && (
                                                    <span>❤️ +{currentTierData.reward.affection} 好感度</span>
                                                )}
                                                {currentTierData.reward.exp > 0 && (
                                                    <span>⭐ +{currentTierData.reward.exp} 经验值</span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                        <button className="close-btn" onClick={() => setShowAchievementModal(false)}>
                            收下了！
                        </button>
                    </div>
                </div>
            )}

            {/* 里程碑奖励提示 */}
            {showMilestoneModal && currentMilestone && (
                <div className="modal-overlay" onClick={() => setShowMilestoneModal(false)}>
                    <div className="modal-content milestone-modal">
                        <h2>🎊 里程碑达成！</h2>
                        <div className="milestone-celebration">
                            <div className="milestone-icon-large">
                                <Award size={64} color="#ffd700" />
                            </div>
                            <h3>{currentMilestone.reward.title}</h3>
                            <p className="milestone-desc">{currentMilestone.reward.description}</p>
                            <div className="milestone-rewards">
                                <div className="reward-item">
                                    <span className="reward-label">好感度达到</span>
                                    <span className="reward-value">{currentMilestone.affection}</span>
                                </div>
                                <div className="reward-item">
                                    <span className="reward-label">获得经验值</span>
                                    <span className="reward-value">+{currentMilestone.reward.exp}</span>
                                </div>
                            </div>
                        </div>
                        <button className="close-btn" onClick={() => setShowMilestoneModal(false)}>
                            太棒了！
                        </button>
                    </div>
                </div>
            )}

            {/* AI 聊天框 */}
            {showChatBox && (
                <ChatBox
                    onClose={() => setShowChatBox(false)}
                    userContext={getUserContext()}
                />
            )}
        </div>
    );
};

export default WordMateHome;
