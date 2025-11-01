/**
 * 服装和小剧场解锁系统工具函数
 */

import { WordMateState, Achievement, OutfitConfig, AccessoryConfig, StoryScene } from '../types';
import { OUTFITS, ACCESSORIES } from '../data/outfitSystem';
import { getAllStories } from '../data/storyScenes';

const UNLOCKED_OUTFITS_KEY = 'wordmate_unlocked_outfits';
const UNLOCKED_ACCESSORIES_KEY = 'wordmate_unlocked_accessories';
const UNLOCKED_STORIES_KEY = 'wordmate_unlocked_stories';
const VIEWED_STORIES_KEY = 'wordmate_viewed_stories';

// ========== 解锁条件检查 ==========

/**
 * 检查服装是否满足解锁条件
 */
export const checkOutfitUnlock = (
    outfit: OutfitConfig,
    mate: WordMateState,
    achievements: Achievement[]
): boolean => {
    const { unlockCondition } = outfit;

    // 检查好感度
    if (unlockCondition.affection !== undefined && mate.affection < unlockCondition.affection) {
        return false;
    }

    // 检查等级
    if (unlockCondition.level !== undefined && mate.level < unlockCondition.level) {
        return false;
    }

    // 检查成就
    if (unlockCondition.achievement) {
        const achievement = achievements.find(a => a.id === unlockCondition.achievement);
        if (!achievement || !achievement.tiers.some(t => t.unlocked)) {
            return false;
        }
    }

    // 检查特殊条件
    if (unlockCondition.special === 'all_achievements') {
        const allUnlocked = achievements.every(a => a.tiers.some(t => t.unlocked));
        if (!allUnlocked) return false;
    }

    return true;
};

/**
 * 检查配饰是否满足解锁条件
 */
export const checkAccessoryUnlock = (
    accessory: AccessoryConfig,
    mate: WordMateState,
    achievements: Achievement[]
): boolean => {
    const { unlockCondition } = accessory;

    // 检查好感度
    if (unlockCondition.affection !== undefined && mate.affection < unlockCondition.affection) {
        return false;
    }

    // 检查等级
    if (unlockCondition.level !== undefined && mate.level < unlockCondition.level) {
        return false;
    }

    // 检查成就
    if (unlockCondition.achievement) {
        const achievement = achievements.find(a => a.id === unlockCondition.achievement);
        if (!achievement || !achievement.tiers.some(t => t.unlocked)) {
            return false;
        }
    }

    // 检查服装
    if (unlockCondition.outfit) {
        const unlockedOutfits = getUnlockedOutfits();
        if (!unlockedOutfits.includes(unlockCondition.outfit)) {
            return false;
        }
    }

    // 检查特殊条件
    if (unlockCondition.special === 'all_achievements') {
        const allUnlocked = achievements.every(a => a.tiers.some(t => t.unlocked));
        if (!allUnlocked) return false;
    }

    return true;
};

/**
 * 检查小剧场是否满足解锁条件
 */
export const checkStoryUnlock = (
    story: StoryScene,
    mate: WordMateState,
    achievements: Achievement[]
): boolean => {
    const { unlockCondition } = story;

    // 检查好感度
    if (unlockCondition.affection !== undefined && mate.affection < unlockCondition.affection) {
        return false;
    }

    // 检查等级
    if (unlockCondition.level !== undefined && mate.level < unlockCondition.level) {
        return false;
    }

    // 检查服装
    if (unlockCondition.outfit) {
        const unlockedOutfits = getUnlockedOutfits();
        if (!unlockedOutfits.includes(unlockCondition.outfit)) {
            return false;
        }
    }

    // 检查成就
    if (unlockCondition.achievement) {
        const achievement = achievements.find(a => a.id === unlockCondition.achievement);
        if (!achievement || !achievement.tiers.some(t => t.unlocked)) {
            return false;
        }
    }

    // 检查特殊条件
    if (unlockCondition.special) {
        // 这里可以根据实际情况检查特殊条件
        // 例如：midnight_study, birthday等
        return checkSpecialCondition(unlockCondition.special, mate);
    }

    return true;
};

/**
 * 检查特殊条件
 */
const checkSpecialCondition = (condition: string, _mate: WordMateState): boolean => {
    switch (condition) {
        case 'study_after_midnight':
            // 检查是否在午夜后学习（需要在实际学习时设置标记）
            return localStorage.getItem('last_midnight_study') !== null;

        case 'rainy_day_checkin':
            // 检查是否在雨天签到（需要天气API或手动触发）
            return localStorage.getItem('rainy_day_flag') !== null;

        case 'perfect_study_session':
            // 检查是否完美答题（需要在学习完成时设置）
            return localStorage.getItem('last_perfect_score') !== null;

        case 'user_birthday':
            // 检查是否是用户生日
            const birthdayStr = localStorage.getItem('user_birthday');
            if (!birthdayStr) return false;
            const birthday = new Date(birthdayStr);
            const today = new Date();
            return birthday.getMonth() === today.getMonth() && birthday.getDate() === today.getDate();

        case 'all_achievements':
            // 在上层已经检查过了
            return true;

        default:
            return false;
    }
};

// ========== 解锁状态管理 ==========

/**
 * 获取已解锁的服装列表
 */
export const getUnlockedOutfits = (): string[] => {
    const stored = localStorage.getItem(UNLOCKED_OUTFITS_KEY);
    return stored ? JSON.parse(stored) : ['default']; // 默认服装总是解锁的
};

/**
 * 解锁服装
 */
export const unlockOutfit = (outfitId: string): void => {
    const unlocked = getUnlockedOutfits();
    if (!unlocked.includes(outfitId)) {
        unlocked.push(outfitId);
        localStorage.setItem(UNLOCKED_OUTFITS_KEY, JSON.stringify(unlocked));
    }
};

/**
 * 获取已解锁的配饰列表
 */
export const getUnlockedAccessories = (): string[] => {
    const stored = localStorage.getItem(UNLOCKED_ACCESSORIES_KEY);
    return stored ? JSON.parse(stored) : [];
};

/**
 * 解锁配饰
 */
export const unlockAccessory = (accessoryId: string): void => {
    const unlocked = getUnlockedAccessories();
    if (!unlocked.includes(accessoryId)) {
        unlocked.push(accessoryId);
        localStorage.setItem(UNLOCKED_ACCESSORIES_KEY, JSON.stringify(unlocked));
    }
};

/**
 * 获取已解锁的剧场列表
 */
export const getUnlockedStories = (): string[] => {
    const stored = localStorage.getItem(UNLOCKED_STORIES_KEY);
    return stored ? JSON.parse(stored) : [];
};

/**
 * 解锁剧场
 */
export const unlockStory = (storyId: string): void => {
    const unlocked = getUnlockedStories();
    if (!unlocked.includes(storyId)) {
        unlocked.push(storyId);
        localStorage.setItem(UNLOCKED_STORIES_KEY, JSON.stringify(unlocked));
    }
};

/**
 * 获取已观看的剧场列表
 */
export const getViewedStories = (): string[] => {
    const stored = localStorage.getItem(VIEWED_STORIES_KEY);
    return stored ? JSON.parse(stored) : [];
};

/**
 * 标记剧场为已观看
 */
export const markStoryAsViewed = (storyId: string): void => {
    const viewed = getViewedStories();
    if (!viewed.includes(storyId)) {
        viewed.push(storyId);
        localStorage.setItem(VIEWED_STORIES_KEY, JSON.stringify(viewed));
    }
};

// ========== 获取可用列表 ==========

/**
 * 获取所有服装及其解锁状态
 */
export const getAvailableOutfits = (
    mate: WordMateState,
    achievements: Achievement[]
): OutfitConfig[] => {
    const unlockedIds = getUnlockedOutfits();

    return OUTFITS.map(outfit => ({
        ...outfit,
        unlocked: unlockedIds.includes(outfit.id) || checkOutfitUnlock(outfit, mate, achievements)
    }));
};

/**
 * 获取所有配饰及其解锁状态
 */
export const getAvailableAccessories = (
    mate: WordMateState,
    achievements: Achievement[]
): AccessoryConfig[] => {
    const unlockedIds = getUnlockedAccessories();

    return ACCESSORIES.map(accessory => ({
        ...accessory,
        unlocked: unlockedIds.includes(accessory.id) || checkAccessoryUnlock(accessory, mate, achievements)
    }));
};

/**
 * 获取所有剧场及其解锁状态
 */
export const getAvailableStories = (
    mate: WordMateState,
    achievements: Achievement[]
): StoryScene[] => {
    const unlockedIds = getUnlockedStories();
    const viewedIds = getViewedStories();

    return getAllStories().map(story => ({
        ...story,
        unlocked: unlockedIds.includes(story.id) || checkStoryUnlock(story, mate, achievements),
        viewed: viewedIds.includes(story.id)
    }));
};

// ========== 自动检查新解锁 ==========

/**
 * 检查并解锁新内容
 * 返回新解锁的内容列表
 */
export const checkAndUnlockNew = (
    mate: WordMateState,
    achievements: Achievement[]
): {
    outfits: OutfitConfig[];
    accessories: AccessoryConfig[];
    stories: StoryScene[];
} => {
    const newOutfits: OutfitConfig[] = [];
    const newAccessories: AccessoryConfig[] = [];
    const newStories: StoryScene[] = [];

    // 检查服装
    const unlockedOutfitIds = getUnlockedOutfits();
    OUTFITS.forEach(outfit => {
        if (!unlockedOutfitIds.includes(outfit.id) && checkOutfitUnlock(outfit, mate, achievements)) {
            unlockOutfit(outfit.id);
            newOutfits.push(outfit);
        }
    });

    // 检查配饰
    const unlockedAccessoryIds = getUnlockedAccessories();
    ACCESSORIES.forEach(accessory => {
        if (!unlockedAccessoryIds.includes(accessory.id) && checkAccessoryUnlock(accessory, mate, achievements)) {
            unlockAccessory(accessory.id);
            newAccessories.push(accessory);
        }
    });

    // 检查剧场
    const unlockedStoryIds = getUnlockedStories();
    getAllStories().forEach(story => {
        if (!unlockedStoryIds.includes(story.id) && checkStoryUnlock(story, mate, achievements)) {
            unlockStory(story.id);
            newStories.push(story);
        }
    });

    return { outfits: newOutfits, accessories: newAccessories, stories: newStories };
};

// ========== 解锁提示 ==========

/**
 * 获取解锁条件的文字描述
 */
export const getUnlockHint = (condition: any): string => {
    const hints: string[] = [];

    if (condition.affection !== undefined) {
        hints.push(`好感度 ${condition.affection}`);
    }

    if (condition.level !== undefined) {
        hints.push(`等级 ${condition.level}`);
    }

    if (condition.achievement) {
        hints.push(`完成成就`);
    }

    if (condition.outfit) {
        hints.push(`解锁特定服装`);
    }

    if (condition.special) {
        const specialHints: Record<string, string> = {
            'all_achievements': '完成所有成就',
            'study_after_midnight': '深夜学习',
            'rainy_day_checkin': '雨天签到',
            'perfect_study_session': '完美答题',
            'user_birthday': '生日当天'
        };
        hints.push(specialHints[condition.special] || '特殊条件');
    }

    return hints.join(' + ');
};
