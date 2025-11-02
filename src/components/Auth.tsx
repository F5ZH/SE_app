import React, { useState } from 'react';
import { authService } from '../utils/auth';
import { BookOpen, User, Lock } from 'lucide-react';

interface AuthProps {
    onLoginSuccess: (username: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInfo('');

        if (username.trim().length < 3) {
            setError('用户名至少需要3个字符');
            return;
        }
        if (password.trim().length < 4) {
            setError('密码至少需要4个字符');
            return;
        }

        if (isLoginView) {
            // 处理登录
            const result = authService.login(username, password);
            if (result.success) {
                onLoginSuccess(username);
            } else {
                setError(result.message);
            }
        } else {
            // 处理注册
            const result = authService.register(username, password);
            if (result.success) {
                setInfo('注册成功，将自动登录...');
                // 注册成功后自动登录
                setTimeout(() => {
                    onLoginSuccess(username);
                }, 1000);
            } else {
                setError(result.message);
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <div className="auth-header">
                    <BookOpen size={48} className="auth-logo" />
                    <h1>词汇记忆</h1>
                    <p>请{isLoginView ? '登录' : '注册'}以同步您的学习进度</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <p className="auth-error">{error}</p>}
                    {info && <p className="auth-info">{info}</p>}

                    <div className="input-group">
                        <User size={18} />
                        <input
                            type="text"
                            placeholder="用户名"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <Lock size={18} />
                        <input
                            type="password"
                            placeholder="密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary auth-button">
                        {isLoginView ? '登录' : '注册'}
                    </button>
                </form>

                <div className="auth-toggle">
                    <p>
                        {isLoginView ? '还没有账户？' : '已有账户？'}
                        <button onClick={() => { setIsLoginView(!isLoginView); setError(''); setInfo(''); }}>
                            {isLoginView ? '立即注册' : '立即登录'}
                        </button>
                    </p>
                </div>

            </div>
        </div>
    );
};

export default Auth;