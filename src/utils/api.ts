// src/utils/api.ts

/**
 * 前端离线模式 API（mock）
 *
 * 说明：应用户要求移除后端依赖并禁用登录，所有与后端相关的调用
 * 将被替换为本地 mock 实现，返回本地预设数据或空实现以避免网络请求。
 */
import { presetWordBooks } from '../data/presetWordBooks';

// 模拟异步延迟
const delay = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchAllData = async () => {
    await delay(30);
    return {
        data: {
            wordBooks: presetWordBooks,
            studyPlans: [],
            studyRecords: [],
            checkIn: [],
            wordMateState: null,
            interactions: [],
            achievements: [],
            milestones: []
        }
    };
};

export const syncAllData = async (_data: any) => {
    await delay(10);
    return { ok: true };
};

export const addWordBook = async (wordBook: any) => {
    await delay(10);
    // 不做持久化，仅返回成功
    return { data: wordBook };
};

export const deleteWordBook = async (_id: string) => {
    await delay(10);
    return { ok: true };
};

// 登录/注册 mock（总是成功）
export const login = async (_username: string, _password: string) => {
    await delay(20);
    return { data: { token: 'local_dev_token' } };
};

export const register = async (_payload: any) => {
    await delay(20);
    return { data: { token: 'local_dev_token' } };
};

// 默认导出一个 minimal stub 以防其他模块 import default
const api = {
    fetchAllData,
    syncAllData,
    addWordBook,
    deleteWordBook,
    login,
    register
};

export default api;