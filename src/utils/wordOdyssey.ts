import { Word } from '../types';

/**
 * Word Odyssey - 交互式语言冒险系统
 * 基于 LLM 的沉浸式词汇学习游戏
 */

export enum AdventureTheme {
    FANTASY = 'fantasy',       // 奇幻冒险
    MYSTERY = 'mystery',       // 悬疑推理
    SCIFI = 'scifi',          // 科幻探索
    ROMANCE = 'romance',       // 浪漫恋爱
    WORKPLACE = 'workplace',   // 职场商务
    CAMPUS = 'campus'          // 校园生活
}

export enum GameMode {
    GUIDED = 'guided',         // 引导模式（选择题为主）
    FREE = 'free'              // 自由模式（开放输入）
}

export interface WordEnergy {
    wordId: string;
    word: string;
    energy: number;            // 0-100
    correctUses: number;       // 正确使用次数
    totalAttempts: number;     // 总尝试次数
    unlocked: boolean;         // 是否解锁印记
}

export interface StoryNode {
    id: string;
    narrative: string;         // 叙事文本（英文）
    choices?: StoryChoice[];   // 选项（引导模式）
    openPrompt?: string;       // 开放式问题（自由模式）
    targetWords: string[];     // 本节点期望使用的单词
    timestamp: number;
}

export interface StoryChoice {
    id: string;
    text: string;
    targetWord?: string;       // 该选项关联的目标词汇
}

export interface PlayerResponse {
    text: string;
    usedWords: string[];       // 使用的目标单词
    timestamp: number;
}

export interface WordUsageEvaluation {
    word: string;
    correct: boolean;
    feedback: string;          // AI 反馈
    energyChange: number;      // 能量变化 (+10, -5 等)
}

export interface AdventureConfig {
    theme: AdventureTheme;
    mode: GameMode;
    difficulty: 'easy' | 'medium' | 'hard';
    sessionDuration: number;   // 预期时长（分钟）
}

export interface AdventureSession {
    id: string;
    config: AdventureConfig;
    words: Word[];
    wordEnergies: Map<string, WordEnergy>;
    storyNodes: StoryNode[];
    playerResponses: PlayerResponse[];
    startTime: number;
    endTime?: number;
    completed: boolean;
}

export interface AdventureSummary {
    totalWords: number;
    unlockedWords: number;
    correctUsageRate: number;
    totalInteractions: number;
    insights: string[];        // LLM 生成的学习洞察
}

// 主题描述
export const THEME_INFO: Record<AdventureTheme, {
    name: string;
    description: string;
    icon: string;
    example: string;
}> = {
    [AdventureTheme.FANTASY]: {
        name: '奇幻冒险',
        description: '魔法世界、龙与骑士的史诗旅程',
        icon: '🐉',
        example: 'You stand at the ancient portal, mysterious runes glowing...'
    },
    [AdventureTheme.MYSTERY]: {
        name: '悬疑推理',
        description: '解开谜团，追寻真相的侦探之旅',
        icon: '🔍',
        example: 'A whisper echoes in the abandoned mansion...'
    },
    [AdventureTheme.SCIFI]: {
        name: '科幻探索',
        description: '星际航行、未来科技的冒险',
        icon: '🚀',
        example: 'Your spaceship lands on a serene, alien planet...'
    },
    [AdventureTheme.ROMANCE]: {
        name: '浪漫恋爱',
        description: '温馨浪漫的情感故事',
        icon: '💝',
        example: 'A gentle breeze carries whispers of affection...'
    },
    [AdventureTheme.WORKPLACE]: {
        name: '职场商务',
        description: '商业谈判、职场成长的挑战',
        icon: '💼',
        example: 'The boardroom is serene before the crucial meeting...'
    },
    [AdventureTheme.CAMPUS]: {
        name: '校园生活',
        description: '青春校园、友谊与成长',
        icon: '🎓',
        example: 'The campus library whispers with the sound of pages turning...'
    }
};

/**
 * 生成冒险剧情（使用 DeepSeek API）
 */
export async function generateAdventureStory(
    words: Word[],
    config: AdventureConfig,
    previousNodes: StoryNode[],
    lastResponse: PlayerResponse | null,
    apiKey: string
): Promise<StoryNode> {
    if (!apiKey) {
        throw new Error('请先配置 DeepSeek API Key');
    }

    const wordList = words.map(w => `${w.word} (${w.translation})`).join(', ');
    const themeInfo = THEME_INFO[config.theme];
    const isFirstNode = previousNodes.length === 0;

    // 构建上下文
    let contextPrompt = '';
    if (previousNodes.length > 0) {
        const lastNode = previousNodes[previousNodes.length - 1];
        contextPrompt = `\n【前情提要】\n${lastNode.narrative}\n`;
        if (lastResponse) {
            contextPrompt += `\n【玩家行动】\n${lastResponse.text}\n`;
        }
    }

    const prompt = `你是一位专业的互动小说作家和英语教学专家。请创作一个${themeInfo.name}风格的互动冒险故事节点。

【故事主题】
- 类型：${themeInfo.description}
- 风格：${themeInfo.example}

【目标单词】（必须自然融入故事）
${wordList}

【游戏模式】
${config.mode === GameMode.GUIDED ? '引导模式 - 提供2-3个选择项' : '自由模式 - 提出开放式问题'}
${contextPrompt}

【创作要求】
1. ${isFirstNode ? '创作一个引人入胜的开场，设定场景和氛围' : '根据前情继续推进剧情'}
2. 自然使用目标单词（不要生硬堆砌）
3. 制造适度悬念或冲突
4. 语言地道优美，适合英语学习
5. ${config.mode === GameMode.GUIDED ? '提供2-3个行动选项，每个选项鼓励使用特定单词' : '提出一个开放式问题，引导玩家使用目标单词'}

【输出格式】严格使用以下JSON格式，不要添加任何其他内容：

${config.mode === GameMode.GUIDED ? `{
  "narrative": "场景叙事文本（英文，100-150词）",
  "choices": [
    {
      "id": "choice_1",
      "text": "选项1文本",
      "targetWord": "期望使用的单词"
    },
    {
      "id": "choice_2", 
      "text": "选项2文本",
      "targetWord": "期望使用的单词"
    }
  ],
  "targetWords": ["本节点涉及的目标单词"]
}` : `{
  "narrative": "场景叙事文本（英文，100-150词）",
  "openPrompt": "开放式问题（英文）",
  "targetWords": ["本节点期望玩家使用的单词"]
}`}

现在开始创作！`;

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
                        content: `你是一位专业的互动小说作家和英语教学专家。你擅长创作引人入胜的英文故事，并巧妙地将学习词汇融入剧情。你的叙事风格生动、地道，能激发读者的想象力和学习兴趣。`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.85,
                max_tokens: 800
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`API调用失败: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // 解析JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('无法解析AI响应');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            id: `node_${Date.now()}`,
            narrative: parsed.narrative,
            choices: parsed.choices,
            openPrompt: parsed.openPrompt,
            targetWords: parsed.targetWords || [],
            timestamp: Date.now()
        };
    } catch (error) {
        console.error('生成冒险故事失败:', error);
        throw error;
    }
}

/**
 * 评估玩家的词汇使用
 */
export async function evaluateWordUsage(
    response: string,
    targetWords: Word[],
    apiKey: string
): Promise<WordUsageEvaluation[]> {
    const wordList = targetWords.map(w => w.word.toLowerCase());
    const usedWords = new Set<string>();

    // 检测使用了哪些目标单词
    const responseWords = response.toLowerCase().match(/\b\w+\b/g) || [];
    responseWords.forEach(word => {
        if (wordList.includes(word)) {
            usedWords.add(word);
        }
    });

    if (usedWords.size === 0) {
        return [];
    }

    // 使用 LLM 评估语义正确性
    const prompt = `作为英语教学专家，请评估以下句子中目标单词的使用是否正确：

【学生回答】
${response}

【目标单词】
${Array.from(usedWords).map(w => {
        const word = targetWords.find(tw => tw.word.toLowerCase() === w);
        return `${word?.word} - ${word?.translation}`;
    }).join('\n')}

请对每个单词的使用进行评估：
1. 语义是否正确（是否符合该词的真实含义）
2. 语法搭配是否恰当
3. 给出简短的反馈建议

【输出格式】严格使用JSON数组格式：

[
  {
    "word": "单词原形",
    "correct": true/false,
    "feedback": "简短反馈（中英文均可，30字以内）",
    "energyChange": 15
  }
]

能量变化规则：
- 完美使用：+15
- 正确但有小瑕疵：+10
- 勉强可接受：+5
- 语义错误：-5
- 完全误用：-10`;

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
                        content: '你是一位专业的英语教学评估专家，擅长分析学生的语言使用情况并给出建设性反馈。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error('评估API调用失败');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('无法解析评估结果');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('词汇使用评估失败:', error);
        // 返回默认评估
        return Array.from(usedWords).map(word => ({
            word,
            correct: true,
            feedback: '使用正确！',
            energyChange: 10
        }));
    }
}

/**
 * 生成学习总结
 */
export async function generateAdventureSummary(
    session: AdventureSession,
    apiKey: string
): Promise<AdventureSummary> {
    const wordEnergies = Array.from(session.wordEnergies.values());
    const totalWords = wordEnergies.length;
    const unlockedWords = wordEnergies.filter(w => w.unlocked).length;
    const totalAttempts = wordEnergies.reduce((sum, w) => sum + w.totalAttempts, 0);
    const correctUses = wordEnergies.reduce((sum, w) => sum + w.correctUses, 0);
    const correctUsageRate = totalAttempts > 0 ? correctUses / totalAttempts : 0;

    // 使用 LLM 生成个性化洞察
    const wordStats = wordEnergies.map(w => 
        `${w.word}: 能量${w.energy}/100, 正确${w.correctUses}/${w.totalAttempts}次, ${w.unlocked ? '已解锁✓' : '未解锁'}`
    ).join('\n');

    const prompt = `作为英语学习顾问，请为学生生成个性化的学习总结和建议。

【学习数据】
总单词数: ${totalWords}
解锁单词: ${unlockedWords}
总互动次数: ${session.playerResponses.length}
正确率: ${(correctUsageRate * 100).toFixed(1)}%

【单词详情】
${wordStats}

请生成3-5条个性化的学习洞察，每条20-40字，包括：
1. 对表现的肯定
2. 需要加强的方面
3. 具体的改进建议
4. 鼓励性的总结

【输出格式】JSON数组：

{
  "insights": [
    "洞察1",
    "洞察2",
    "洞察3"
  ]
}`;

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
                        content: '你是一位温和、鼓励型的英语学习顾问，擅长给学生提供建设性的反馈和激励。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error('总结生成失败');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { insights: [] };

        return {
            totalWords,
            unlockedWords,
            correctUsageRate,
            totalInteractions: session.playerResponses.length,
            insights: parsed.insights || [
                '你完成了一次精彩的语言冒险！',
                '继续保持这样的学习节奏，词汇量会稳步提升。',
                '建议多在真实场景中使用新学的单词，加深记忆。'
            ]
        };
    } catch (error) {
        console.error('生成总结失败:', error);
        return {
            totalWords,
            unlockedWords,
            correctUsageRate,
            totalInteractions: session.playerResponses.length,
            insights: [
                `太棒了！你已经解锁了 ${unlockedWords}/${totalWords} 个单词！`,
                `正确率达到 ${(correctUsageRate * 100).toFixed(1)}%，继续加油！`,
                '每一次冒险都是语言能力的提升，坚持下去！'
            ]
        };
    }
}

/**
 * 初始化词汇能量
 */
export function initializeWordEnergies(words: Word[]): Map<string, WordEnergy> {
    const energies = new Map<string, WordEnergy>();
    words.forEach(word => {
        energies.set(word.id, {
            wordId: word.id,
            word: word.word,
            energy: 0,
            correctUses: 0,
            totalAttempts: 0,
            unlocked: false
        });
    });
    return energies;
}

/**
 * 更新词汇能量
 */
export function updateWordEnergy(
    energies: Map<string, WordEnergy>,
    evaluation: WordUsageEvaluation
): WordEnergy | undefined {
    // 查找对应的单词
    let targetEnergy: WordEnergy | undefined;
    energies.forEach(energy => {
        if (energy.word.toLowerCase() === evaluation.word.toLowerCase()) {
            targetEnergy = energy;
        }
    });

    if (!targetEnergy) return undefined;

    targetEnergy.totalAttempts++;
    if (evaluation.correct) {
        targetEnergy.correctUses++;
    }

    targetEnergy.energy = Math.max(0, Math.min(100, targetEnergy.energy + evaluation.energyChange));

    if (targetEnergy.energy >= 100 && !targetEnergy.unlocked) {
        targetEnergy.unlocked = true;
    }

    return targetEnergy;
}
