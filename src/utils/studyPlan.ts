import { WordBook, StudyPlan, TodayTask } from '../types';
import { studyRecordStorage } from './storage';
import { needsReview } from './ebbinghaus';

/**
 * 学习计划相关工具函数
 */

/**
 * 计算学习计划预期完成日期
 * @param totalWords 总单词数
 * @param dailyNewWords 每日新词量
 * @param startDate 开始日期
 * @returns 预期完成日期时间戳
 */
export function calculateExpectedEndDate(
  totalWords: number,
  dailyNewWords: number,
  startDate: number
): number {
  const daysNeeded = Math.ceil(totalWords / dailyNewWords);
  return startDate + (daysNeeded * 24 * 60 * 60 * 1000);
}

/**
 * 生成今日学习任务
 * @param wordBook 词书
 * @param studyPlan 学习计划
 * @returns 今日学习任务
 */
export function generateTodayTask(wordBook: WordBook, studyPlan: StudyPlan): TodayTask {
  const records = studyRecordStorage.getAll();
  const todayStart = new Date().setHours(0, 0, 0, 0);

  // 获取需要复习的单词
  const dueForReview = records.filter(record => {
    const word = wordBook.words.find(w => w.id === record.wordId);
    return word && needsReview(record);
  });

  // 获取未学习的新词
  const unlearnedWords = wordBook.words.filter(word => {
    const record = records.find(r => r.wordId === word.id);
    return !record || record.reviewCount === 0;
  });

  // 选择今日要学习的新词 - 始终显示计划数量的新词，不管是否已完成
  const todayNewWords = unlearnedWords.slice(0, studyPlan.dailyNewWords);

  // 获取今日要复习的单词 - 需要将 StudyRecord 转换为 Word
  const reviewWordIds = dueForReview.slice(0, 20).map(record => record.wordId); // 限制每日复习数量
  const todayReviewWords = wordBook.words.filter(word => reviewWordIds.includes(word.id));

  // 计算今日已完成的新词和复习数量（基于今日的学习记录）
  const completedNew = todayNewWords.filter(word => {
    const record = records.find(r => r.wordId === word.id);
    return !!record && record.lastReviewed >= todayStart && record.reviewCount > 0;
  }).length;

  const completedReview = todayReviewWords.filter(word => {
    const record = records.find(r => r.wordId === word.id);
    return !!record && record.lastReviewed >= todayStart;
  }).length;

  return {
    newWords: todayNewWords,
    reviewWords: todayReviewWords,
    totalNew: todayNewWords.length,
    totalReview: todayReviewWords.length,
    completedNew,
    completedReview
  };
}

/**
 * 计算学习进度
 * @param wordBook 词书
 * @param studyPlan 学习计划
 * @returns 学习进度百分比
 */
export function calculateProgress(wordBook: WordBook): number {
  const records = studyRecordStorage.getAll();
  const learnedWords = wordBook.words.filter(word => {
    const record = records.find(r => r.wordId === word.id);
    return record && record.reviewCount > 0;
  }).length;

  return Math.round((learnedWords / wordBook.totalWords) * 100);
}

/**
 * 计算剩余学习天数
 * @param studyPlan 学习计划
 * @returns 剩余天数
 */
export function calculateRemainingDays(studyPlan: StudyPlan): number {
  const now = Date.now();
  const remainingTime = studyPlan.expectedEndDate - now;
  return Math.max(0, Math.ceil(remainingTime / (24 * 60 * 60 * 1000)));
}

/**
 * 检查学习计划是否已完成
 * @param wordBook 词书
 * @param studyPlan 学习计划
 * @returns 是否已完成
 */
export function isPlanCompleted(wordBook: WordBook): boolean {
  const records = studyRecordStorage.getAll();
  const masteredWords = wordBook.words.filter(word => {
    const record = records.find(r => r.wordId === word.id);
    return record && record.interval >= 30; // 间隔30天以上认为已掌握
  }).length;

  return masteredWords >= wordBook.totalWords;
}

/**
 * 获取学习统计信息
 * @param wordBook 词书
 * @returns 学习统计
 */
export function getStudyStats(wordBook: WordBook) {
  const records = studyRecordStorage.getAll();
  const wordRecords = records.filter(record =>
    wordBook.words.some(word => word.id === record.wordId)
  );

  const totalWords = wordBook.totalWords;
  // 只统计实际学习过的单词（reviewCount > 0）
  const learnedWords = wordRecords.filter(record => record.reviewCount > 0).length;

  // 分级掌握统计
  const beginnerWords = wordRecords.filter(record => record.reviewCount > 0 && record.interval < 7).length; // 初学：间隔<7天
  const familiarWords = wordRecords.filter(record => record.reviewCount > 0 && record.interval >= 7 && record.interval < 30).length; // 熟悉：7-29天
  const proficientWords = wordRecords.filter(record => record.reviewCount > 0 && record.interval >= 30 && record.interval < 60).length; // 熟练：30-59天
  const masteredWords = wordRecords.filter(record => record.reviewCount > 0 && record.interval >= 60).length; // 完全掌握：60天+

  // 综合掌握率：熟悉及以上的单词占比
  const comprehensiveMastery = familiarWords + proficientWords + masteredWords;

  // 准确率相关统计
  const totalReviews = wordRecords.reduce((sum, record) => sum + record.reviewCount, 0);
  const totalCorrect = wordRecords.reduce((sum, record) => sum + record.correctCount, 0);
  const totalWrong = wordRecords.reduce((sum, record) => sum + record.wrongCount, 0);
  const totalDifficult = wordRecords.reduce((sum, record) => sum + record.difficultCount, 0);
  const accuracy = totalCorrect + totalWrong > 0 ?
    Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0;

  // 按复习次数分类统计
  const reviewOnce = wordRecords.filter(record => record.reviewCount === 1).length;
  const review2to5 = wordRecords.filter(record => record.reviewCount >= 2 && record.reviewCount <= 5).length;
  const review6to10 = wordRecords.filter(record => record.reviewCount >= 6 && record.reviewCount <= 10).length;
  const reviewMore10 = wordRecords.filter(record => record.reviewCount > 10).length;

  return {
    totalWords,
    learnedWords,
    masteredWords,
    beginnerWords,
    familiarWords,
    proficientWords,
    comprehensiveMastery,
    totalReviews,
    totalCorrect,
    totalWrong,
    totalDifficult,
    accuracy,
    reviewOnce,
    review2to5,
    review6to10,
    reviewMore10,
    progress: totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0,
    masteryRate: totalWords > 0 ? Math.round((comprehensiveMastery / totalWords) * 100) : 0
  };
}
