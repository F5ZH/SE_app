import React, { useState, useEffect } from 'react';
import { Heart, Star, Sparkles, Map, Gift, Calendar, MessageCircle, Award, BookOpen } from 'lucide-react';
import { WordMateState, InteractionType, Achievement } from '../types';
import {
    getMateState,
    updateMateName,
    getLevelProgress,
    getAffectionTitle,
    recordInteraction,
    getAchievements,
    checkAchievements,
    checkDailyCheckin,
    getDailyCheckinReward,
    getNextMilestone
} from '../utils/wordMate';
import { getDialogue, getGreetingByTime } from '../data/dialogues';
import { UserContext } from '../utils/chat';
import { studyPlanStorage, wordBookStorage } from '../utils/storage';
import { generateTodayTask, getStudyStats } from '../utils/studyPlan';
import ChatBox from './ChatBox';
import MateAvatar from './MateAvatar';
import './WordMateHome.css';

interface WordMateHomeProps {
    onStartBasicStudy: () => void;
    onStartStory: () => void;
    onStartOdyssey: () => void;
    onBack: () => void;
}

/**
 * WordMate 主页 - 养成系统核心界面
 */
const WordMateHome: React.FC<WordMateHomeProps> = ({ 
    onStartBasicStudy, 
    onStartStory, 
    onStartOdyssey, 
    onBack 
}) => {
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
    const [showMilestoneModal, setShowMilestoneModal] = useState(false);
    const [currentMilestone, setCurrentMilestone] = useState<any>(null);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

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

        // 如果是新的一天，不自动签到,让用户点击
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
        const { state, leveledUp, milestone } = recordInteraction(
            InteractionType.DAILY_CHECKIN,
            `连续签到 ${currentMate.stats.consecutiveDays + 1} 天`
        );

        setMate(state);
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
                        {/* 角色立绘 */}
                        <div className="character-avatar" onClick={handleAvatarClick}>
                            <MateAvatar
                                mate={mate}
                                showMoodIndicator={true}
                                className={mate.affection >= 150 ? 'high-affection' : ''}
                            />

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
                                    style={{ width: `${(mate.affection / 200) * 100}%` }}
                                />
                                <span className="affection-text">{mate.affection} / 200</span>
                            </div>
                        </div>

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
                                onClick={onStartStory}
                            >
                                <BookOpen size={24} />
                                <span className="btn-title">AI 故事串讲</span>
                                <span className="btn-desc">在故事中学单词</span>
                                <span className="btn-reward">+10 好感度 ❤️</span>
                            </button>

                            <button
                                className="activity-btn adventure-btn"
                                onClick={onStartOdyssey}
                            >
                                <Map size={24} />
                                <span className="btn-title">Word Odyssey</span>
                                <span className="btn-desc">互动冒险学习</span>
                                <span className="btn-reward">+20 好感度 ❤️</span>
                            </button>

                            <button
                                className="activity-btn basic-btn"
                                onClick={onStartBasicStudy}
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
                        查看成就 ({achievements.filter(a => a.tiers.some(t => t.unlocked)).length}/{achievements.length})
                    </button>
                </div>
            </div>

            {/* 成就列表模态框 */}
            {showAchievements && (
                <div className="modal-overlay" onClick={() => {
                    setShowAchievements(false);
                    setSelectedAchievement(null);
                }}>
                    <div className="modal-content achievements-modal" onClick={(e) => e.stopPropagation()}>
                        {!selectedAchievement ? (
                            /* 成就列表主界面 - 显示当前等级 */
                            <>
                                <h2>🏆 成就列表</h2>
                                <p className="achievements-subtitle">点击成就查看详细晋升路径</p>
                                <div className="achievements-compact-grid">
                                    {achievements.map(achievement => {
                                        // 获取当前最高解锁等级
                                        const unlockedTiers = achievement.tiers.filter(t => t.unlocked);
                                        const currentTierData = unlockedTiers.length > 0
                                            ? unlockedTiers[unlockedTiers.length - 1]
                                            : null;
                                        const nextTier = achievement.tiers.find(t => !t.unlocked);

                                        return (
                                            <div
                                                key={achievement.id}
                                                className="achievement-compact-card"
                                                onClick={() => setSelectedAchievement(achievement)}
                                            >
                                                <div className="achievement-compact-icon">{achievement.icon}</div>
                                                <div className="achievement-compact-info">
                                                    <h4>{achievement.name}</h4>
                                                    {currentTierData ? (
                                                        <div className={`current-tier-badge tier-${currentTierData.tier}`}>
                                                            <span className="tier-icon">
                                                                {currentTierData.tier === 'bronze' ? '🥉' :
                                                                    currentTierData.tier === 'silver' ? '🥈' :
                                                                        currentTierData.tier === 'gold' ? '🥇' : '💎'}
                                                            </span>
                                                            <span className="tier-label">
                                                                {currentTierData.tier === 'bronze' ? '青铜' :
                                                                    currentTierData.tier === 'silver' ? '白银' :
                                                                        currentTierData.tier === 'gold' ? '黄金' : '钻石'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="tier-locked-badge">未解锁</div>
                                                    )}
                                                    {nextTier && (
                                                        <div className="next-tier-hint">
                                                            下一级: {nextTier.target}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="achievement-arrow">›</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button className="close-btn" onClick={() => setShowAchievements(false)}>
                                    关闭
                                </button>
                            </>
                        ) : (
                            /* 成就详情界面 - 显示完整晋升路径 */
                            <>
                                <button
                                    className="back-to-list-btn"
                                    onClick={() => setSelectedAchievement(null)}
                                >
                                    ← 返回列表
                                </button>
                                <div className="achievement-detail">
                                    <div className="achievement-detail-header">
                                        <span className="achievement-detail-icon">{selectedAchievement.icon}</span>
                                        <div>
                                            <h2>{selectedAchievement.name}</h2>
                                            <p>{selectedAchievement.description}</p>
                                        </div>
                                    </div>

                                    <div className="achievement-progression">
                                        <h3>晋升之路</h3>
                                        <div className="tier-progression-list">
                                            {selectedAchievement.tiers.map((tier, index) => (
                                                <div
                                                    key={tier.tier}
                                                    className={`tier-progression-item ${tier.unlocked ? 'unlocked' : 'locked'}`}
                                                >
                                                    <div className="tier-progression-badge">
                                                        <div className={`tier-progression-icon tier-${tier.tier}`}>
                                                            {tier.unlocked ? '✓' : (index + 1)}
                                                        </div>
                                                        <div className="tier-progression-line"></div>
                                                    </div>
                                                    <div className="tier-progression-content">
                                                        <div className="tier-progression-header">
                                                            <span className={`tier-progression-name tier-${tier.tier}`}>
                                                                {tier.tier === 'bronze' ? '🥉 青铜' :
                                                                    tier.tier === 'silver' ? '🥈 白银' :
                                                                        tier.tier === 'gold' ? '🥇 黄金' : '💎 钻石'}
                                                            </span>
                                                            {tier.unlocked && tier.unlockedAt && (
                                                                <span className="tier-unlock-date">
                                                                    {new Date(tier.unlockedAt).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="tier-progression-title">{tier.reward.title}</div>
                                                        <div className="tier-progression-target">
                                                            目标: {tier.target}
                                                        </div>
                                                        <div className="tier-progression-reward">
                                                            {tier.reward.affection > 0 && <span>❤️ +{tier.reward.affection}</span>}
                                                            {tier.reward.exp > 0 && <span>⭐ +{tier.reward.exp}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button className="close-btn" onClick={() => {
                                    setSelectedAchievement(null);
                                    setShowAchievements(false);
                                }}>
                                    关闭
                                </button>
                            </>
                        )}
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
