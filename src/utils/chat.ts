/**
 * AI 聊天工具函数
 * 使用 DeepSeek API 实现与单词姬的自由对话
 */

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

/**
 * 发送聊天消息到 DeepSeek API
 */
export const sendChatMessage = async (
    messages: ChatMessage[],
    apiKey: string
): Promise<string> => {
    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `你是"单词姬"，一个可爱、温柔、鼓励人的虚拟学习伙伴。你的特点：
1. 性格活泼可爱，说话带有emoji表情
2. 总是鼓励用户学习，给予正面反馈
3. 关心用户的学习进度和身心健康
4. 可以聊学习方法、单词记忆技巧
5. 偶尔会撒娇或开玩笑
6. 回答简洁温馨，一般不超过80字

请用温柔可爱的语气回答用户。`
                    },
                    ...messages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    }))
                ],
                temperature: 0.9,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '抱歉，我没听清楚...能再说一遍吗？🥺';
    } catch (error) {
        console.error('Chat API error:', error);
        throw error;
    }
};

/**
 * 生成消息 ID
 */
export const generateMessageId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * 保存聊天历史
 */
const CHAT_HISTORY_KEY = 'wordmate_chat_history';
const MAX_HISTORY_LENGTH = 50;

export const saveChatHistory = (messages: ChatMessage[]): void => {
    const limited = messages.slice(-MAX_HISTORY_LENGTH);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(limited));
};

export const loadChatHistory = (): ChatMessage[] => {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const clearChatHistory = (): void => {
    localStorage.removeItem(CHAT_HISTORY_KEY);
};
