/**
 * 本地存储工具函数
 * 使用localStorage进行数据持久化
 */

import { WordBook, StudyRecord, StudyPlan } from '../types';

// 存储键名常量
const STORAGE_KEYS = {
  WORD_BOOKS: 'vocabulary_app_word_books',
  STUDY_RECORDS: 'vocabulary_app_study_records',
  STUDY_PLANS: 'vocabulary_app_study_plans',
  CURRENT_PLAN: 'vocabulary_app_current_plan',
  USER_SETTINGS: 'vocabulary_app_user_settings'
} as const;

/**
 * 获取存储的数据
 * @param key 存储键
 * @param defaultValue 默认值
 * @returns 存储的数据或默认值
 */
function getStorageData<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * 设置存储的数据
 * @param key 存储键
 * @param data 要存储的数据
 */
function setStorageData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
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
   * 批量保存学习记录
   */
  saveAll(records: StudyRecord[]): void {
    setStorageData(STORAGE_KEYS.STUDY_RECORDS, records);
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
