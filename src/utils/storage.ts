// src/utils/storage.ts (V2 - 已连接到 dataService)

import { WordBook, StudyRecord, StudyPlan } from '../types';
// 1. 引入我们新的 "大脑"
import * as dataService from './dataService';

// 2. 把 CheckInRecord 接口的定义移到这里，因为它被多处使用
export interface CheckInRecord {
  date: string; // YYYY-MM-DD格式的日期
  timestamp: number; // 打卡时间戳
  planId?: string; // 关联的学习计划ID
}

// --- 词书管理 (现在只和 dataService 对话) ---
export const wordBookStorage = {
  getAll(): WordBook[] {
    return dataService.getWordBooks();
  },
  save(wordBook: WordBook): void {
    const books = dataService.getWordBooks();
    const index = books.findIndex(book => book.id === wordBook.id);
    if (index >= 0) {
      books[index] = wordBook;
    } else {
      books.push(wordBook);
    }
    dataService.saveWordBooks([...books]); // 保存一个新数组的副本
  },
  getById(id: string): WordBook | null {
    return dataService.getWordBooks().find(book => book.id === id) || null;
  },
  delete(id: string): void {
    const books = dataService.getWordBooks().filter(book => book.id !== id);
    dataService.saveWordBooks(books);
  },
  saveAll(books: WordBook[]): void {
    dataService.saveWordBooks(books);
  }
};

// --- 学习记录管理 (现在只和 dataService 对话) ---
export const studyRecordStorage = {
  getAll(): StudyRecord[] {
    return dataService.getStudyRecords();
  },
  save(record: StudyRecord): void {
    const records = dataService.getStudyRecords();
    const index = records.findIndex(r => r.wordId === record.wordId);
    if (index >= 0) {
      records[index] = record;
    } else {
      records.push(record);
    }
    dataService.saveStudyRecords([...records]);
  },
  getByWordId(wordId: string): StudyRecord | null {
    return dataService.getStudyRecords().find(record => record.wordId === wordId) || null;
  },
  deleteByWordIds(wordIds: string[]): void {
    const records = dataService.getStudyRecords().filter(record => !wordIds.includes(record.wordId));
    dataService.saveStudyRecords(records);
  },
  saveAll(records: StudyRecord[]): void {
    dataService.saveStudyRecords(records);
  },
  clearAll(): void {
    dataService.saveStudyRecords([]);
  }
};

// --- 学习计划管理 (现在只和 dataService 对话) ---
export const studyPlanStorage = {
  getAll(): StudyPlan[] {
    return dataService.getStudyPlans();
  },
  save(plan: StudyPlan): void {
    const plans = dataService.getStudyPlans();
    const index = plans.findIndex(p => p.id === plan.id);
    if (index >= 0) {
      plans[index] = plan;
    } else {
      plans.push(plan);
    }
    dataService.saveStudyPlans([...plans]);
  },
  getCurrent(): StudyPlan | null {
    return dataService.getStudyPlans().find(plan => plan.isActive) || null;
  },
  setCurrent(planId: string): void {
    const plans = dataService.getStudyPlans().map(plan => ({
      ...plan,
      isActive: plan.id === planId
    }));
    dataService.saveStudyPlans(plans);
  },
  delete(id: string): void {
    const plans = dataService.getStudyPlans().filter(plan => plan.id !== id);
    dataService.saveStudyPlans(plans);
  }
};

// --- 打卡签到管理 (现在只和 dataService 对话) ---
export const checkInStorage = {
  getAll(): CheckInRecord[] {
    return dataService.getCheckIns();
  },
  checkIn(planId?: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    const records = dataService.getCheckIns();
    if (records.some(r => r.date === today)) {
      return false;
    }
    const newRecord: CheckInRecord = { date: today, timestamp: Date.now(), planId };
    records.push(newRecord);
    dataService.saveCheckIns([...records]);
    return true;
  },
  hasCheckedInToday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return dataService.getCheckIns().some(r => r.date === today);
  },
  clear(): void {
    dataService.saveCheckIns([]);
  }
};

// --- 用户设置 (这个不动，设置是绑在浏览器上的，不是用户账户上的) ---
const STORAGE_KEYS = {
  USER_SETTINGS: 'vocabulary_app_user_settings'
};
export const settingsStorage = {
  get(): Record<string, any> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  },
  save(settings: Record<string, any>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error writing settings to localStorage:', error);
    }
  },
  update(key: string, value: any): void {
    const settings = this.get();
    settings[key] = value;
    this.save(settings);
  }
};