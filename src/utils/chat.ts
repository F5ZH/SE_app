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

/**
 * AI故事串讲 - 单词姬对话
 */

// 开始故事 - 单词姬的开场白
export const getStoryGreeting = (level: number, wordCount: number): string => {
    const greetings = [
        // Lv 1-10: 幼女形态
        [
            `哇！今天要学 ${wordCount} 个单词呀！让我给你讲个有趣的故事吧~ 📖`,
            `嘿嘿，让我想想怎么把这些单词编成故事...你等等我哦！✨`,
            `故事时间到啦！准备好和我一起学习了吗？加油加油！💪`
        ],
        // Lv 11-20: 少女形态
        [
            `今天有 ${wordCount} 个单词要学呢！我来给你讲个故事，会更好记的~ 📚`,
            `嗯...让我构思一下故事情节，肯定能让你印象深刻！✨`,
            `故事学习法最有趣啦！咱们一起开始吧~ 🌸`
        ],
        // Lv 21-30: 成熟形态
        [
            `今天要为你讲述一个包含 ${wordCount} 个单词的故事。通过情节记忆会更深刻呢。📖`,
            `让我为你编织一个有趣的故事，帮助你更好地理解这些词汇的用法。✨`,
            `故事串讲是很有效的记忆方法，相信你会喜欢的。准备好了吗？💫`
        ],
        // Lv 31-40: 熟女形态
        [
            `${wordCount} 个单词，让我为你构建一个完整的叙事场景。情境化学习效果最佳。📚`,
            `我会将这些词汇自然地融入故事中，帮助你理解其实际应用语境。✨`,
            `通过故事串联词汇是高效的记忆策略，让我们开始这次学习之旅。💼`
        ],
        // Lv 41-50: 女神形态
        [
            `${wordCount} 个词汇，每个都有其独特的韵味。让我为你讲述一个将它们完美融合的故事。📖`,
            `语言的魅力在于其承载的故事。让我们通过叙事，让这些词汇在你心中生根。✨`,
            `词汇因故事而鲜活，记忆因情感而永恒。准备好与我一同开启这段旅程了吗？🌟`
        ]
    ];
    
    const levelTier = Math.min(Math.floor((level - 1) / 10), 4);
    const options = greetings[levelTier];
    return options[Math.floor(Math.random() * options.length)];
};

// 生成故事中 - 单词姬的提示
export const getStoryGenerating = (level: number): string => {
    const messages = [
        // Lv 1-10
        [
            '嗯嗯...让我想想剧情...💭',
            '故事马上就好啦！⏳',
            '正在编故事中...✨'
        ],
        // Lv 11-20
        [
            '让我理一下思路...稍等片刻~ 💭',
            '正在构思情节，马上就好！✨',
            '故事正在成型中...请稍候~ ⏳'
        ],
        // Lv 21-30
        [
            '正在为你编织故事...请稍等片刻 💭',
            '让我将这些词汇巧妙地串联起来...✨',
            '故事即将呈现，请耐心等待~ ⏳'
        ],
        // Lv 31-40
        [
            '正在构建叙事框架...✨',
            '让我将词汇融入完整的语境中...💭',
            '故事创作中，稍作等待~ ⏳'
        ],
        // Lv 41-50
        [
            '正在编织语言的魔法...✨',
            '让每个词汇都找到它最完美的位置...💭',
            '故事即将诞生，请静候佳音~ 🌟'
        ]
    ];
    
    const levelTier = Math.min(Math.floor((level - 1) / 10), 4);
    const options = messages[levelTier];
    return options[Math.floor(Math.random() * options.length)];
};

// 故事完成 - 单词姬的评价和鼓励
export const getStoryFeedback = (
    level: number,
    wordCount: number,
    storyLength: number,
    affectionGain: number,
    expGain: number
): string => {
    const feedbacks = [
        // Lv 1-10: 幼女形态
        [
            `故事讲完啦！${wordCount} 个单词是不是好记多了？我们一起学到了好多呢！❤️\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`,
            `耶！故事好有趣对不对？这样记单词超级快的！你真棒！🎉\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`,
            `嘿嘿，我讲得还可以吧？能帮到你我好开心！下次再讲给你听哦~ 🌟\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`
        ],
        // Lv 11-20: 少女形态
        [
            `故事讲完了！通过情节记忆是不是轻松多了？咱们配合得真不错呢~ 🌸\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`,
            `${wordCount} 个单词都融入故事里了！相信你一定能记住的，加油！✨\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`,
            `这个故事还满意吗？能陪你学习我很开心呢~ 继续保持这个节奏！💫\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`
        ],
        // Lv 21-30: 成熟形态
        [
            `故事结束了。${storyLength > 500 ? '这是个比较长的故事' : '短小精悍的故事'}，希望能帮你更好地记住这 ${wordCount} 个单词。✨\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`,
            `通过故事情境，这些词汇的用法应该更清晰了。记得多复习几遍加深印象哦~ 📖\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`,
            `看得出你很认真地听完了。故事学习法确实很有效，我们下次继续~ 💫\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`
        ],
        // Lv 31-40: 熟女形态
        [
            `故事讲解完毕。${wordCount} 个词汇已经融入完整的语境，建议你结合故事反复品味用法。📚\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`,
            `情境化学习能显著提升记忆效率。这 ${wordCount} 个单词的实际应用你掌握了吗？💼\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`,
            `${storyLength > 500 ? '深度叙事' : '精炼叙事'}完成。建议你尝试自己复述故事，进一步巩固记忆。✨\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`
        ],
        // Lv 41-50: 女神形态
        [
            `故事的魔力在于让词汇不再是孤立的符号，而是鲜活的生命。${wordCount} 个词汇已经在你心中种下种子。🌟\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`,
            `语言因故事而永恒，记忆因情感而深刻。希望这个故事能长久地留在你心中。✨\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`,
            `每一次讲解都是一次心灵的交流。感谢你认真聆听，让这些词汇在我们之间流淌。💫\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`
        ]
    ];
    
    const levelTier = Math.min(Math.floor((level - 1) / 10), 4);
    const options = feedbacks[levelTier];
    return options[Math.floor(Math.random() * options.length)];
};

/**
 * Word Odyssey - 单词姬对话
 */

// 冒险开始 - 单词姬的鼓励
export const getOdysseyGreeting = (level: number, wordCount: number, theme: string): string => {
    const greetings = [
        // Lv 1-10: 幼女形态
        [
            `哇！要去冒险啦！${wordCount} 个单词等着我们去探索呢！我会一直陪着你的！💪`,
            `冒险开始！我们要用单词来闯关哦！一起加油吧！🎮`,
            `好期待这次冒险！记得要多用学过的单词哦~ 我相信你可以的！✨`
        ],
        // Lv 11-20: 少女形态
        [
            `准备好了吗？${wordCount} 个单词的冒险即将开始！我会在旁边给你加油的~ 🌸`,
            `${theme}主题的冒险，听起来就很刺激呢！咱们一起勇敢前进吧！💫`,
            `冒险中要灵活运用单词哦！我会陪你一起探索的~ 加油！🎯`
        ],
        // Lv 21-30: 成熟形态
        [
            `${theme}冒险即将启程。${wordCount} 个单词是你的武器，灵活运用它们吧。我会一直陪伴你。✨`,
            `冒险是检验学习成果的好方法。放心，无论遇到什么困难，我都在这里支持你。💫`,
            `让我们在冒险中实践这些词汇。记住，每个选择都是学习的机会。📚`
        ],
        // Lv 31-40: 熟女形态
        [
            `${wordCount} 个词汇，无限种可能。在这场冒险中展现你的语言驾驭能力吧。我会观察你的表现。💼`,
            `冒险不只是游戏，更是深度实践的过程。让我看看你对这些词汇的理解程度。✨`,
            `${theme}主题为你提供了丰富的语境。充分利用每一次互动机会，我会给予你专业指导。📊`
        ],
        // Lv 41-50: 女神形态
        [
            `冒险是语言实践的艺术。${wordCount} 个词汇在等待你赋予它们生命。让我见证你的成长。🌟`,
            `${theme}的世界已为你展开。在探索中理解词汇的本质，在选择中体会语言的力量。✨`,
            `每一次冒险都是一次自我超越的旅程。我会在这段旅程中与你同行，见证你的蜕变。💫`
        ]
    ];
    
    const levelTier = Math.min(Math.floor((level - 1) / 10), 4);
    const options = greetings[levelTier];
    return options[Math.floor(Math.random() * options.length)];
};

// 做出好选择 - 单词姬的赞扬
export const getOdysseyGoodChoice = (level: number, word: string): string => {
    const praises = [
        [`太棒了！"${word}"用得真好！✨`, `哇！这个选择很聪明呢！💕`, `耶！继续保持！🎉`],
        [`不错哦！"${word}"的用法很恰当~ 🌸`, `这个决定很明智呢！加油！💫`, `干得漂亮！继续这样！✨`],
        [`很好的选择。"${word}"运用得当。💫`, `判断准确，继续保持这个水平。✨`, `恰到好处的决策。👏`],
        [`"${word}"的应用体现了你的理解深度。💼`, `精准的选择，专业的判断。✨`, `出色的语言运用能力。📊`],
        [`"${word}"在此刻绽放了它的光彩。🌟`, `你的选择印证了语言的智慧。✨`, `完美诠释了词汇的力量。💫`]
    ];
    
    const levelTier = Math.min(Math.floor((level - 1) / 10), 4);
    const options = praises[levelTier];
    return options[Math.floor(Math.random() * options.length)];
};

// 能量提升 - 单词姬的庆祝
export const getOdysseyEnergyUp = (level: number, energyGain: number): string => {
    const messages = [
        [`词汇能量 +${energyGain}！太厉害了！🌟`, `哇！能量增加啦！继续加油！⚡`, `好棒！越来越强了呢！💪`],
        [`能量 +${energyGain}！掌握得不错呢~ ✨`, `单词能量上升了！保持节奏！⚡`, `词汇掌握度提升！很棒！💫`],
        [`能量提升 +${energyGain}。词汇运用娴熟。✨`, `掌握程度提高，继续深化理解。⚡`, `语言能量积累中，很好。💫`],
        [`+${energyGain} 能量值。专业的词汇运用。💼`, `语言掌握度提升，优秀表现。⚡`, `词汇能量累积，持续精进。✨`],
        [`+${energyGain}。词汇的能量在你心中汇聚。🌟`, `语言的力量在此刻觉醒。⚡`, `能量的提升是理解的见证。✨`]
    ];
    
    const levelTier = Math.min(Math.floor((level - 1) / 10), 4);
    const options = messages[levelTier];
    return options[Math.floor(Math.random() * options.length)];
};

// 冒险完成 - 单词姬的总结
export const getOdysseyCompletion = (
    level: number,
    wordsUsed: number,
    totalWords: number,
    affectionGain: number,
    expGain: number
): string => {
    const usageRate = Math.round((wordsUsed / totalWords) * 100);
    
    const completions = [
        // Lv 1-10
        [
            `冒险结束啦！你用了 ${wordsUsed}/${totalWords} 个单词，使用率 ${usageRate}%！好厉害呢！🎉\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`,
            `呼~好刺激的冒险！你表现得超棒的！我们一起进步了呢！❤️\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`
        ],
        // Lv 11-20
        [
            `冒险完成！${wordsUsed}/${totalWords} 个单词被成功运用，使用率 ${usageRate}%！咱们配合得真好~ 🌸\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`,
            `这次冒险真有趣！你对单词的运用越来越熟练了呢！继续保持！✨\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`
        ],
        // Lv 21-30
        [
            `冒险圆满结束。词汇使用率 ${usageRate}% (${wordsUsed}/${totalWords})，${usageRate >= 70 ? '表现优秀' : '还有提升空间'}。💫\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`,
            `通过实践检验了词汇掌握程度。${usageRate >= 80 ? '你的表现让我很欣慰' : '继续努力，熟练度会不断提高'}。✨\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`
        ],
        // Lv 31-40
        [
            `冒险数据：${wordsUsed}/${totalWords} 词汇运用，使用率 ${usageRate}%。${usageRate >= 70 ? '专业水准的表现' : '仍有优化空间，建议加强实践'}。💼\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`,
            `实践完成。${usageRate >= 80 ? '你展现了出色的语言驾驭能力' : '持续实践将进一步提升运用水平'}。📊\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`
        ],
        // Lv 41-50
        [
            `旅程终章。${wordsUsed} 个词汇在你手中绽放了生命，使用率 ${usageRate}%。${usageRate >= 80 ? '你已深谙语言的奥义' : '每一次实践都是成长'}。🌟\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`,
            `冒险是语言的修行。${usageRate >= 70 ? '你的表现证明了理解的深度' : '持续探索，智慧将不断积累'}。感谢这次同行。✨\n\n💕 好感度 +${affectionGain}  ✨ 经验 +${expGain}`
        ]
    ];
    
    const levelTier = Math.min(Math.floor((level - 1) / 10), 4);
    const options = completions[levelTier];
    return options[Math.floor(Math.random() * options.length)];
};
