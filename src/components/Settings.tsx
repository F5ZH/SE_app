import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * 设置对话框组件
 * 用于配置 DeepSeek API Key 等应用设置
 */
const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        if (isOpen) {
            // 加载当前保存的 API Key
            const savedKey = localStorage.getItem('deepseek_api_key') || '';
            setApiKey(savedKey);
        }
    }, [isOpen]);

    const handleSave = () => {
        // 保存 API Key 到 localStorage
        if (apiKey.trim()) {
            localStorage.setItem('deepseek_api_key', apiKey.trim());
            alert('✅ API Key 保存成功！');
        } else {
            localStorage.removeItem('deepseek_api_key');
            alert('⚠️ API Key 已清除');
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>⚙️ 应用设置</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            DeepSeek API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="请输入您的 DeepSeek API Key"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                        <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                            💡 API Key 用于 AI 聊天、故事生成等功能。
                            <br />
                            🔗 获取地址：<a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5' }}>https://platform.deepseek.com/api_keys</a>
                        </p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">
                        取消
                    </button>
                    <button onClick={handleSave} className="btn-primary">
                        保存设置
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
