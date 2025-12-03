// src/utils/dataSync.ts
// 数据同步服务 - 在 localStorage 和云端数据库之间同步数据

import { fetchAllData, syncAllData } from './api';
import { wordBookStorage, studyRecordStorage, studyPlanStorage } from './storage';

/**
 * 从云端加载数据到本地
 */
export const loadDataFromCloud = async (): Promise<boolean> => {
    try {
        console.log('📥 从云端加载数据...');

        // 添加超时控制，避免长时间等待
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('请求超时')), 10000)
        );

        const response = await Promise.race([
            fetchAllData(),
            timeoutPromise
        ]) as any;

        const cloudData = response.data;

        // 同步词书
        if (cloudData.wordBooks && cloudData.wordBooks.length > 0) {
            wordBookStorage.saveAll(cloudData.wordBooks);
            console.log(`✅ 已同步 ${cloudData.wordBooks.length} 本词书`);
        }

        // 同步学习计划
        if (cloudData.studyPlans && cloudData.studyPlans.length > 0) {
            studyPlanStorage.saveAll(cloudData.studyPlans);
            console.log(`✅ 已同步 ${cloudData.studyPlans.length} 个学习计划`);
        }

        // 同步学习记录
        if (cloudData.studyRecords && cloudData.studyRecords.length > 0) {
            studyRecordStorage.saveAll(cloudData.studyRecords);
            console.log(`✅ 已同步 ${cloudData.studyRecords.length} 条学习记录`);
        }

        // 同步 WordMate 状态
        if (cloudData.wordMateState) {
            // wordMateState 是一个包含多个 localStorage key 的对象
            // 需要分别恢复每个 key
            Object.keys(cloudData.wordMateState).forEach(key => {
                localStorage.setItem(key, JSON.stringify(cloudData.wordMateState[key]));
            });
            console.log('✅ 已同步 WordMate 状态');
        }

        // 同步签到数据
        if (cloudData.checkInData) {
            Object.keys(cloudData.checkInData).forEach(key => {
                localStorage.setItem(key, JSON.stringify(cloudData.checkInData[key]));
            });
            console.log('✅ 已同步签到数据');
        }

        // 同步用户设置
        if (cloudData.userSettings) {
            localStorage.setItem('vocabulary_app_user_settings', JSON.stringify(cloudData.userSettings));
            console.log('✅ 已同步用户设置');
        }

        console.log('✅ 数据加载完成！');
        return true;
    } catch (error) {
        console.error('❌ 从云端加载数据失败:', error);
        return false;
    }
};

/**
 * 将本地数据同步到云端
 */
export const saveDataToCloud = async (): Promise<boolean> => {
    try {
        console.log('📤 同步数据到云端...');

        // 收集所有本地数据
        const localData = {
            wordBooks: wordBookStorage.getAll(),
            studyPlans: studyPlanStorage.getAll(),
            studyRecords: studyRecordStorage.getAll(),
            wordMateState: getWordMateState(),
            checkInData: getCheckInData(),
            userSettings: getUserSettings()
        };

        // 添加超时控制
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('上传超时')), 10000)
        );

        // 上传到云端
        await Promise.race([
            syncAllData(localData),
            timeoutPromise
        ]);

        console.log('✅ 数据同步成功！');
        return true;
    } catch (error) {
        console.error('❌ 同步数据到云端失败:', error);
        return false;
    }
};

/**
 * 获取 WordMate 状态
 */
function getWordMateState() {
    const keys = ['wordmate_state', 'wordmate_interactions', 'wordmate_achievements', 'wordmate_milestones', 'wardrobe_state'];
    const state: any = {};

    keys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                state[key] = JSON.parse(data);
            } catch (e) {
                state[key] = data;
            }
        }
    });

    return Object.keys(state).length > 0 ? state : null;
}

/**
 * 获取签到数据
 */
function getCheckInData() {
    const checkInKey = 'vocabulary_app_check_in';
    const data = localStorage.getItem(checkInKey);
    return data ? { [checkInKey]: JSON.parse(data) } : {};
}

/**
 * 获取用户设置
 */
function getUserSettings() {
    const settingsKey = 'vocabulary_app_user_settings';
    const data = localStorage.getItem(settingsKey);
    return data ? JSON.parse(data) : {};
}

/**
 * 自动同步 - 定期将数据同步到云端
 */
export const startAutoSync = (intervalMinutes: number = 5) => {
    // 立即执行一次同步（不阻塞，不抛出错误）
    saveDataToCloud().catch(err => {
        console.error('⚠️ 初始同步失败:', err);
    });

    // 设置定时同步
    const intervalMs = intervalMinutes * 60 * 1000;
    return setInterval(() => {
        saveDataToCloud().catch(err => {
            console.error('⚠️ 定时同步失败:', err);
        });
    }, intervalMs);
};

/**
 * 停止自动同步
 */
export const stopAutoSync = (intervalId: NodeJS.Timeout) => {
    clearInterval(intervalId);
};
