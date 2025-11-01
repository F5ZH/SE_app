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
const MILESTONES_KEY = 'wordmate_milestones';

// 等级经验值配置（优化后的增长曲线 - 150天左右满级）
// 假设每天学习50单词，获得约200-300经验，150天累计约30000-45000经验
const getLevelExpRequirement = (level: number): number => {
    if (level <= 10) {
        // Lv1-10: 快速体验 (50, 60, 70...140) 累计: ~950
        return 40 + level * 10;
    } else if (level <= 20) {
        // Lv11-20: 稳步增长 (160, 180, 200...340) 累计: ~3,450
        return 140 + (level - 10) * 20;
    } else if (level <= 30) {
        // Lv21-30: 中速增长 (380, 420, 460...740) 累计: ~9,050
        return 340 + (level - 20) * 40;
    } else if (level <= 40) {
        // Lv31-40: 后期挑战 (820, 920, 1020...1820) 累计: ~22,250
        return 740 + (level - 30) * 100;
    } else {
        // Lv41-50: 终极目标 (2020, 2220, 2420...3820) 累计: ~50,000
        return 1820 + (level - 40) * 200;
    }
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

// 好感度上限提升到200，让养成周期更长，更适合长期背单词
const AFFECTION_MILESTONES: AffectionMilestone[] = [
    { affection: 10, reward: { exp: 50, title: '初次相遇', description: '你好呀，请多指教~' } },
    { affection: 20, reward: { exp: 100, title: '渐渐熟悉', description: '我们开始熟悉啦！' } },
    { affection: 30, reward: { exp: 150, title: '互相了解', description: '感觉我们挺合得来的~' } },
    { affection: 40, reward: { exp: 200, title: '学习伙伴', description: '一起学习真开心！' } },
    { affection: 50, reward: { exp: 250, title: '默契配合', description: '我们越来越有默契了！' } },
    { affection: 60, reward: { exp: 300, title: '志同道合', description: '和你聊天总是很愉快~' } },
    { affection: 80, reward: { exp: 400, title: '知心朋友', description: '你已经是我重要的朋友了！' } },
    { affection: 100, reward: { exp: 500, title: '亲密无间', description: '有你陪伴，每天都充满动力！' } },
    { affection: 120, reward: { exp: 600, title: '形影不离', description: '每天都期待和你见面~' } },
    { affection: 140, reward: { exp: 700, title: '心有灵犀', description: '不用说我也懂你在想什么！' } },
    { affection: 160, reward: { exp: 800, title: '互相信赖', description: '我会永远支持你的！' } },
    { affection: 180, reward: { exp: 1000, title: '灵魂伴侣', description: '感谢你一路以来的陪伴！' } },
    { affection: 200, reward: { exp: 1500, title: '永恒之约', description: '我们永远是最好的伙伴！💕' } }
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

        // 检查好感度衰减（适配200上限，衰减速度保持不变）
        const now = Date.now();
        const daysSinceLastInteraction = Math.floor((now - state.lastInteraction) / (1000 * 60 * 60 * 24));

        // 如果超过3天没有互动，开始衰减好感度
        if (daysSinceLastInteraction >= 3) {
            // 每天衰减2点好感度（从第3天开始），适用于200上限
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

// 计算好感度等级标题（适配200上限）
export const getAffectionTitle = (affection: number): string => {
    if (affection >= 180) return '永恒之约';
    if (affection >= 160) return '互相信赖';
    if (affection >= 140) return '心有灵犀';
    if (affection >= 120) return '形影不离';
    if (affection >= 100) return '亲密无间';
    if (affection >= 80) return '知心朋友';
    if (affection >= 60) return '志同道合';
    if (affection >= 50) return '默契配合';
    if (affection >= 40) return '学习伙伴';
    if (affection >= 30) return '互相了解';
    if (affection >= 20) return '渐渐熟悉';
    if (affection >= 10) return '初次相遇';
    return '初来乍到';
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
    state.affection = Math.min(200, state.affection + amount); // 上限调整为200

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
    milestone: AffectionMilestone | null;
} => {
    const state = getMateState();

    // 根据互动类型计算基础奖励（大幅降低好感度增长，让养成周期更长）
    let baseAffectionGain = 0;
    let baseExpGain = 0;

    switch (type) {
        case InteractionType.GREETING:
            baseAffectionGain = 0; // 仅问候不增加好感度
            baseExpGain = 5;
            break;
        case InteractionType.STUDY_START:
            baseAffectionGain = 0; // 开始学习不增加，完成才增加
            baseExpGain = 10;
            break;
        case InteractionType.STUDY_COMPLETE:
            baseAffectionGain = 2; // 降低：5 -> 2
            baseExpGain = 30;
            break;
        case InteractionType.WORD_MASTERED:
            baseAffectionGain = 0; // 降低：1 -> 0，掌握单词主要奖励经验
            baseExpGain = 10;
            break;
        case InteractionType.STORY_COMPLETE:
            baseAffectionGain = 3; // 降低：5 -> 3
            baseExpGain = 30;
            state.stats.storiesCompleted++;
            break;
        case InteractionType.ADVENTURE_COMPLETE:
            baseAffectionGain = 5; // 降低：10 -> 5
            baseExpGain = 60;
            state.stats.adventuresCompleted++;
            break;
        case InteractionType.MILESTONE:
            baseAffectionGain = 4; // 降低：8 -> 4
            baseExpGain = 50;
            break;
        case InteractionType.DAILY_CHECKIN:
            // 每日签到是主要好感度来源，但递进更慢（适配200上限）
            const consecutiveDays = state.stats.consecutiveDays;
            // 基础2点 + 每20天增加1点（最多+10点）= 最终12点/天
            baseAffectionGain = 2 + Math.min(Math.floor(consecutiveDays / 20), 10);
            // 经验值保持不变
            baseExpGain = 15 + Math.min(Math.floor(consecutiveDays / 5) * 5, 30);
            break;
    }

    // 直接使用基础奖励（移除连击加成）
    const affectionGain = baseAffectionGain;
    const expGain = baseExpGain;

    // 应用好感度（上限调整为200）
    const oldAffection = state.affection;
    state.affection = Math.min(200, state.affection + affectionGain);

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

    return { affectionGain, expGain: totalExpGain, state, leveledUp, milestone };
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
            { tier: AchievementTier.BRONZE, target: 100, reward: { affection: 2, exp: 20, title: '初学者' }, unlocked: false },
            { tier: AchievementTier.SILVER, target: 500, reward: { affection: 5, exp: 50, title: '学习者' }, unlocked: false },
            { tier: AchievementTier.GOLD, target: 1500, reward: { affection: 10, exp: 100, title: '词汇专家' }, unlocked: false },
            { tier: AchievementTier.DIAMOND, target: 3000, reward: { affection: 20, exp: 200, title: '单词大师' }, unlocked: false }
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
        icon: '📖',
        category: 'stories',
        currentTier: null,
        tiers: [
            { tier: AchievementTier.BRONZE, target: 10, reward: { affection: 2, exp: 25, title: '故事新手' }, unlocked: false },
            { tier: AchievementTier.SILVER, target: 30, reward: { affection: 5, exp: 60, title: '故事爱好者' }, unlocked: false },
            { tier: AchievementTier.GOLD, target: 100, reward: { affection: 10, exp: 120, title: '故事收藏家' }, unlocked: false },
            { tier: AchievementTier.DIAMOND, target: 200, reward: { affection: 20, exp: 250, title: '故事大师' }, unlocked: false }
        ]
    },
    {
        id: 'adventures',
        name: 'Word Odyssey 探险者',
        description: '完成冒险次数成就',
        icon: '🗺️',
        category: 'adventures',
        currentTier: null,
        tiers: [
            { tier: AchievementTier.BRONZE, target: 5, reward: { affection: 3, exp: 35, title: '见习冒险者' }, unlocked: false },
            { tier: AchievementTier.SILVER, target: 20, reward: { affection: 7, exp: 70, title: '冒险者' }, unlocked: false },
            { tier: AchievementTier.GOLD, target: 50, reward: { affection: 12, exp: 140, title: '资深探险家' }, unlocked: false },
            { tier: AchievementTier.DIAMOND, target: 150, reward: { affection: 25, exp: 280, title: '传奇冒险家' }, unlocked: false }
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
            { tier: AchievementTier.BRONZE, target: 50, reward: { affection: 0, exp: 30, title: '初识之喜' }, unlocked: false },
            { tier: AchievementTier.SILVER, target: 100, reward: { affection: 0, exp: 80, title: '亲密无间' }, unlocked: false },
            { tier: AchievementTier.GOLD, target: 150, reward: { affection: 0, exp: 150, title: '心有灵犀' }, unlocked: false },
            { tier: AchievementTier.DIAMOND, target: 200, reward: { affection: 0, exp: 300, title: '永恒之约' }, unlocked: false }
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
                // 检查是否需要更新目标值（版本v1.1更新）
                const needsUpdate =
                    achievements.find(a => a.id === 'words_learned')?.tiers[0].target === 50 ||
                    achievements.find(a => a.id === 'stories')?.tiers[0].target === 5 ||
                    achievements.find(a => a.id === 'adventures')?.tiers[0].target === 3 ||
                    achievements.find(a => a.id === 'stories')?.icon === '�' ||
                    achievements.find(a => a.id === 'adventures')?.icon === '�️';

                if (needsUpdate) {
                    console.log('检测到旧版本成就数据，更新到v1.1版本...');
                    // 保留用户的解锁状态，但更新目标值和图标
                    const updatedAchievements = DEFAULT_ACHIEVEMENTS.map(defaultAch => {
                        const userAch = achievements.find(a => a.id === defaultAch.id);
                        if (userAch) {
                            // 保留用户的解锁状态和解锁时间
                            return {
                                ...defaultAch,
                                currentTier: userAch.currentTier,
                                tiers: defaultAch.tiers.map((defaultTier, index) => ({
                                    ...defaultTier,
                                    unlocked: userAch.tiers[index]?.unlocked || false,
                                    unlockedAt: userAch.tiers[index]?.unlockedAt
                                }))
                            };
                        }
                        return defaultAch;
                    });
                    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updatedAchievements));
                    console.log('✅ 成就数据已更新到v1.1版本');
                    return updatedAchievements;
                }

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

// 获取每日签到奖励预览（适配新的计算公式）
export const getDailyCheckinReward = (): { affection: number; exp: number } => {
    const state = getMateState();
    const consecutiveDays = state.stats.consecutiveDays;
    // 基础2点 + 每20天增加1点（最多+10点）
    const affection = 2 + Math.min(Math.floor(consecutiveDays / 20), 10);
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
    const nextMilestone = getNextMilestone();
    const levelProgress = getLevelProgress();
    const reachedMilestones = getReachedMilestones();

    return {
        level: state.level,
        exp: state.exp,
        affection: state.affection,
        affectionTitle: getAffectionTitle(state.affection),
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
    localStorage.removeItem(MILESTONES_KEY);
};
