// src/utils/api.ts

import axios from 'axios';

// 1. 创建一个 axios 实例，并设置基础 URL
const api = axios.create({
    baseURL: 'http://localhost:8080/api',
});

/**
 * 2. 关键：设置一个“请求拦截器”
 * * 这段代码会在 *每次* api 发送请求之前运行。
 * 它会从 localStorage 读取 'token'，
 * 然后把它附加到请求的 Header 中 (使用我们之前定义的 'x-auth-token')。
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- 3. 定义我们的 API 函数 ---

/**
 * 获取当前登录用户的所有数据
 */
export const fetchAllData = () => api.get('/data/all');

/**
 * 同步所有数据到服务器
 */
export const syncAllData = (data: any) => api.post('/data/sync', data);

/**
 * 添加词书
 */
export const addWordBook = (wordBook: any) => api.post('/data/wordbook', wordBook);

/**
 * 删除词书
 */
export const deleteWordBook = (id: string) => api.delete(`/data/wordbook/${id}`);

export default api;