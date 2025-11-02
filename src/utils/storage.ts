/**
 * 本地存储工具函数
 * 使用localStorage进行数据持久化
 */

import { WordBook, StudyRecord, StudyPlan } from '../types';
import { authService } from './auth';

// 存储键名常量
const STORAGE_KEYS = {
  WORD_BOOKS: 'vocabulary_app_word_books',
  STUDY_RECORDS: 'vocabulary_app_study_records',
  STUDY_PLANS: 'vocabulary_app_study_plans',
  CURRENT_PLAN: 'vocabulary_app_current_plan',
  USER_SETTINGS: 'vocabulary_app_user_settings',
  CHECK_IN: 'vocabulary_app_check_in'
} as const;

/**
 * 获取当前登录用户的存储键
 * @param key 基础键名
 * @returns 带用户名前缀的键名，如果未登录则返回 null
 */
function getUserKey(key: string): string | null {
  const username = authService.getCurrentUser();
  if (!username) {
    // 如果没有用户登录，则不进行任何存储操作
    return null;
  }
  return `${username}_${key}`;
}

/**
 * 获取存储的数据
 * @param key 存储键
 * @param defaultValue 默认值
 * @returns 存储的数据或默认值
 */
function getStorageData<T>(key: string, defaultValue: T): T {
  const userKey = getUserKey(key); // <-- 这里使用了 authService
  if (!userKey) return defaultValue;

  try {
    const data = localStorage.getItem(userKey);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${userKey}":`, error);
    return defaultValue;
  }
}

/**
 * 设置存储的数据
 * @param key 存储键
 * @param data 要存储的数据
 */
function setStorageData<T>(key: string, data: T): void {
  const userKey = getUserKey(key); // <-- 这里使用了 authService
  if (!userKey) return;

  try {
    localStorage.setItem(userKey, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage key "${userKey}":`, error);
  }
}

// 词书管理
export const wordBookStorage = {
  /**
   * 获取所有词书
   */
  getAll(): WordBook[] {
    return getStorageData(STORAGE_KEYS.WORD_BOOKS, []);
  },

  /**
   * 保存词书
   */
  save(wordBook: WordBook): void {
    const books = this.getAll();
    const index = books.findIndex(book => book.id === wordBook.id);

    if (index >= 0) {
      books[index] = wordBook;
    } else {
      books.push(wordBook);
    }

    setStorageData(STORAGE_KEYS.WORD_BOOKS, books);
  },

  /**
   * 根据ID获取词书
   */
  getById(id: string): WordBook | null {
    const books = this.getAll();
    return books.find(book => book.id === id) || null;
  },

  /**
   * 删除词书
   */
  delete(id: string): void {
    const books = this.getAll();
    const filteredBooks = books.filter(book => book.id !== id);
    setStorageData(STORAGE_KEYS.WORD_BOOKS, filteredBooks);
  },

  /**
   * 批量保存词书
   */
  saveAll(books: WordBook[]): void {
    setStorageData(STORAGE_KEYS.WORD_BOOKS, books);
  }
};

// 学习记录管理
export const studyRecordStorage = {
  /**
   * 获取所有学习记录
   */
  getAll(): StudyRecord[] {
    return getStorageData(STORAGE_KEYS.STUDY_RECORDS, []);
  },

  /**
   * 保存学习记录
   */
  save(record: StudyRecord): void {
    const records = this.getAll();
    const index = records.findIndex(r => r.wordId === record.wordId);

    if (index >= 0) {
      records[index] = record;
    } else {
      records.push(record);
    }

    setStorageData(STORAGE_KEYS.STUDY_RECORDS, records);
  },

  /**
   * 根据单词ID获取学习记录
   */
  getByWordId(wordId: string): StudyRecord | null {
    const records = this.getAll();
    return records.find(record => record.wordId === wordId) || null;
  },

  /**
   * 获取需要复习的单词记录
   */
  getDueForReview(): StudyRecord[] {
    const records = this.getAll();
    const now = Date.now();
    return records.filter(record => record.nextReview <= now);
  },

  /**
   * 根据单词 ID 删除对应的学习记录（用于重置某个词书的进度）
   */
  deleteByWordIds(wordIds: string[]): void {
    const records = this.getAll();
    const filtered = records.filter(record => !wordIds.includes(record.wordId));
    setStorageData(STORAGE_KEYS.STUDY_RECORDS, filtered);
  },

  /**
   * 批量保存学习记录
   */
  saveAll(records: StudyRecord[]): void {
    setStorageData(STORAGE_KEYS.STUDY_RECORDS, records);
  },

  /**
   * 清除所有学习记录
   */
  clearAll(): void {
    setStorageData(STORAGE_KEYS.STUDY_RECORDS, []);
  }
};

// 学习计划管理
export const studyPlanStorage = {
  /**
   * 获取所有学习计划
   */
  getAll(): StudyPlan[] {
    return getStorageData(STORAGE_KEYS.STUDY_PLANS, []);
  },

  /**
   * 保存学习计划
   */
  save(plan: StudyPlan): void {
    const plans = this.getAll();
    const index = plans.findIndex(p => p.id === plan.id);

    if (index >= 0) {
      plans[index] = plan;
    } else {
      plans.push(plan);
    }

    setStorageData(STORAGE_KEYS.STUDY_PLANS, plans);
  },

  /**
   * 获取当前激活的学习计划
   */
  getCurrent(): StudyPlan | null {
    const plans = this.getAll();
    return plans.find(plan => plan.isActive) || null;
  },

  /**
   * 设置当前学习计划
   */
  setCurrent(planId: string): void {
    const plans = this.getAll();
    plans.forEach(plan => {
      plan.isActive = plan.id === planId;
    });
    setStorageData(STORAGE_KEYS.STUDY_PLANS, plans);
  },

  /**
   * 删除学习计划
   */
  delete(id: string): void {
    const plans = this.getAll();
    const filteredPlans = plans.filter(plan => plan.id !== id);
    setStorageData(STORAGE_KEYS.STUDY_PLANS, filteredPlans);
  }
};

// 用户设置管理
export const settingsStorage = {
  /**
   * 获取用户设置
   */
  get(): Record<string, any> {
    return getStorageData(STORAGE_KEYS.USER_SETTINGS, {});
  },

  /**
   * 保存用户设置
   */
  save(settings: Record<string, any>): void {
    setStorageData(STORAGE_KEYS.USER_SETTINGS, settings);
  },

  /**
   * 更新特定设置
   */
  update(key: string, value: any): void {
    const settings = this.get();
    settings[key] = value;
    this.save(settings);
  }
};

// 打卡签到管理
export interface CheckInRecord {
  date: string; // YYYY-MM-DD格式的日期
  timestamp: number; // 打卡时间戳
  planId?: string; // 关联的学习计划ID
}

export const checkInStorage = {
  /**
   * 获取所有打卡记录
   */
  getAll(): CheckInRecord[] {
    return getStorageData(STORAGE_KEYS.CHECK_IN, []);
  },

  /**
   * 记录今日打卡
   */
  checkIn(planId?: string): boolean {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const records = this.getAll();

    // 检查今日是否已打卡
    const todayCheckIn = records.find(r => r.date === today);
    if (todayCheckIn) {
      return false; // 今日已打卡
    }

    // 记录打卡
    const newRecord: CheckInRecord = {
      date: today,
      timestamp: Date.now(),
      planId
    };

    records.push(newRecord);
    setStorageData(STORAGE_KEYS.CHECK_IN, records);
    return true;
  },

  /**
   * 检查今日是否已打卡
   */
  hasCheckedInToday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    const records = this.getAll();
    return records.some(r => r.date === today);
  },

  /**
   * 获取今日打卡记录
   */
  getTodayCheckIn(): CheckInRecord | null {
    const today = new Date().toISOString().split('T')[0];
    const records = this.getAll();
    return records.find(r => r.date === today) || null;
  },

  /**
   * 清空打卡记录（用于词书变更或计划重置时）
   */
  clear(): void {
    setStorageData(STORAGE_KEYS.CHECK_IN, []);
  }
};
