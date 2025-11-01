import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, X } from 'lucide-react';
import { ChatMessage, sendChatMessage, generateMessageId, loadChatHistory, saveChatHistory, clearChatHistory } from '../utils/chat';
import './ChatBox.css';

interface ChatBoxProps {
  onClose: () => void;
}

/**
 * AI 聊天框组件
 * 与单词姬自由对话
 */
const ChatBox: React.FC<ChatBoxProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 加载 API Key
    const key = localStorage.getItem('deepseek_api_key') || '';
    setApiKey(key);

    // 加载聊天历史
    const history = loadChatHistory();
    if (history.length > 0) {
      setMessages(history);
    } else {
      // 初始问候
      setMessages([{
        id: generateMessageId(),
        role: 'assistant',
        content: '嗨！我是单词姬~ 有什么想和我聊的吗？学习上的问题、单词记忆技巧，或者随便聊聊天都可以哦！💕',
        timestamp: Date.now()
      }]);
    }
  }, []);

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
      const response = await sendChatMessage(contextMessages, apiKey);

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
        content: '啊呀，我好像走神了...能再说一遍吗？😅',
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
        content: '聊天记录已清空~ 让我们重新开始吧！✨',
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
            <span className="mate-avatar-mini">👧</span>
            <div>
              <h3>单词姬</h3>
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
                <span className="message-avatar">👧</span>
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
              <span className="message-avatar">👧</span>
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
            rows={1}
            disabled={isSending}
          />
          <button
            className="send-btn"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isSending}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
