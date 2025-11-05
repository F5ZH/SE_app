// src/pages/AuthPage.tsx (这才是正确的内容)

import React, { useState } from 'react';
import axios from 'axios';

// 定义一个 props 类型，这样 App.tsx 才能把 "登录成功" 的函数传给我们
interface AuthPageProps {
    onLogin: (token: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
    // 'login' 或 'register'
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(''); // 用于显示成功或错误信息

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // 阻止表单默认提交（刷新页面）
        setMessage(''); // 清空旧消息

        // 我们的后端 API 地址
        const baseURL = 'http://localhost:8080/api/auth';

        if (mode === 'register') {
            // --- 注册逻辑 ---
            try {
                const response = await axios.post(`${baseURL}/register`, { email, password });
                setMessage(response.data.message); // 显示 "用户注册成功！"
                setMode('login'); // 注册成功后自动切换到登录
            } catch (error: any) {
                // 显示后端传来的错误
                setMessage(error.response?.data?.message || '注册失败');
            }
        } else {
            // --- 登录逻辑 ---
            try {
                const response = await axios.post(`${baseURL}/login`, { email, password });
                const token = response.data.token; // 获取后端返回的 token
                setMessage('登录成功！');
                onLogin(token); // 调用 App.tsx 传来的 onLogin 函数，把 token 交给 App
            } catch (error: any) {
                setMessage(error.response?.data?.message || '登录失败');
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>{mode === 'login' ? '登录' : '注册'}</h2>
                <div className="auth-toggle">
                    <button
                        className={mode === 'login' ? 'active' : ''}
                        onClick={() => setMode('login')}
                    >
                        登录
                    </button>
                    <button
                        className={mode === 'register' ? 'active' : ''}
                        onClick={() => setMode('register')}
                    >
                        注册
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                            required
                            minLength={6}
                        />
                    </div>

                    {message && <p className="auth-message">{message}</p>}

                    <button type="submit" className="btn btn-primary">
                        {mode === 'login' ? '登录' : '注册'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AuthPage;