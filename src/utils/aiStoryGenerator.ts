/**
 * AI故事生成器
 * 使用DeepSeek API将单词串联成故事
 */

import { Word } from '../types';

export enum StoryStyle {
    DAILY = 'daily',           // 日常对话
    MYSTERY = 'mystery',       // 悬疑推理
    SCIFI = 'scifi',          // 科幻冒险
    BUSINESS = 'business',     // 商务场景
    HUMOR = 'humor',          // 幽默搞笑
    HISTORY = 'history'        // 历史穿越
}

export enum StoryDifficulty {
    EASY = 'easy',            // 简单 - 短句，简单语法
    MEDIUM = 'medium',        // 中等 - 适中长度和复杂度
    HARD = 'hard'             // 困难 - 复杂句式，深度情节
}

export interface StoryConfig {
    style: StoryStyle;
    difficulty: StoryDifficulty;
    includeTranslation: boolean;  // 是否包含中文翻译
    wordCount?: number;            // 目标字数
}

export interface GeneratedStory {
    title: string;
    content: string;
    translation?: string;
    words: Word[];
    style: StoryStyle;
    difficulty: StoryDifficulty;
    createdAt: number;
}

const STYLE_PROMPTS = {
    [StoryStyle.DAILY]: {
        description: '日常生活对话场景',
        tone: '温馨自然，贴近生活',
        example: '比如购物、聚会、旅行等日常活动'
    },
    [StoryStyle.MYSTERY]: {
        description: '悬疑推理故事',
        tone: '紧张刺激，扣人心弦',
        example: '包含线索、推理过程和出人意料的结局'
    },
    [StoryStyle.SCIFI]: {
        description: '科幻冒险故事',
        tone: '充满想象力和未来感',
        example: '可以包含太空、AI、时间旅行等元素'
    },
    [StoryStyle.BUSINESS]: {
        description: '商务职场场景',
        tone: '专业正式，商务气息',
        example: '比如会议、谈判、项目管理等职场情境'
    },
    [StoryStyle.HUMOR]: {
        description: '幽默搞笑故事',
        tone: '轻松诙谐，妙趣横生',
        example: '使用双关、误会、夸张等喜剧元素'
    },
    [StoryStyle.HISTORY]: {
        description: '历史穿越故事',
        tone: '代入感强，历史氛围浓厚',
        example: '可以涉及古代文明、历史事件、时空交错'
    }
};

const DIFFICULTY_PROMPTS = {
    [StoryDifficulty.EASY]: {
        sentenceStructure: '使用简单句和常见的复合句',
        wordCount: '200-300字',
        vocabulary: '避免生僻词汇，多用基础词汇',
        grammar: '一般现在时、过去时为主，简单语法结构'
    },
    [StoryDifficulty.MEDIUM]: {
        sentenceStructure: '混合使用简单句、复合句和部分复杂句',
        wordCount: '400-600字',
        vocabulary: '适当使用中级词汇和短语',
        grammar: '多种时态混用，适度的从句和非谓语动词'
    },
    [StoryDifficulty.HARD]: {
        sentenceStructure: '大量使用复杂句式、长句和嵌套结构',
        wordCount: '600-800字',
        vocabulary: '丰富的高级词汇和地道表达',
        grammar: '虚拟语气、倒装、强调句等高级语法'
    }
};

/**
 * 调用DeepSeek API生成故事
 */
export async function generateStoryWithAI(
    words: Word[],
    config: StoryConfig,
    apiKey: string
): Promise<GeneratedStory> {
    if (!apiKey) {
        throw new Error('请先配置DeepSeek API Key');
    }

    if (words.length === 0) {
        throw new Error('请至少提供一个单词');
    }

    // 构建提示词
    const wordList = words.map(w => `${w.word} (${w.translation})`).join(', ');
    const styleInfo = STYLE_PROMPTS[config.style];
    const difficultyInfo = DIFFICULTY_PROMPTS[config.difficulty];

    // 构建更详细的Prompt
    const prompt = `作为一名专业的英语教学故事创作者，请创作一个${styleInfo.description}的英文短文。

【故事风格】
- 类型：${styleInfo.description}
- 语气：${styleInfo.tone}
- 参考方向：${styleInfo.example}

【必须使用的单词】
${wordList}

【难度要求】
- 句式结构：${difficultyInfo.sentenceStructure}
- 目标字数：${difficultyInfo.wordCount}
- 词汇水平：${difficultyInfo.vocabulary}
- 语法要求：${difficultyInfo.grammar}

【故事结构】
1. 引人入胜的开头（设定场景/人物）
2. 发展部分（情节推进，自然使用目标单词）
3. 完整的结尾（呼应主题，给读者启发）

【质量标准】
✓ 情节连贯，逻辑自然
✓ 单词融入自然，不生硬堆砌
✓ 语言地道，符合英语表达习惯
✓ 内容有趣，能吸引学习者阅读

${config.includeTranslation ? '【翻译要求】\n提供准确流畅的中文翻译，帮助理解故事内容\n' : ''}
【输出格式】
请严格按照以下JSON格式输出，不要添加任何其他文字或markdown格式：

{
  "title": "一个吸引人的英文标题",
  "content": "完整的英文故事内容（纯文本，不使用markdown格式）",
  "translation": "完整的中文翻译"
}

重要提示：
1. title: 必须是英文标题
2. content: 必须是英文故事内容
3. translation: 必须是中文翻译
4. 只输出JSON对象，不要有其他内容

现在开始创作吧！`;


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
                        content: `你是一位资深的英语教学专家和创意写作导师。你的专长是：
1. 用英语创作引人入胜的学习故事
2. 精准把握不同英语水平学习者的需求
3. 将词汇自然融入情境，而不是生硬堆砌
4. 用故事激发学习兴趣，提高记忆效果

你的创作原则：
- 情节优先：故事本身要有趣、完整
- 自然融入：单词使用要符合语境，像native speaker一样自然
- 教学导向：确保学习者能从故事中理解单词的真实用法
- 难度适配：根据学习者水平调整语言复杂度

重要提醒：你创作的故事必须是英文的，中文只用于翻译部分！`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`API调用失败: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // 解析返回的内容
        const parsed = parseStoryContent(content);

        return {
            title: parsed.title,
            content: parsed.content,
            translation: config.includeTranslation ? parsed.translation : undefined,
            words,
            style: config.style,
            difficulty: config.difficulty,
            createdAt: Date.now()
        };
    } catch (error) {
        console.error('AI故事生成失败:', error);
        throw error;
    }
}

/**
 * 解析AI返回的故事内容（JSON格式）
 */
function parseStoryContent(content: string): {
    title: string;
    content: string;
    translation?: string;
} {
    try {
        // 尝试提取JSON对象
        // 有时AI会在JSON前后添加一些文字，需要提取出JSON部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('无法找到JSON格式的响应');
        }

        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        // 验证必需字段
        if (!parsed.title || !parsed.content) {
            throw new Error('JSON响应缺少必需字段');
        }

        // 去除可能残留的markdown格式
        const cleanContent = parsed.content.replace(/\*\*/g, '').trim();
        const cleanTranslation = parsed.translation ? parsed.translation.replace(/\*\*/g, '').trim() : undefined;

        return {
            title: parsed.title.trim(),
            content: cleanContent,
            translation: cleanTranslation
        };
    } catch (error) {
        console.error('JSON解析失败，尝试备用解析:', error);
        
        // 如果JSON解析失败，尝试旧的文本解析方式作为备用
        const lines = content.split('\n');
        let title = '学习故事';
        let storyContent = '';
        let translation = '';
        let section: 'title' | 'content' | 'translation' = 'title';

        for (let line of lines) {
            line = line.trim();

            if (line.startsWith('标题：') || line.startsWith('Title:')) {
                title = line.replace(/^(标题：|Title:)\s*/, '');
                section = 'content';
            } else if (line === '---') {
                if (section === 'content') {
                    section = 'translation';
                }
            } else if (line.startsWith('中文翻译：') || line.startsWith('Translation:')) {
                section = 'translation';
                continue;
            } else if (line) {
                if (section === 'content') {
                    storyContent += line + '\n';
                } else if (section === 'translation') {
                    translation += line + '\n';
                }
            }
        }

        return {
            title: title.trim(),
            content: storyContent.replace(/\*\*/g, '').trim(),
            translation: translation.replace(/\*\*/g, '').trim() || undefined
        };
    }
}

/**
 * 生成示例故事（当没有API Key时使用）
 */
export function generateDemoStory(words: Word[], config: StoryConfig): GeneratedStory {
    const wordList = words.slice(0, 5).map(w => w.word).join(', ');

    const demoStory = `Once upon a time, there was a student learning English. They discovered these words: ${wordList}. With practice and dedication, they mastered each word through context and repetition. The journey of language learning brought joy and opened new opportunities. Every word learned was a step closer to fluency and confidence.`;

    const demoTranslation = config.includeTranslation
        ? `从前，有一个学生在学习英语。他们发现了这些单词：${wordList}。通过练习和专注，他们通过上下文和重复掌握了每个单词。语言学习的旅程带来了快乐并开启了新的机会。学到的每个单词都是向流利和自信迈进的一步。`
        : undefined;

    return {
        title: 'A Learning Journey',
        content: demoStory,
        translation: demoTranslation,
        words,
        style: config.style,
        difficulty: config.difficulty,
        createdAt: Date.now()
    };
}
