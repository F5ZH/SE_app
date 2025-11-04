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
    guidanceHint?: string;     // 回答指导（自由模式）
    suggestedResponse?: string; // 参考回答示例（自由模式）
    targetWords: string[];     // 本节点期望使用的单词
    timestamp: number;
    nextNodes?: Map<string, StoryNode>; // 预生成的后续节点（选项ID -> 节点）
}

export interface StoryChoice {
    id: string;
    text: string;
    targetWord?: string;       // 该选项关联的目标词汇
    pregenerated?: boolean;    // 是否已预生成后续内容
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
    customAdventure?: string;  // 用户自定义冒险描述
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
    const isFirstNode = previousNodes.length === 0;

    // 判断使用自定义冒险还是预设主题
    let themeSection: string;
    let storyTone: string;

    if (config.customAdventure && config.customAdventure.trim()) {
        // 使用用户自定义冒险
        themeSection = `【用户设定的冒险场景】
${config.customAdventure}

【重要指示】
- 严格遵循用户描述的场景和氛围
- 不要擅自添加"危机"、"威胁"、"挑战"等元素，除非用户明确要求
- 保持用户描述的基调（温馨、探索、日常、神秘等）
- 如果用户描述的是轻松场景，就保持轻松；如果是冒险场景，才添加冒险元素`;

        storyTone = '根据用户描述的基调和氛围';
    } else {
        // 使用预设主题
        const themeInfo = THEME_INFO[config.theme];
        themeSection = `【预设主题】
- 类型：${themeInfo.description}
- 风格：${themeInfo.example}`;

        storyTone = '符合主题的适度悬念或趣味';
    }

    // 构建上下文
    let contextPrompt = '';
    if (previousNodes.length > 0) {
        const lastNode = previousNodes[previousNodes.length - 1];
        contextPrompt = `\n【前情提要】\n${lastNode.narrative}\n`;
        if (lastResponse) {
            contextPrompt += `\n【玩家行动】\n${lastResponse.text}\n`;
        }
    }

    const prompt = `你是一位专业的互动小说作家和英语教学专家。请创作一个互动冒险故事节点。

${themeSection}

【目标单词】（必须自然融入故事）
${wordList}

【游戏模式】
${config.mode === GameMode.GUIDED ? '引导模式 - 提供2-3个选择项' : '自由模式 - 提出开放式问题'}
${contextPrompt}

【创作要求】
1. ${isFirstNode ? '创作一个引人入胜的开场，设定场景和氛围' : '根据前情继续推进剧情，保持连贯性'}
2. 自然流畅地使用目标单词（融入对话、描写、动作中，不要生硬堆砌）
3. ${storyTone}
4. 语言地道优美，适合英语学习
5. ${config.mode === GameMode.GUIDED ? '提供2-3个行动选项，每个选项鼓励使用特定单词' : '提供明确的回答指导和参考示例，帮助玩家构建正确的回答'}
6. 保持故事的正向氛围，让学习过程愉快而非紧张

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
  "targetWords": ["本节点涉及的目标单词，每次1-2个即可"]
}` : `{
  "narrative": "场景叙事文本（英文，100-150词）",
  "openPrompt": "开放式问题（英文，引导玩家思考如何回应）",
  "guidanceHint": "回答指导（中文，详细说明玩家应该表达什么内容、采取什么行动或态度，建议使用哪1-2个目标词，50-80字）",
  "suggestedResponse": "参考回答示例（英文，简短的1-2句话，10-20词，自然使用1-2个目标词）",
  "targetWords": ["本节点建议使用的1-2个单词"]
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
                        content: `你是一位专业的互动小说作家和英语教学专家。你擅长：
1. 创作引人入胜的英文故事
2. 巧妙地将学习词汇融入剧情
3. 严格遵循用户的场景设定和期待
4. 根据不同场景调整叙事风格（轻松、冒险、温馨、神秘等）

重要原则：
- 用户意图优先：如果用户描述的是轻松探索，就不要添加危机；如果是温馨场景，就不要制造冲突
- 场景适配：根据用户设定的场景选择合适的叙事基调
- 自然流畅：词汇使用要自然，故事要符合设定的氛围
- 学习友好：让学习过程愉快而不是紧张`
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
            guidanceHint: parsed.guidanceHint,
            suggestedResponse: parsed.suggestedResponse,
            targetWords: parsed.targetWords || [],
            timestamp: Date.now(),
            nextNodes: new Map() // 初始化为空Map
        };
    } catch (error) {
        console.error('生成冒险故事失败:', error);
        throw error;
    }
}

/**
 * 预生成所有选项的后续节点（并行生成以降低延迟）
 */
export async function pregenerateNextNodes(
    currentNode: StoryNode,
    words: Word[],
    config: AdventureConfig,
    previousNodes: StoryNode[],
    apiKey: string
): Promise<Map<string, StoryNode>> {
    // 只在引导模式且有选项时预生成
    if (config.mode !== GameMode.GUIDED || !currentNode.choices || currentNode.choices.length === 0) {
        return new Map();
    }

    console.log(`开始预生成 ${currentNode.choices.length} 个选项的后续内容...`);
    const startTime = Date.now();

    try {
        // 并行生成所有选项的后续节点
        const generationPromises = currentNode.choices.map(async (choice) => {
            // 模拟玩家选择这个选项的响应
            const mockResponse: PlayerResponse = {
                text: choice.text,
                usedWords: choice.targetWord ? [choice.targetWord] : [],
                timestamp: Date.now()
            };

            try {
                const nextNode = await generateAdventureStory(
                    words,
                    config,
                    [...previousNodes, currentNode],
                    mockResponse,
                    apiKey
                );
                return { choiceId: choice.id, node: nextNode };
            } catch (error) {
                console.error(`预生成选项 ${choice.id} 失败:`, error);
                return null;
            }
        });

        // 等待所有生成完成
        const results = await Promise.all(generationPromises);

        // 构建Map
        const nextNodesMap = new Map<string, StoryNode>();
        results.forEach(result => {
            if (result) {
                nextNodesMap.set(result.choiceId, result.node);
            }
        });

        const endTime = Date.now();
        console.log(`预生成完成！耗时 ${endTime - startTime}ms，成功生成 ${nextNodesMap.size}/${currentNode.choices.length} 个节点`);

        return nextNodesMap;
    } catch (error) {
        console.error('预生成失败:', error);
        return new Map();
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
 * 即时检查用户输入（语法、拼写等）
 */
export async function checkGrammarInstantly(
    input: string,
    apiKey: string
): Promise<{
    hasErrors: boolean;
    suggestions: Array<{
        type: 'grammar' | 'spelling' | 'style';
        message: string;
        suggestion?: string;
    }>;
}> {
    if (!input || input.trim().length < 3) {
        return { hasErrors: false, suggestions: [] };
    }

    const prompt = `作为英语语法检查专家，请快速检查以下句子：

【句子】
${input}

请检查：
1. 语法错误（时态、主谓一致等）
2. 拼写错误
3. 表达是否地道

【输出格式】JSON格式：

{
  "hasErrors": true/false,
  "suggestions": [
    {
      "type": "grammar/spelling/style",
      "message": "简短说明（20字以内）",
      "suggestion": "修改建议（可选）"
    }
  ]
}

如果没有错误，返回空数组。`;

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
                        content: '你是一位专业的英语语法检查专家，能快速发现语法、拼写和表达问题。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.2,
                max_tokens: 300
            })
        });

        if (!response.ok) {
            throw new Error('检查失败');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { hasErrors: false, suggestions: [] };
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('即时检查失败:', error);
        return { hasErrors: false, suggestions: [] };
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
