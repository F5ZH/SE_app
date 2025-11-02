import { StudyRecord, EBBINGHAUS_INTERVALS, StudyMode } from '../types';

/**
 * 艾宾浩斯遗忘曲线算法实现
 * 基于SuperMemo算法，用于计算单词复习间隔
 */

// 初始难度系数
const INITIAL_EASE_FACTOR = 2.5;
// 最小难度系数
const MIN_EASE_FACTOR = 1.3;
// 最大难度系数
const MAX_EASE_FACTOR = 3.0;

/**
 * 根据用户回答质量更新学习记录
 * @param record 当前学习记录
 * @param quality 回答质量 (0-5)
 * @param studyMode 学习模式
 * @returns 更新后的学习记录
 */
export function updateStudyRecord(record: StudyRecord, quality: number, studyMode: StudyMode): StudyRecord {
  const newRecord = { ...record };
  
  // 更新学习模式
  newRecord.studyMode = studyMode;
  
  // 更新正确/错误次数
  if (quality >= 3) {
    newRecord.correctCount += 1;
  } else {
    newRecord.wrongCount += 1;
    // 回答错误时增加生词标记
    newRecord.difficultCount += 1;
  }
  
  // 更新复习次数
  newRecord.reviewCount += 1;
  
  // 更新最后复习时间
  newRecord.lastReviewed = Date.now();
  
  // 根据回答质量调整难度系数
  if (quality >= 3) {
    // 回答正确，增加难度系数
    newRecord.easeFactor = Math.min(
      MAX_EASE_FACTOR,
      newRecord.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
  } else {
    // 回答错误，降低难度系数
    newRecord.easeFactor = Math.max(
      MIN_EASE_FACTOR,
      newRecord.easeFactor - 0.2
    );
  }
  
  // 根据生词标记调整复习频率
  const difficultPenalty = Math.min(newRecord.difficultCount * 0.1, 0.5); // 最多减少50%间隔
  const adjustedEaseFactor = newRecord.easeFactor - difficultPenalty;
  
  // 计算下次复习间隔
  if (quality < 3) {
    // 回答错误，重置间隔
    newRecord.interval = 1;
  } else {
    // 回答正确，根据当前间隔和调整后的难度系数计算新间隔
    if (newRecord.interval === 0) {
      // 第一次学习
      newRecord.interval = 1;
    } else if (newRecord.interval === 1) {
      // 第二次学习
      newRecord.interval = 6;
    } else {
      // 后续学习，使用艾宾浩斯间隔
      const intervalIndex = Math.min(
        EBBINGHAUS_INTERVALS.length - 1,
        newRecord.reviewCount - 1
      );
      newRecord.interval = Math.round(
        EBBINGHAUS_INTERVALS[intervalIndex] * Math.max(adjustedEaseFactor, 0.5)
      );
    }
  }
  
  // 计算下次复习时间
  newRecord.nextReview = newRecord.lastReviewed + (newRecord.interval * 24 * 60 * 60 * 1000);
  
  return newRecord;
}

/**
 * 创建新的学习记录
 * @param wordId 单词ID
 * @param word 单词
 * @returns 新的学习记录
 */
export function createStudyRecord(wordId: string, word: string): StudyRecord {
  const now = Date.now();
  return {
    wordId,
    word,
    correctCount: 0,
    wrongCount: 0,
    lastReviewed: 0,
    nextReview: now, // 立即可以学习
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    reviewCount: 0,
    difficultCount: 0,
    studyMode: StudyMode.WORD_TO_TRANSLATION
  };
}

/**
 * 检查单词是否需要复习
 * @param record 学习记录
 * @returns 是否需要复习
 */
export function needsReview(record: StudyRecord): boolean {
  return Date.now() >= record.nextReview;
}

/**
 * 计算单词的掌握程度 (0-100)
 * @param record 学习记录
 * @returns 掌握程度百分比
 */
export function calculateMasteryLevel(record: StudyRecord): number {
  if (record.reviewCount === 0) return 0;
  
  const totalAttempts = record.correctCount + record.wrongCount;
  const accuracy = record.correctCount / totalAttempts;
  const reviewFrequency = Math.min(record.reviewCount / 10, 1); // 最多10次复习达到满分
  
  return Math.round((accuracy * 0.7 + reviewFrequency * 0.3) * 100);
}

/**
 * 获取学习状态
 * @param record 学习记录
 * @returns 学习状态
 */
export function getStudyStatus(record: StudyRecord): 'new' | 'learning' | 'reviewing' | 'mastered' {
  if (record.reviewCount === 0) return 'new';
  if (record.reviewCount < 3) return 'learning';
  if (record.interval >= 30) return 'mastered';
  return 'reviewing';
}
