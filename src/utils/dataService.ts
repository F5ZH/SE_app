// src/utils/dataService.ts

import { fetchAllData, syncAllData } from './api';
import { presetWordBooks } from '../data/presetWordBooks';
import { createDefaultMate, DEFAULT_ACHIEVEMENTS } from './wordMate'; // 引入默认数据
import { WordBook, StudyPlan, StudyRecord, WordMateState, Achievement } from '../types';
import { CheckInRecord } from './storage'; // 引入 CheckInRecord

// 这个对象将作为我们应用所有数据的 "内存缓存"
let appData: {
    wordBooks: WordBook[];
    studyPlans: StudyPlan[];
    studyRecords: StudyRecord[];
    checkIn: CheckInRecord[];
    wordMateState: WordMateState | null;
    interactions: any[]; // 你可以稍后在 types/index.ts 中定义 InteractionRecord
    achievements: Achievement[];
    milestones: number[];
} = {
    wordBooks: [],
    studyPlans: [],
    studyRecords: [],
    checkIn: [],
    wordMateState: null,
    interactions: [],
    achievements: [],
    milestones: []
};

// --- 数据同步：防抖(Debounce) ---
// 我们不希望每次修改都调用 API，而是等待 2 秒，
// 如果 2 秒内没有新的修改，再一次性保存所有数据。

let saveTimer: number | null = null;

const debouncedSave = () => {
    if (saveTimer) {
        clearTimeout(saveTimer); // 如果 2 秒内又有修改，重置计时器
    }

    saveTimer = window.setTimeout(() => {
        // 2 秒到了，执行保存
        syncAllData(appData)
            .then(() => {
                console.log('✅ 数据已成功同步到后端');
            })
            .catch((err: any) => {
                console.error('❌ 数据同步失败:', err);
            });
        saveTimer = null;
    }, 2000); // 延迟 2 秒
};

// --- 1. 初始化 ---
/**
 * 在 App.tsx 中调用的总初始化函数
 */
export const initializeDataService = async () => {
    try {
        const response = await fetchAllData();
        const data = response.data;

        // 检查这是一个新用户 (数据库是空的) 还是老用户
        if (!data.wordMateState && data.wordBooks.length === 0) {
            console.log('新用户登录，正在初始化默认数据...');
            // 这是新用户，为他们填充默认数据
            appData = {
                wordBooks: presetWordBooks, // 预设词书
                studyPlans: [],
                studyRecords: [],
                checkIn: [],
                wordMateState: createDefaultMate(), // 默认单词姬
                interactions: [],
                achievements: DEFAULT_ACHIEVEMENTS, // 默认成就
                milestones: []
            };
            // 立即将这些默认数据存回数据库
            debouncedSave();
        } else {
            // 这是老用户，加载他们的数据
            console.log('老用户登录，从后端加载数据...');
            appData = data;
        }
        return true;
    } catch (error: any) {
        console.error('❌ 加载用户数据失败:', error);
        // 如果加载失败 (例如 token 过期)，我们返回 false
        return false;
    }
};

// --- 2. Getters (同步从内存缓存读取) ---
export const getWordBooks = () => appData.wordBooks;
export const getStudyPlans = () => appData.studyPlans;
export const getStudyRecords = () => appData.studyRecords;
export const getCheckIns = () => appData.checkIn;
export const getMateState = () => appData.wordMateState;
export const getInteractions = () => appData.interactions;
export const getAchievementsData = () => appData.achievements;
export const getMilestones = () => appData.milestones;

// --- 3. Setters (同步修改内存缓存, 并触发 "防抖保存") ---
export const saveWordBooks = (books: WordBook[]) => {
    appData.wordBooks = books;
    debouncedSave();
};
export const saveStudyPlans = (plans: StudyPlan[]) => {
    appData.studyPlans = plans;
    debouncedSave();
};
export const saveStudyRecords = (records: StudyRecord[]) => {
    appData.studyRecords = records;
    debouncedSave();
};
export const saveCheckIns = (checkIns: CheckInRecord[]) => {
    appData.checkIn = checkIns;
    debouncedSave();
};
export const saveMateState = (state: WordMateState | null) => {
    appData.wordMateState = state;
    debouncedSave();
};
export const saveInteractions = (interactions: any[]) => {
    appData.interactions = interactions;
    debouncedSave();
};
export const saveAchievementsData = (achievements: Achievement[]) => {
    appData.achievements = achievements;
    debouncedSave();
};
export const saveMilestones = (milestones: number[]) => {
    appData.milestones = milestones;
    debouncedSave();
};

// (用于登出的函数)
export const clearLocalData = () => {
    appData = {
        wordBooks: [], studyPlans: [], studyRecords: [], checkIn: [],
        wordMateState: null, interactions: [], achievements: [], milestones: []
    };
};