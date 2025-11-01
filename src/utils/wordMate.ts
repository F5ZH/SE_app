import {
  WordMateState,
  WordMateMood,
  MateStats,
  InteractionRecord,
  InteractionType,
  Achievement
} from '../types';

/**
 * WordMate 养成系统核心工具
 * 管理虚拟形象的状态、好感度、等级等
 */

// LocalStorage 键名
const STORAGE_KEY = 'wordmate_state';
const INTERACTIONS_KEY = 'wordmate_interactions';
const ACHIEVEMENTS_KEY = 'wordmate_achievements';

// 等级经验值配置（指数增长）
const getLevelExpRequirement = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
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
    return JSON.parse(stored);
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
export const addAffection = (amount: number): WordMateState => {
  const state = getMateState();
  state.affection = Math.min(100, state.affection + amount);
  saveMateState(state);
  return state;
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
} => {
  const state = getMateState();

  // 根据互动类型计算奖励
  let affectionGain = 0;
  let expGain = 0;

  switch (type) {
    case InteractionType.GREETING:
      affectionGain = 1;
      expGain = 5;
      break;
    case InteractionType.STUDY_START:
      affectionGain = 2;
      expGain = 10;
      break;
    case InteractionType.STUDY_COMPLETE:
      affectionGain = 5;
      expGain = 30;
      break;
    case InteractionType.WORD_MASTERED:
      affectionGain = 3;
      expGain = 15;
      break;
    case InteractionType.STORY_COMPLETE:
      affectionGain = 10;
      expGain = 50;
      state.stats.storiesCompleted++;
      break;
    case InteractionType.ADVENTURE_COMPLETE:
      affectionGain = 20;
      expGain = 100;
      state.stats.adventuresCompleted++;
      break;
    case InteractionType.MILESTONE:
      affectionGain = 15;
      expGain = 75;
      break;
    case InteractionType.DAILY_CHECKIN:
      affectionGain = 5;
      expGain = 20;
      state.stats.consecutiveDays++;
      break;
  }

  // 应用好感度
  state.affection = Math.min(100, state.affection + affectionGain);

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

  // 应用经验值并检查升级
  const { leveledUp } = addExp(expGain);

  return { affectionGain, expGain, state, leveledUp };
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

// 预定义成就列表
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_word',
    name: '初次相遇',
    description: '学习第一个单词',
    icon: '🌱',
    condition: { type: 'words_learned', target: 1 },
    reward: { affection: 10, exp: 20 },
    unlocked: false
  },
  {
    id: 'words_10',
    name: '初窥门径',
    description: '累计学习 10 个单词',
    icon: '📚',
    condition: { type: 'words_learned', target: 10 },
    reward: { affection: 15, exp: 30 },
    unlocked: false
  },
  {
    id: 'words_50',
    name: '勤学苦练',
    description: '累计学习 50 个单词',
    icon: '✨',
    condition: { type: 'words_learned', target: 50 },
    reward: { affection: 20, exp: 50 },
    unlocked: false
  },
  {
    id: 'words_100',
    name: '百词斩',
    description: '累计学习 100 个单词',
    icon: '🏆',
    condition: { type: 'words_learned', target: 100 },
    reward: { affection: 30, exp: 100, unlockContent: ['outfit_scholar'] },
    unlocked: false
  },
  {
    id: 'consecutive_7',
    name: '七日之约',
    description: '连续打卡 7 天',
    icon: '🔥',
    condition: { type: 'consecutive_days', target: 7 },
    reward: { affection: 25, exp: 75 },
    unlocked: false
  },
  {
    id: 'consecutive_30',
    name: '月之守护',
    description: '连续打卡 30 天',
    icon: '🌙',
    condition: { type: 'consecutive_days', target: 30 },
    reward: { affection: 50, exp: 150, unlockContent: ['background_moonlight'] },
    unlocked: false
  },
  {
    id: 'story_5',
    name: '故事爱好者',
    description: '完成 5 个 AI 故事',
    icon: '📖',
    condition: { type: 'stories', target: 5 },
    reward: { affection: 20, exp: 60 },
    unlocked: false
  },
  {
    id: 'adventure_3',
    name: '冒险者',
    description: '完成 3 次 Word Odyssey',
    icon: '🗺️',
    condition: { type: 'adventures', target: 3 },
    reward: { affection: 30, exp: 90, unlockContent: ['outfit_adventurer'] },
    unlocked: false
  },
  {
    id: 'level_10',
    name: '渐入佳境',
    description: '达到 10 级',
    icon: '⭐',
    condition: { type: 'level', target: 10 },
    reward: { affection: 20, exp: 0 },
    unlocked: false
  },
  {
    id: 'affection_50',
    name: '知己',
    description: '好感度达到 50',
    icon: '💕',
    condition: { type: 'affection', target: 50 },
    reward: { affection: 0, exp: 100, unlockContent: ['background_cherry_blossom'] },
    unlocked: false
  }
];

// 获取成就列表
export const getAchievements = (): Achievement[] => {
  const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(DEFAULT_ACHIEVEMENTS));
  return DEFAULT_ACHIEVEMENTS;
};

// 检查并解锁成就
export const checkAchievements = (): Achievement[] => {
  const state = getMateState();
  const achievements = getAchievements();
  const newlyUnlocked: Achievement[] = [];

  achievements.forEach(achievement => {
    if (achievement.unlocked) return;

    let conditionMet = false;
    const { type, target } = achievement.condition;

    switch (type) {
      case 'words_learned':
        conditionMet = state.stats.totalWordsLearned >= target;
        break;
      case 'consecutive_days':
        conditionMet = state.stats.consecutiveDays >= target;
        break;
      case 'stories':
        conditionMet = state.stats.storiesCompleted >= target;
        break;
      case 'adventures':
        conditionMet = state.stats.adventuresCompleted >= target;
        break;
      case 'level':
        conditionMet = state.level >= target;
        break;
      case 'affection':
        conditionMet = state.affection >= target;
        break;
    }

    if (conditionMet) {
      achievement.unlocked = true;
      achievement.unlockedAt = Date.now();
      newlyUnlocked.push(achievement);

      // 应用奖励
      if (achievement.reward.affection > 0) {
        addAffection(achievement.reward.affection);
      }
      if (achievement.reward.exp > 0) {
        addExp(achievement.reward.exp);
      }

      // 更新成就统计
      state.stats.achievementsUnlocked++;
      saveMateState(state);
    }
  });

  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  return newlyUnlocked;
};

// 重置 WordMate 数据（用于测试）
export const resetMateData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(INTERACTIONS_KEY);
  localStorage.removeItem(ACHIEVEMENTS_KEY);
};
