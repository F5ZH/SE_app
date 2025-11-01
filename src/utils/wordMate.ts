import {
    WordMateState,
    WordMateMood,
    MateStats,
    InteractionRecord,
    InteractionType,
    Achievement,
    AchievementTier
} from '../types';

/**
 * WordMate 养成系统核心工具
 * 管理虚拟形象的状态、好感度、等级等
 */

// LocalStorage 键名
const STORAGE_KEY = 'wordmate_state';
const INTERACTIONS_KEY = 'wordmate_interactions';
const ACHIEVEMENTS_KEY = 'wordmate_achievements';
const COMBO_KEY = 'wordmate_combo';
const MILESTONES_KEY = 'wordmate_milestones';

// 等级经验值配置（指数增长）
const getLevelExpRequirement = (level: number): number => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
};

// 连击系统
interface ComboData {
    count: number;
    lastInteractionTime: number;
    lastInteractionDate: string;
    todayInteractionCount: number;
}

const COMBO_TIMEOUT = 2 * 60 * 60 * 1000; // 2小时内连续互动才算连击

// 获取连击数据
const getComboData = (): ComboData => {
    const stored = localStorage.getItem(COMBO_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    return {
        count: 0,
        lastInteractionTime: 0,
        lastInteractionDate: '',
        todayInteractionCount: 0
    };
};

// 保存连击数据
const saveComboData = (data: ComboData): void => {
    localStorage.setItem(COMBO_KEY, JSON.stringify(data));
};

// 更新连击
const updateCombo = (): { comboCount: number; comboBonus: number } => {
    const combo = getComboData();
    const now = Date.now();
    const today = new Date().toDateString();

    // 检查是否是新的一天
    if (combo.lastInteractionDate !== today) {
        combo.todayInteractionCount = 1;
        combo.lastInteractionDate = today;
    } else {
        combo.todayInteractionCount++;
    }

    // 检查连击是否中断
    if (now - combo.lastInteractionTime > COMBO_TIMEOUT) {
        combo.count = 1;
    } else {
        combo.count++;
    }

    combo.lastInteractionTime = now;
    saveComboData(combo);

    // 计算连击加成（每5次连击增加10%，最高100%）
    const comboBonus = Math.min(Math.floor(combo.count / 5) * 0.1, 1.0);
    return { comboCount: combo.count, comboBonus };
};

// 获取当前连击
export const getCurrentCombo = (): number => {
    const combo = getComboData();
    const now = Date.now();
    if (now - combo.lastInteractionTime > COMBO_TIMEOUT) {
        return 0;
    }
    return combo.count;
};

// 好感度里程碑奖励
interface AffectionMilestone {
    affection: number;
    reward: {
        exp: number;
        title: string;
        description: string;
    };
}

const AFFECTION_MILESTONES: AffectionMilestone[] = [
    { affection: 10, reward: { exp: 50, title: '初识之喜', description: '我们开始熟悉啦~' } },
    { affection: 20, reward: { exp: 100, title: '渐入佳境', description: '和你聊天真开心！' } },
    { affection: 30, reward: { exp: 150, title: '志趣相投', description: '感觉我们很合得来呢~' } },
    { affection: 40, reward: { exp: 200, title: '心心相印', description: '你已经成为我重要的学习伙伴了！' } },
    { affection: 50, reward: { exp: 300, title: '知心好友', description: '有你陪伴，学习变得好有趣！' } },
    { affection: 60, reward: { exp: 400, title: '亲密无间', description: '我们的默契度满分！' } },
    { affection: 70, reward: { exp: 500, title: '形影不离', description: '每天都想见到你~' } },
    { affection: 80, reward: { exp: 700, title: '心有灵犀', description: '不用说我也懂你在想什么！' } },
    { affection: 90, reward: { exp: 1000, title: '灵魂伴侣', description: '感谢你一直陪伴着我！' } },
    { affection: 100, reward: { exp: 2000, title: '永恒之约', description: '我们永远是最好的伙伴！💕' } }
];

// 检查并触发里程碑
const checkAffectionMilestones = (oldAffection: number, newAffection: number): AffectionMilestone | null => {
    const stored = localStorage.getItem(MILESTONES_KEY);
    const reached: number[] = stored ? JSON.parse(stored) : [];

    for (const milestone of AFFECTION_MILESTONES) {
        if (oldAffection < milestone.affection && newAffection >= milestone.affection) {
            if (!reached.includes(milestone.affection)) {
                reached.push(milestone.affection);
                localStorage.setItem(MILESTONES_KEY, JSON.stringify(reached));
                return milestone;
            }
        }
    }
    return null;
};

// 获取已达成的里程碑
export const getReachedMilestones = (): number[] => {
    const stored = localStorage.getItem(MILESTONES_KEY);
    return stored ? JSON.parse(stored) : [];
};

// 创建默认 WordMate 状态
export const createDefaultMate = (): WordMateState => {
    return {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: '单词姬',
        level: 1,
        exp: 0,
        affection: 0,
        mood: WordMateMood.NORMAL,
        appearance: {
            avatar: 'default',
            outfit: 'casual',
            background: 'study_room'
        },
        stats: {
            totalStudyDays: 0,
            consecutiveDays: 0,
            totalWordsLearned: 0,
            storiesCompleted: 0,
            adventuresCompleted: 0,
            achievementsUnlocked: 0
        },
        lastInteraction: Date.now(),
        createdAt: Date.now()
    };
};

// 获取 WordMate 状态
export const getMateState = (): WordMateState => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        const state: WordMateState = JSON.parse(stored);

        // 检查好感度衰减
        const now = Date.now();
        const daysSinceLastInteraction = Math.floor((now - state.lastInteraction) / (1000 * 60 * 60 * 24));

        // 如果超过3天没有互动，开始衰减好感度
        if (daysSinceLastInteraction >= 3) {
            // 每天衰减2点好感度（从第3天开始）
            const decayDays = daysSinceLastInteraction - 2;
            const decayAmount = Math.min(decayDays * 2, state.affection); // 最多衰减到0

            if (decayAmount > 0 && state.affection > 0) {
                state.affection = Math.max(0, state.affection - decayAmount);
                // 保存衰减后的状态
                saveMateState(state);
            }
        }

        return state;
    }
    const newMate = createDefaultMate();
    saveMateState(newMate);
    return newMate;
};

// 保存 WordMate 状态
export const saveMateState = (state: WordMateState): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

// 更新 WordMate 名称
export const updateMateName = (name: string): WordMateState => {
    const state = getMateState();
    state.name = name;
    saveMateState(state);
    return state;
};

// 计算好感度等级标题
export const getAffectionTitle = (affection: number): string => {
    if (affection >= 90) return '心有灵犀';
    if (affection >= 80) return '亲密无间';
    if (affection >= 70) return '志同道合';
    if (affection >= 60) return '相知相惜';
    if (affection >= 50) return '渐入佳境';
    if (affection >= 40) return '日渐熟悉';
    if (affection >= 30) return '初步了解';
    if (affection >= 20) return '逐渐熟悉';
    if (affection >= 10) return '初次相识';
    return '萍水相逢';
};

// 增加经验值并处理升级
export const addExp = (amount: number): {
    leveledUp: boolean;
    newLevel: number;
    state: WordMateState
} => {
    const state = getMateState();
    state.exp += amount;

    let leveledUp = false;
    let newLevel = state.level;

    // 检查升级
    while (state.exp >= getLevelExpRequirement(state.level) && state.level < 50) {
        state.exp -= getLevelExpRequirement(state.level);
        state.level++;
        newLevel = state.level;
        leveledUp = true;
    }

    // 防止经验值溢出
    if (state.level >= 50) {
        state.exp = 0;
    }

    saveMateState(state);
    return { leveledUp, newLevel, state };
};

// 增加好感度
export const addAffection = (amount: number): {
    state: WordMateState;
    milestone: AffectionMilestone | null;
    oldAffection: number;
} => {
    const state = getMateState();
    const oldAffection = state.affection;
    state.affection = Math.min(100, state.affection + amount);

    // 检查里程碑
    const milestone = checkAffectionMilestones(oldAffection, state.affection);

    // 如果达到里程碑，给予额外经验
    if (milestone) {
        addExp(milestone.reward.exp);
    }

    saveMateState(state);
    return { state, milestone, oldAffection };
};

// 更新心情
export const updateMood = (mood: WordMateMood): WordMateState => {
    const state = getMateState();
    state.mood = mood;
    state.lastInteraction = Date.now();
    saveMateState(state);
    return state;
};

// 记录互动并获得奖励
export const recordInteraction = (
    type: InteractionType,
    context?: string
): {
    affectionGain: number;
    expGain: number;
    state: WordMateState;
    leveledUp: boolean;
    comboCount: number;
    comboBonus: number;
    milestone: AffectionMilestone | null;
} => {
    const state = getMateState();

    // 更新连击
    const { comboCount, comboBonus } = updateCombo();

    // 根据互动类型计算基础奖励
    let baseAffectionGain = 0;
    let baseExpGain = 0;

    switch (type) {
        case InteractionType.GREETING:
            baseAffectionGain = 1;
            baseExpGain = 5;
            break;
        case InteractionType.STUDY_START:
            baseAffectionGain = 2;
            baseExpGain = 10;
            break;
        case InteractionType.STUDY_COMPLETE:
            baseAffectionGain = 5;
            baseExpGain = 30;
            break;
        case InteractionType.WORD_MASTERED:
            baseAffectionGain = 1; // 降低：3 -> 1
            baseExpGain = 10; // 降低：15 -> 10
            break;
        case InteractionType.STORY_COMPLETE:
            baseAffectionGain = 5; // 降低：10 -> 5
            baseExpGain = 30; // 降低：50 -> 30
            state.stats.storiesCompleted++;
            break;
        case InteractionType.ADVENTURE_COMPLETE:
            baseAffectionGain = 10; // 降低：20 -> 10
            baseExpGain = 60; // 降低：100 -> 60
            state.stats.adventuresCompleted++;
            break;
        case InteractionType.MILESTONE:
            baseAffectionGain = 8; // 降低：15 -> 8
            baseExpGain = 50; // 降低：75 -> 50
            break;
        case InteractionType.DAILY_CHECKIN:
            // 每日签到奖励随连续天数递增
            const consecutiveDays = state.stats.consecutiveDays;
            baseAffectionGain = 3 + Math.min(Math.floor(consecutiveDays / 10), 5); // 降低：5 + (days/7) -> 3 + (days/10), 最多+5
            baseExpGain = 15 + Math.min(Math.floor(consecutiveDays / 5) * 5, 30); // 降低：20 + (days/3)*5 -> 15 + (days/5)*5，最多+30
            break;
    }

    // 应用连击加成
    const affectionGain = Math.round(baseAffectionGain * (1 + comboBonus));
    const expGain = Math.round(baseExpGain * (1 + comboBonus));

    // 应用好感度
    const oldAffection = state.affection;
    state.affection = Math.min(100, state.affection + affectionGain);

    // 检查里程碑
    const milestone = checkAffectionMilestones(oldAffection, state.affection);

    // 保存互动记录
    const interaction: InteractionRecord = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        type,
        timestamp: Date.now(),
        affectionGain,
        expGain,
        context
    };
    saveInteraction(interaction);

    // 更新最后互动时间
    state.lastInteraction = Date.now();
    saveMateState(state);

    // 应用经验值并检查升级（包括里程碑奖励）
    let totalExpGain = expGain;
    if (milestone) {
        totalExpGain += milestone.reward.exp;
    }
    const { leveledUp } = addExp(totalExpGain);

    return { affectionGain, expGain: totalExpGain, state, leveledUp, comboCount, comboBonus, milestone };
};

// 保存互动记录
const saveInteraction = (interaction: InteractionRecord): void => {
    const stored = localStorage.getItem(INTERACTIONS_KEY);
    const interactions: InteractionRecord[] = stored ? JSON.parse(stored) : [];
    interactions.push(interaction);

    // 只保留最近 100 条记录
    if (interactions.length > 100) {
        interactions.splice(0, interactions.length - 100);
    }

    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(interactions));
};

// 获取互动历史
export const getInteractionHistory = (limit: number = 10): InteractionRecord[] => {
    const stored = localStorage.getItem(INTERACTIONS_KEY);
    const interactions: InteractionRecord[] = stored ? JSON.parse(stored) : [];
    return interactions.slice(-limit).reverse();
};

// 更新统计数据
export const updateStats = (updates: Partial<MateStats>): WordMateState => {
    const state = getMateState();
    state.stats = { ...state.stats, ...updates };
    saveMateState(state);
    return state;
};

// 增加学习单词数
export const addWordsLearned = (count: number): WordMateState => {
    const state = getMateState();
    state.stats.totalWordsLearned += count;
    saveMateState(state);
    return state;
};

// 检查每日打卡
export const checkDailyCheckin = (): boolean => {
    const state = getMateState();
    const lastDate = new Date(state.lastInteraction);
    const today = new Date();

    // 检查是否是新的一天
    if (
        lastDate.getFullYear() !== today.getFullYear() ||
        lastDate.getMonth() !== today.getMonth() ||
        lastDate.getDate() !== today.getDate()
    ) {
        state.stats.totalStudyDays++;

        // 检查连续打卡
        const dayDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
            state.stats.consecutiveDays++;
        } else if (dayDiff > 1) {
            state.stats.consecutiveDays = 1;
        }

        saveMateState(state);
        return true;
    }

    return false;
};

// 获取当前等级进度
export const getLevelProgress = (): {
    currentLevel: number;
    currentExp: number;
    requiredExp: number;
    percentage: number;
} => {
    const state = getMateState();
    const requiredExp = getLevelExpRequirement(state.level);
    const percentage = (state.exp / requiredExp) * 100;

    return {
        currentLevel: state.level,
        currentExp: state.exp,
        requiredExp,
        percentage
    };
};

// 预定义成就列表 (多级制)
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
    {
        id: 'words_learned',
        name: '单词学习者',
        description: '学习单词的累计成就',
        icon: '📚',
        category: 'words_learned',
        currentTier: null,
        tiers: [
            { tier: AchievementTier.BRONZE, target: 50, reward: { affection: 2, exp: 20, title: '初学者' }, unlocked: false },
            { tier: AchievementTier.SILVER, target: 200, reward: { affection: 5, exp: 50, title: '学习者' }, unlocked: false },
            { tier: AchievementTier.GOLD, target: 500, reward: { affection: 10, exp: 100, title: '词汇专家' }, unlocked: false },
            { tier: AchievementTier.DIAMOND, target: 1000, reward: { affection: 20, exp: 200, title: '单词大师' }, unlocked: false }
        ]
    },
    {
        id: 'consecutive_days',
        name: '坚持不懈',
        description: '连续打卡天数成就',
        icon: '🔥',
        category: 'consecutive_days',
        currentTier: null,
        tiers: [
            { tier: AchievementTier.BRONZE, target: 7, reward: { affection: 3, exp: 30, title: '七日之约' }, unlocked: false },
            { tier: AchievementTier.SILVER, target: 30, reward: { affection: 8, exp: 80, title: '月度坚持' }, unlocked: false },
            { tier: AchievementTier.GOLD, target: 100, reward: { affection: 15, exp: 150, title: '百日坚守' }, unlocked: false },
            { tier: AchievementTier.DIAMOND, target: 365, reward: { affection: 30, exp: 300, title: '年度传奇' }, unlocked: false }
        ]
    },
    {
        id: 'stories',
        name: 'AI 故事冒险家',
        description: '完成 AI 故事数量成就',
        icon: '�',
        category: 'stories',
        currentTier: null,
        tiers: [
            { tier: AchievementTier.BRONZE, target: 5, reward: { affection: 2, exp: 25, title: '故事新手' }, unlocked: false },
            { tier: AchievementTier.SILVER, target: 20, reward: { affection: 5, exp: 60, title: '故事爱好者' }, unlocked: false },
            { tier: AchievementTier.GOLD, target: 50, reward: { affection: 10, exp: 120, title: '故事收藏家' }, unlocked: false },
            { tier: AchievementTier.DIAMOND, target: 100, reward: { affection: 20, exp: 250, title: '故事大师' }, unlocked: false }
        ]
    },
    {
        id: 'adventures',
        name: 'Word Odyssey 探险者',
        description: '完成冒险次数成就',
        icon: '�️',
        category: 'adventures',
        currentTier: null,
        tiers: [
            { tier: AchievementTier.BRONZE, target: 3, reward: { affection: 3, exp: 35, title: '见习冒险者' }, unlocked: false },
            { tier: AchievementTier.SILVER, target: 10, reward: { affection: 7, exp: 70, title: '冒险者' }, unlocked: false },
            { tier: AchievementTier.GOLD, target: 30, reward: { affection: 12, exp: 140, title: '资深探险家' }, unlocked: false },
            { tier: AchievementTier.DIAMOND, target: 100, reward: { affection: 25, exp: 280, title: '传奇冒险家' }, unlocked: false }
        ]
    },
    {
        id: 'level',
        name: '等级提升',
        description: '达到指定等级的成就',
        icon: '⭐',
        category: 'level',
        currentTier: null,
        tiers: [
            { tier: AchievementTier.BRONZE, target: 10, reward: { affection: 3, exp: 0, title: '初露锋芒' }, unlocked: false },
            { tier: AchievementTier.SILVER, target: 20, reward: { affection: 6, exp: 0, title: '渐入佳境' }, unlocked: false },
            { tier: AchievementTier.GOLD, target: 35, reward: { affection: 10, exp: 0, title: '一代宗师' }, unlocked: false },
            { tier: AchievementTier.DIAMOND, target: 50, reward: { affection: 20, exp: 0, title: '登峰造极' }, unlocked: false }
        ]
    },
    {
        id: 'affection',
        name: '好感度里程碑',
        description: '达到指定好感度的成就',
        icon: '💕',
        category: 'affection',
        currentTier: null,
        tiers: [
            { tier: AchievementTier.BRONZE, target: 25, reward: { affection: 0, exp: 30, title: '初识之喜' }, unlocked: false },
            { tier: AchievementTier.SILVER, target: 50, reward: { affection: 0, exp: 80, title: '知心好友' }, unlocked: false },
            { tier: AchievementTier.GOLD, target: 75, reward: { affection: 0, exp: 150, title: '亲密伙伴' }, unlocked: false },
            { tier: AchievementTier.DIAMOND, target: 100, reward: { affection: 0, exp: 300, title: '永恒之约' }, unlocked: false }
        ]
    }
];

// 获取成就列表
export const getAchievements = (): Achievement[] => {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (stored) {
        try {
            const achievements: Achievement[] = JSON.parse(stored);
            // 验证数据格式是否为新的多级制格式
            if (achievements.length > 0 && achievements[0].tiers && Array.isArray(achievements[0].tiers)) {
                return achievements;
            }
            // 旧格式数据，清除并使用默认值
            console.log('检测到旧格式成就数据，重置为新格式');
        } catch (e) {
            console.error('成就数据解析失败', e);
        }
    }
    // 使用默认成就数据
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(DEFAULT_ACHIEVEMENTS));
    return DEFAULT_ACHIEVEMENTS;
};

// 检查并解锁成就
export const checkAchievements = (): Achievement[] => {
    const state = getMateState();
    const achievements = getAchievements();
    const newlyUnlocked: Achievement[] = [];

    achievements.forEach(achievement => {
        // 获取当前进度值
        let currentValue = 0;
        switch (achievement.category) {
            case 'words_learned':
                currentValue = state.stats.totalWordsLearned;
                break;
            case 'consecutive_days':
                currentValue = state.stats.consecutiveDays;
                break;
            case 'stories':
                currentValue = state.stats.storiesCompleted;
                break;
            case 'adventures':
                currentValue = state.stats.adventuresCompleted;
                break;
            case 'level':
                currentValue = state.level;
                break;
            case 'affection':
                currentValue = state.affection;
                break;
        }

        // 检查每个等级是否达成
        achievement.tiers.forEach(tier => {
            if (!tier.unlocked && currentValue >= tier.target) {
                tier.unlocked = true;
                tier.unlockedAt = Date.now();
                achievement.currentTier = tier.tier;
                achievement.unlockedAt = Date.now();

                // 标记为新解锁（只有当前等级才提示）
                if (achievement.currentTier === tier.tier) {
                    newlyUnlocked.push(achievement);
                }

                // 应用奖励
                if (tier.reward.affection > 0) {
                    addAffection(tier.reward.affection);
                }
                if (tier.reward.exp > 0) {
                    addExp(tier.reward.exp);
                }

                // 更新成就统计
                state.stats.achievementsUnlocked++;
                saveMateState(state);
            }
        });
    });

    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    return newlyUnlocked;
};

// 获取每日签到奖励预览
export const getDailyCheckinReward = (): { affection: number; exp: number } => {
    const state = getMateState();
    const consecutiveDays = state.stats.consecutiveDays;
    const affection = 3 + Math.min(Math.floor(consecutiveDays / 10), 5);
    const exp = 15 + Math.min(Math.floor(consecutiveDays / 5) * 5, 30);
    return { affection, exp };
};

// 获取下一个里程碑
export const getNextMilestone = (): AffectionMilestone | null => {
    const state = getMateState();
    const reached = getReachedMilestones();

    for (const milestone of AFFECTION_MILESTONES) {
        if (state.affection < milestone.affection && !reached.includes(milestone.affection)) {
            return milestone;
        }
    }
    return null;
};

// 获取所有里程碑（用于展示）
export const getAllMilestones = (): AffectionMilestone[] => {
    return AFFECTION_MILESTONES;
};

// 获取奖励预览
export const getInteractionReward = (type: InteractionType): { affection: number; exp: number } => {
    let baseAffection = 0;
    let baseExp = 0;
    const state = getMateState();

    switch (type) {
        case InteractionType.GREETING:
            baseAffection = 1;
            baseExp = 5;
            break;
        case InteractionType.STUDY_START:
            baseAffection = 2;
            baseExp = 10;
            break;
        case InteractionType.STUDY_COMPLETE:
            baseAffection = 5;
            baseExp = 30;
            break;
        case InteractionType.WORD_MASTERED:
            baseAffection = 3;
            baseExp = 15;
            break;
        case InteractionType.STORY_COMPLETE:
            baseAffection = 10;
            baseExp = 50;
            break;
        case InteractionType.ADVENTURE_COMPLETE:
            baseAffection = 20;
            baseExp = 100;
            break;
        case InteractionType.MILESTONE:
            baseAffection = 15;
            baseExp = 75;
            break;
        case InteractionType.DAILY_CHECKIN:
            const consecutiveDays = state.stats.consecutiveDays;
            baseAffection = 5 + Math.min(Math.floor(consecutiveDays / 7), 10);
            baseExp = 20 + Math.min(Math.floor(consecutiveDays / 3) * 5, 50);
            break;
    }

    return { affection: baseAffection, exp: baseExp };
};

// 获取详细统计
export const getDetailedStats = () => {
    const state = getMateState();
    const combo = getCurrentCombo();
    const nextMilestone = getNextMilestone();
    const levelProgress = getLevelProgress();
    const reachedMilestones = getReachedMilestones();

    return {
        level: state.level,
        exp: state.exp,
        affection: state.affection,
        affectionTitle: getAffectionTitle(state.affection),
        combo,
        levelProgress,
        nextMilestone,
        milestoneProgress: {
            reached: reachedMilestones.length,
            total: AFFECTION_MILESTONES.length
        },
        stats: state.stats
    };
};

// 重置 WordMate 数据（用于测试）
export const resetMateData = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(INTERACTIONS_KEY);
    localStorage.removeItem(ACHIEVEMENTS_KEY);
    localStorage.removeItem(COMBO_KEY);
    localStorage.removeItem(MILESTONES_KEY);
};
