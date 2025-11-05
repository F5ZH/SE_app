import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, X } from 'lucide-react';
import { ChatMessage, UserContext, sendChatMessage, generateMessageId, loadChatHistory, saveChatHistory, clearChatHistory } from '../utils/chat';
import { getMateState } from '../utils/wordMate';
import { getStageByLevel } from '../data/wardrobeSystem';
import './ChatBox.css';

interface ChatBoxProps {
    onClose: () => void;
    userContext: UserContext;
}

/**
 * AI 聊天框组件
 * 与单词姬自由对话
 */
const ChatBox: React.FC<ChatBoxProps> = ({ onClose, userContext }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 获取当前单词姬状态
    const mateState = getMateState();

    // 获取当前显示的立绘路径
    const getAvatarUrl = (): string => {
        const currentOutfit = mateState.appearance.outfit;

        // 如果选择了特殊皮肤
        if (currentOutfit && currentOutfit !== 'default') {
            return `/img/${currentOutfit}.png`;
        }

        // 默认使用基础立绘（根据等级阶段）
        const stage = getStageByLevel(mateState.level);
        return `/img/${stage}.png`;
    };

    const mateAvatarUrl = getAvatarUrl();

    useEffect(() => {
        // 加载 API Key
        const key = localStorage.getItem('deepseek_api_key') || '';
        setApiKey(key);

        // 加载聊天历史
        const history = loadChatHistory();
        if (history.length > 0) {
            setMessages(history);
        } else {
            // 根据用户数据生成个性化问候
            let greeting = `嗨！我是${userContext.mateName}~ `;

            if (userContext.todayNewWords !== undefined && userContext.todayNewWords > 0) {
                greeting += `今天还有${userContext.todayNewWords}个新单词要学呢！`;
            } else if (userContext.todayReviewWords !== undefined && userContext.todayReviewWords > 0) {
                greeting += `今天还有${userContext.todayReviewWords}个单词需要复习哦！`;
            } else if (userContext.totalMastered !== undefined && userContext.totalMastered > 0) {
                greeting += `你已经掌握了${userContext.totalMastered}个单词啦，好棒！`;
            } else {
                greeting += `有什么想和我聊的吗？学习上的问题、单词记忆技巧，或者随便聊聊天都可以哦！`;
            }

            // 初始问候
            setMessages([{
                id: generateMessageId(),
                role: 'assistant',
                content: greeting,
                timestamp: Date.now()
            }]);
        }
    }, [userContext]);

    useEffect(() => {
        // 滚动到最新消息
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        // 保存聊天历史
        if (messages.length > 0) {
            saveChatHistory(messages);
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || isSending) return;

        if (!apiKey) {
            alert('请先在设置中配置 DeepSeek API Key');
            return;
        }

        const userMessage: ChatMessage = {
            id: generateMessageId(),
            role: 'user',
            content: inputText.trim(),
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsSending(true);

        try {
            // 只发送最近 10 条消息作为上下文
            const contextMessages = [...messages, userMessage].slice(-10);
            const response = await sendChatMessage(contextMessages, apiKey, userContext);

            const assistantMessage: ChatMessage = {
                id: generateMessageId(),
                role: 'assistant',
                content: response,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Failed to send message:', error);
            const errorMessage: ChatMessage = {
                id: generateMessageId(),
                role: 'assistant',
                content: '啊呀，我好像走神了...能再说一遍吗？',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleClearHistory = () => {
        if (window.confirm('确定要清空聊天记录吗？')) {
            clearChatHistory();
            setMessages([{
                id: generateMessageId(),
                role: 'assistant',
                content: `聊天记录已清空~ 让我们重新开始吧！我是${userContext.mateName}，随时准备陪你学习！`,
                timestamp: Date.now()
            }]);
        }
    };

    return (
        <div className="chatbox-overlay" onClick={onClose}>
            <div className="chatbox-container" onClick={(e) => e.stopPropagation()}>
                {/* 头部 */}
                <div className="chatbox-header">
                    <div className="header-info">
                        <div className="mate-avatar-mini">
                            <img src={mateAvatarUrl} alt={userContext.mateName} />
                        </div>
                        <div>
                            <h3>{userContext.mateName}</h3>
                            <span className="status-text">在线</span>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="icon-btn" onClick={handleClearHistory} title="清空记录">
                            <Trash2 size={18} />
                        </button>
                        <button className="icon-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* 消息列表 */}
                <div className="messages-container">
                    {messages.map(message => (
                        <div key={message.id} className={`message ${message.role}`}>
                            {message.role === 'assistant' && (
                                <div className="message-avatar">
                                    <img src={mateAvatarUrl} alt={userContext.mateName} />
                                </div>
                            )}
                            <div className="message-bubble">
                                <p className="message-text">{message.content}</p>
                                <span className="message-time">
                                    {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            {message.role === 'user' && (
                                <span className="message-avatar">😊</span>
                            )}
                        </div>
                    ))}
                    {isSending && (
                        <div className="message assistant">
                            <div className="message-avatar">
                                <img src={mateAvatarUrl} alt={userContext.mateName} />
                            </div>
                            <div className="message-bubble typing">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* 输入区域 */}
                <div className="input-container">
                    <textarea
                        className="chat-input"
                        placeholder="和单词姬说点什么..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        rows={4}
                        disabled={isSending}
                        style={{ minHeight: '80px', height: '80px' }}
                    />
                    <button
                        className="send-btn"
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() || isSending}
                    >
                        <Send size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBox;
