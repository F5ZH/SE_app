// 单词数据结构
export interface Word {
  id: string;
  word: string;           // 单词
  pronunciation?: string; // 音标
  translation: string;    // 翻译
  example?: string;       // 例句
  difficulty: number;     // 难度等级 1-5
  createdAt: number;      // 创建时间戳
}

// 词书数据结构
export interface WordBook {
  id: string;
  name: string;           // 词书名称
  description?: string;   // 词书描述
  words: Word[];          // 单词列表
  totalWords: number;     // 总单词数
  isPreset: boolean;      // 是否为预设词书
  createdAt: number;      // 创建时间戳
}

// 学习记录数据结构
export interface StudyRecord {
  wordId: string;
  word: string;
  correctCount: number;   // 正确次数
  wrongCount: number;     // 错误次数
  lastReviewed: number;   // 最后复习时间
  nextReview: number;     // 下次复习时间
  interval: number;       // 复习间隔（天）
  easeFactor: number;     // 难度系数
  reviewCount: number;    // 复习次数
  difficultCount: number; // 生词标记次数
  studyMode: StudyMode;   // 最后使用的学习模式
}

// 学习模式枚举
export enum StudyMode {
  TRANSLATION_TO_WORD = 'translation_to_word',  // 看汉语释义拼写单词
  WORD_TO_CHOICE = 'word_to_choice',            // 看英语选择汉语释义
  WORD_TO_TRANSLATION = 'word_to_translation',  // 看英语回忆汉语释义（原有模式）
  AI_STORY = 'ai_story',                        // AI故事生成模式
  WORD_ODYSSEY = 'word_odyssey'                 // Word Odyssey 交互式冒险
}

// 学习会话配置
export interface StudySessionConfig {
  mode: StudyMode;
  showPronunciation: boolean;
  showExample: boolean;
  autoAdvance: boolean;
}

// 学习计划数据结构
export interface StudyPlan {
  id: string;
  wordBookId: string;
  wordBookName: string;
  dailyNewWords: number;  // 每日新词量
  startDate: number;      // 开始日期
  expectedEndDate: number; // 预期完成日期
  isActive: boolean;      // 是否激活
  createdAt: number;
}

// 今日学习任务
export interface TodayTask {
  newWords: Word[];       // 今日新词
  reviewWords: Word[];    // 今日复习词
  totalNew: number;       // 新词总数
  totalReview: number;    // 复习词总数
  completedNew: number;   // 已完成新词
  completedReview: number; // 已完成复习
}

// 艾宾浩斯遗忘曲线复习间隔（天）
export const EBBINGHAUS_INTERVALS = [1, 2, 4, 7, 15, 30, 60, 120];

// 难度等级枚举
export enum Difficulty {
  VERY_EASY = 1,
  EASY = 2,
  MEDIUM = 3,
  HARD = 4,
  VERY_HARD = 5
}

// 学习状态枚举
export enum StudyStatus {
  NEW = 'new',           // 新词
  LEARNING = 'learning', // 学习中
  REVIEWING = 'reviewing', // 复习中
  MASTERED = 'mastered'  // 已掌握
}

// ========== WordMate 养成系统 ==========

// 单词姬状态
export interface WordMateState {
  id: string;
  name: string;              // 昵称
  level: number;             // 等级 (1-50)
  exp: number;               // 当前经验值
  affection: number;         // 好感度 (0-100)
  mood: WordMateMood;        // 当前心情
  appearance: MateAppearance; // 外观配置
  stats: MateStats;          // 统计数据
  lastInteraction: number;   // 最后互动时间
  createdAt: number;         // 创建时间
}

// 心情状态
export enum WordMateMood {
  HAPPY = 'happy',           // 开心
  EXCITED = 'excited',       // 兴奋
  NORMAL = 'normal',         // 平静
  TIRED = 'tired',           // 疲倦
  ENCOURAGING = 'encouraging', // 鼓励
  PROUD = 'proud',           // 自豪
  WORRIED = 'worried'        // 担心
}

// 外观配置
export interface MateAppearance {
  avatar: string;            // 头像/立绘标识
  outfit: string;            // 服装
  accessory?: string;        // 配饰
  background: string;        // 背景场景
}

// 统计数据
export interface MateStats {
  totalStudyDays: number;    // 总学习天数
  consecutiveDays: number;   // 连续打卡天数
  totalWordsLearned: number; // 累计学习单词数
  storiesCompleted: number;  // 完成AI故事数
  adventuresCompleted: number; // 完成冒险数
  achievementsUnlocked: number; // 解锁成就数
}

// 互动记录
export interface InteractionRecord {
  id: string;
  type: InteractionType;     // 互动类型
  timestamp: number;         // 时间戳
  affectionGain: number;     // 获得好感度
  expGain: number;           // 获得经验值
  context?: string;          // 上下文信息
}

// 互动类型
export enum InteractionType {
  GREETING = 'greeting',           // 问候
  STUDY_START = 'study_start',     // 开始学习
  STUDY_COMPLETE = 'study_complete', // 完成学习
  WORD_MASTERED = 'word_mastered',   // 掌握单词
  STORY_COMPLETE = 'story_complete', // 完成故事
  ADVENTURE_COMPLETE = 'adventure_complete', // 完成冒险
  MILESTONE = 'milestone',         // 里程碑
  DAILY_CHECKIN = 'daily_checkin'  // 每日打卡
}

// 对话内容
export interface Dialogue {
  id: string;
  type: InteractionType;     // 对话类型
  mood: WordMateMood;        // 说话时的心情
  text: string;              // 对话文本
  requiredLevel?: number;    // 所需等级
  requiredAffection?: number; // 所需好感度
}

// 成就系统
export interface Achievement {
  id: string;
  name: string;              // 成就名称
  description: string;       // 成就描述
  icon: string;              // 图标
  condition: AchievementCondition; // 达成条件
  reward: AchievementReward; // 奖励
  unlocked: boolean;         // 是否已解锁
  unlockedAt?: number;       // 解锁时间
}

// 成就条件
export interface AchievementCondition {
  type: 'words_learned' | 'consecutive_days' | 'stories' | 'adventures' | 'level' | 'affection';
  target: number;            // 目标值
}

// 成就奖励
export interface AchievementReward {
  affection: number;         // 好感度奖励
  exp: number;               // 经验值奖励
  unlockContent?: string[];  // 解锁内容（服装、背景等）
}
