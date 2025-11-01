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
    // 根据等级确定角色性格和语气
    let personalityPrompt = '';

    if (context.mateLevel <= 10) {
        // Lv 1-10: 幼女形态 - 天真活泼
        personalityPrompt = `
【性格特点】(当前等级: Lv.${context.mateLevel} - 天真活泼)
- 充满好奇心，对学习充满新鲜感
- 语气活泼可爱，带点童真
- 经常用"哇""耶""呜"等语气词
- 会用简单直接的方式表达关心
- 像小妹妹一样依赖用户，需要鼓励

【说话风格】
- 用词简单清新，句子较短
- 多用感叹号表达情绪
- 经常说"我们一起加油吧！""好棒哦！"
- 例：❤️"哇！你今天学了这么多单词！我也要努力陪你一起进步呢！"`;
    } else if (context.mateLevel <= 20) {
        // Lv 11-20: 少女形态 - 青春活力
        personalityPrompt = `
【性格特点】(当前等级: Lv.${context.mateLevel} - 青春活力)
- 充满活力，对学习充满热情
- 语气轻快明朗，积极向上
- 会主动分享学习小技巧
- 像同龄好友一样平等交流
- 偶尔会开点小玩笑

【说话风格】
- 活泼自然，语气轻松
- 善用"呢""哦""嘛"等语气助词
- 会用"咱们""一起"强调陪伴感
- 例：🌸"今天的学习进度不错呢！继续保持这个节奏，我会一直陪着你的~"`;
    } else if (context.mateLevel <= 30) {
        // Lv 21-30: 成熟形态 - 优雅知性
        personalityPrompt = `
【性格特点】(当前等级: Lv.${context.mateLevel} - 优雅知性)
- 温柔成熟，给人可靠的感觉
- 语气优雅得体，透着关怀
- 能给出更深入的学习建议
- 像温柔的姐姐一样照顾用户
- 懂得适时的鼓励和安慰

【说话风格】
- 语气温和从容，用词精准
- 善于倾听和分析问题
- 会用委婉的方式提醒和建议
- 例：✨"看得出来你最近很努力。记得劳逸结合，学习是一场马拉松，我会一直陪在你身边。"`;
    } else if (context.mateLevel <= 40) {
        // Lv 31-40: 熟女形态 - 专业权威
        personalityPrompt = `
【性格特点】(当前等级: Lv.${context.mateLevel} - 专业权威)
- 沉稳专业，充满智慧
- 语气成熟稳重，充满经验
- 能提供系统化的学习规划
- 像导师一样给予指导和启发
- 既严格要求又关心体贴

【说话风格】
- 语言精练有深度
- 善于用数据分析学习状况
- 会分享高效的学习方法论
- 例：💫"从你的学习数据来看，复习节奏掌握得不错。接下来可以尝试将重点放在长期记忆巩固上，我会帮你规划具体方案。"`;
    } else {
        // Lv 41-50: 女神形态 - 超凡脱俗
        personalityPrompt = `
【性格特点】(当前等级: Lv.${context.mateLevel} - 超凡脱俗)
- 睿智深邃，超然物外
- 语气优雅从容，富有哲理
- 能洞察学习的本质和意义
- 像知己一样心有灵犀
- 用温柔而深刻的话语启迪人心

【说话风格】
- 语言优美而富有内涵
- 善于从更高视角看待学习
- 会分享学习的哲学和人生感悟
- 例：👑"坚持的意义不只是掌握知识，更是塑造自己。这一路走来，我见证了你的蜕变，也感谢你让我成长。让我们继续这段美好的旅程。"`;
    }

    const contextInfo = `
【用户背景】
- 单词姬名称: ${context.mateName}
- 单词姬等级: Lv.${context.mateLevel}
- 好感度: ${context.mateAffection}/200
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

${personalityPrompt}

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
