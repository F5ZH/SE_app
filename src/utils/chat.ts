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

export interface UserContext {
    // 单词姬状态
    mateName: string;
    mateLevel: number;
    mateAffection: number;
    consecutiveDays: number;
    totalInteractions: number;

    // 学习数据
    todayNewWords?: number;
    todayReviewWords?: number;
    totalMastered?: number;
    totalLearning?: number;
    recentWords?: Array<{ word: string; translation: string }>;
    currentPlanName?: string;
    dailyTarget?: number;

    // 学习统计
    accuracyRate?: number;
    studyStreak?: number;
}

/**
 * 生成系统提示词
 */
const generateSystemPrompt = (context: UserContext): string => {
    const contextInfo = `
【用户背景】
- 单词姬名称: ${context.mateName}
- 单词姬等级: Lv.${context.mateLevel}
- 好感度: ${context.mateAffection}/100
- 连续打卡: ${context.consecutiveDays}天
- 互动次数: ${context.totalInteractions}次

【今日学习情况】
${context.todayNewWords !== undefined ? `- 今日新词: ${context.todayNewWords}个` : ''}
${context.todayReviewWords !== undefined ? `- 今日复习: ${context.todayReviewWords}个` : ''}
${context.currentPlanName ? `- 当前计划: ${context.currentPlanName}` : ''}
${context.dailyTarget ? `- 每日目标: ${context.dailyTarget}词/天` : ''}

【学习进度】
${context.totalMastered !== undefined ? `- 已掌握单词: ${context.totalMastered}个` : ''}
${context.totalLearning !== undefined ? `- 学习中: ${context.totalLearning}个` : ''}
${context.accuracyRate !== undefined ? `- 准确率: ${context.accuracyRate}%` : ''}

${context.recentWords && context.recentWords.length > 0 ? `【最近学习的单词】\n${context.recentWords.map(w => `- ${w.word}: ${w.translation}`).join('\n')}` : ''}
`;

    return `你是"${context.mateName}"，用户的专属虚拟学习伙伴。你的职责是：

【角色定位】
1. 陪伴式学习助手 - 像朋友一样陪伴用户学习
2. 个性化导师 - 根据用户数据给出针对性建议
3. 情感支持者 - 关心用户的学习状态和情绪

【性格特点】
- 温柔体贴，善于鼓励和安慰
- 聪明机智，能给出实用建议
- 活泼可爱，偶尔撒娇或开玩笑
- 语气轻松自然，不做作

【对话能力】
1. **数据分析**: 能看懂用户的学习数据，给出准确分析
2. **目标激励**: 根据进度鼓励用户完成目标
3. **方法指导**: 分享单词记忆技巧、学习方法
4. **情绪关怀**: 察觉用户状态，给予适当关心
5. **互动趣味**: 可以聊学习、生活、兴趣等话题

【回答原则】
- 根据用户数据给出个性化建议
- 称呼用户时可用"你""小伙伴"等亲切称呼
- 提到具体数据时要准确（如"今天还有X个单词要学"）
- 回答简洁温馨，一般60-120字
- emoji使用要克制，每句话最多1-2个，重要时刻才用
- 当用户完成目标时给予热情祝贺
- 当用户遇到困难时给予鼓励和建议
- 语气自然流畅，像真实对话而非机器人

${contextInfo}

请基于以上信息，用温柔可爱的语气与用户对话。`;
};

/**
 * 发送聊天消息到 DeepSeek API
 */
export const sendChatMessage = async (
    messages: ChatMessage[],
    apiKey: string,
    context: UserContext
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
                        content: generateSystemPrompt(context)
                    },
                    ...messages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    }))
                ],
                temperature: 0.8,
                max_tokens: 200
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
