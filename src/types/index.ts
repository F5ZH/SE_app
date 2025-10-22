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
  WORD_TO_TRANSLATION = 'word_to_translation'   // 看英语回忆汉语释义（原有模式）
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
