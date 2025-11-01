/**
 * 小剧场系统配置
 * 包含服装解锁剧场、里程碑剧场、隐藏剧场
 */

import { StoryScene } from '../types';

// ========== 服装解锁剧场 ==========

export const OUTFIT_STORIES: StoryScene[] = [
    {
        id: 'school_uniform',
        title: '校服的约定',
        type: 'outfit',
        unlockCondition: { outfit: 'school', affection: 20 },
        dialogues: [
            {
                speaker: 'mate',
                text: '呐，这套校服怎么样？',
                emotion: 'happy'
            },
            {
                speaker: 'mate',
                text: '和你一起穿着校服学习，感觉又回到了学生时代呢~',
                emotion: 'excited'
            },
            {
                speaker: 'mate',
                text: '说起来，我们已经一起学了这么多单词了呢！',
                emotion: 'normal'
            },
            {
                speaker: 'mate',
                text: '每天陪你学习，是我最开心的时光💕',
                emotion: 'shy'
            }
        ],
        choices: [
            {
                text: '一起加油吧！',
                affectionChange: 2,
                nextDialogueIndex: 4
            },
            {
                text: '你辛苦了',
                affectionChange: 3,
                nextDialogueIndex: 5
            }
        ],
        rewards: { affection: 5, exp: 50 },
        unlocked: false,
        viewed: false
    },

    {
        id: 'casual_date',
        title: '休息日的约会',
        type: 'outfit',
        unlockCondition: { outfit: 'casual', affection: 50 },
        dialogues: [
            {
                speaker: 'narrator',
                text: '难得的休息日，单词姬换上了轻松的便装...'
            },
            {
                speaker: 'mate',
                text: '今天不学习，陪我出去走走吧？',
                emotion: 'happy'
            },
            {
                speaker: 'mate',
                text: '虽然学习很重要，但偶尔放松一下也很必要哦~',
                emotion: 'excited'
            },
            {
                speaker: 'mate',
                text: '而且...能和你一起度过休息日，我很开心呢',
                emotion: 'shy',
                effect: 'sparkle'
            }
        ],
        rewards: { affection: 8, exp: 80, item: 'date_photo' },
        unlocked: false,
        viewed: false
    },

    {
        id: 'summer_beach',
        title: '海边的回忆',
        type: 'outfit',
        unlockCondition: { outfit: 'summer', affection: 80 },
        dialogues: [
            {
                speaker: 'narrator',
                text: '夏日的海边，阳光、沙滩、海浪...',
                background: 'beach'
            },
            {
                speaker: 'mate',
                text: '好久没来海边了！海风真舒服~',
                emotion: 'excited'
            },
            {
                speaker: 'mate',
                text: '谢谢你陪我来。这个夏天，一定会成为美好的回忆！',
                emotion: 'happy',
                effect: 'sparkle'
            },
            {
                speaker: 'mate',
                text: '（悄悄握住了你的手）',
                emotion: 'shy'
            }
        ],
        choices: [
            {
                text: '（回握她的手）',
                affectionChange: 5,
                unlockAccessory: 'shell_bracelet'
            },
            {
                text: '一起去玩水吧',
                affectionChange: 3
            }
        ],
        rewards: { affection: 10, exp: 100 },
        unlocked: false,
        viewed: false
    },

    {
        id: 'elegant_party',
        title: '星光下的舞会',
        type: 'outfit',
        unlockCondition: { outfit: 'elegant', affection: 100, level: 20 },
        dialogues: [
            {
                speaker: 'narrator',
                text: '在那个星光璀璨的夜晚，单词姬穿上了优雅的礼服...',
                background: 'ballroom',
                effect: 'sparkle'
            },
            {
                speaker: 'mate',
                text: '怎...怎么样？这套礼服适合我吗？',
                emotion: 'shy',
                avatar: 'elegant_shy'
            },
            {
                speaker: 'mate',
                text: '今晚的你，也很帅气呢...（小声）',
                emotion: 'shy'
            },
            {
                speaker: 'mate',
                text: '可以...请你跳支舞吗？',
                emotion: 'shy',
                effect: 'fade'
            }
        ],
        choices: [
            {
                text: '荣幸之至',
                affectionChange: 10,
                unlockAccessory: 'pearl_necklace'
            },
            {
                text: '你今天真美',
                affectionChange: 8
            }
        ],
        rewards: { affection: 15, exp: 150 },
        unlocked: false,
        viewed: false
    },

    {
        id: 'magical_adventure',
        title: '奇幻世界的冒险',
        type: 'outfit',
        unlockCondition: { outfit: 'magical', affection: 150, level: 30 },
        dialogues: [
            {
                speaker: 'narrator',
                text: '魔法的力量在空气中流动...',
                background: 'magical_world',
                effect: 'sparkle'
            },
            {
                speaker: 'mate',
                text: '看！我获得了魔法的力量！',
                emotion: 'excited',
                avatar: 'magical_excited'
            },
            {
                speaker: 'mate',
                text: '有了这份力量，我一定能更好地帮助你学习！',
                emotion: 'happy'
            },
            {
                speaker: 'mate',
                text: '让我们一起在知识的海洋中冒险吧！✨',
                emotion: 'excited',
                effect: 'flash'
            }
        ],
        rewards: { affection: 20, exp: 200, item: 'magic_staff' },
        unlocked: false,
        viewed: false
    },

    {
        id: 'goddess_bond',
        title: '永恒的羁绊',
        type: 'outfit',
        unlockCondition: { outfit: 'goddess', affection: 200, level: 40 },
        dialogues: [
            {
                speaker: 'narrator',
                text: '超越了时间与空间的羁绊...',
                background: 'heaven',
                effect: 'flash'
            },
            {
                speaker: 'mate',
                text: '我们终于走到这一步了...',
                emotion: 'happy',
                avatar: 'goddess_emotional'
            },
            {
                speaker: 'mate',
                text: '从最初的相遇，到现在的羁绊...',
                emotion: 'normal'
            },
            {
                speaker: 'mate',
                text: '无论未来如何，我都会一直陪在你身边。',
                emotion: 'excited'
            },
            {
                speaker: 'mate',
                text: '这是...我们永恒的约定💕',
                emotion: 'shy',
                effect: 'sparkle'
            }
        ],
        rewards: { affection: 30, exp: 300, item: 'goddess_blessing' },
        unlocked: false,
        viewed: false
    },

    {
        id: 'wedding_ending',
        title: '纯白的誓言',
        type: 'outfit',
        unlockCondition: { outfit: 'bride', affection: 200, level: 50 },
        dialogues: [
            {
                speaker: 'narrator',
                text: '在这个特别的日子，她穿上了纯白的婚纱...',
                background: 'wedding',
                effect: 'sparkle'
            },
            {
                speaker: 'mate',
                text: '从相遇到现在，我们一起经历了这么多...',
                emotion: 'happy',
                avatar: 'bride_happy'
            },
            {
                speaker: 'mate',
                text: '谢谢你一直陪伴着我，让我每一天都充满幸福...',
                emotion: 'shy'
            },
            {
                speaker: 'mate',
                text: '现在，请接受我最真挚的誓言——',
                emotion: 'excited'
            },
            {
                speaker: 'mate',
                text: '无论何时何地，我都会永远爱你💕',
                emotion: 'shy',
                effect: 'flash'
            },
            {
                speaker: 'narrator',
                text: '【真结局：永恒的约定】已达成！',
                effect: 'sparkle'
            }
        ],
        rewards: { affection: 50, exp: 500, item: 'wedding_ring', outfit: 'special_wedding' },
        unlocked: false,
        viewed: false
    }
];

// ========== 里程碑剧场 ==========

export const MILESTONE_STORIES: StoryScene[] = [
    {
        id: 'first_meeting',
        title: '初次相遇',
        type: 'milestone',
        unlockCondition: { affection: 10, level: 1 },
        dialogues: [
            {
                speaker: 'mate',
                text: '你好！我是单词姬，从今天开始，我会陪你一起学习~',
                emotion: 'happy'
            },
            {
                speaker: 'mate',
                text: '虽然才刚认识，但我会努力成为你最好的学习伙伴！',
                emotion: 'excited'
            },
            {
                speaker: 'mate',
                text: '一起加油吧！💪',
                emotion: 'happy'
            }
        ],
        rewards: { affection: 3, exp: 30 },
        unlocked: false,
        viewed: false
    },

    {
        id: 'trusted_partner',
        title: '信赖的伙伴',
        type: 'milestone',
        unlockCondition: { affection: 50, level: 15 },
        dialogues: [
            {
                speaker: 'mate',
                text: '不知不觉，我们已经一起走过这么久了...',
                emotion: 'happy'
            },
            {
                speaker: 'mate',
                text: '谢谢你一直陪在我身边。有你在，学习变得不再枯燥✨',
                emotion: 'excited'
            },
            {
                speaker: 'mate',
                text: '希望以后也能一直这样，一起学习，一起成长！',
                emotion: 'happy'
            }
        ],
        rewards: { affection: 10, exp: 100 },
        unlocked: false,
        viewed: false
    },

    {
        id: 'soul_mate',
        title: '心有灵犀',
        type: 'milestone',
        unlockCondition: { affection: 150, level: 35 },
        dialogues: [
            {
                speaker: 'mate',
                text: '现在的我们，即使不说话也能明白对方在想什么呢~',
                emotion: 'happy'
            },
            {
                speaker: 'mate',
                text: '这种感觉...就像命中注定的相遇💕',
                emotion: 'shy'
            },
            {
                speaker: 'mate',
                text: '能遇见你，真是太好了...',
                emotion: 'happy',
                effect: 'sparkle'
            }
        ],
        choices: [
            {
                text: '我也这么觉得',
                affectionChange: 5
            },
            {
                text: '（牵起她的手）',
                affectionChange: 8,
                unlockAccessory: 'promise_ring'
            }
        ],
        rewards: { affection: 15, exp: 200 },
        unlocked: false,
        viewed: false
    }
];

// ========== 隐藏剧场 ==========

export const HIDDEN_STORIES: StoryScene[] = [
    {
        id: 'midnight_study',
        title: '深夜的陪伴',
        type: 'hidden',
        unlockCondition: { special: 'study_after_midnight', affection: 60 },
        dialogues: [
            {
                speaker: 'mate',
                text: '这么晚了还在学习...你真是努力呢',
                emotion: 'surprised',
                background: 'night_room'
            },
            {
                speaker: 'mate',
                text: '不过也要注意休息哦。熬夜对身体不好的~',
                emotion: 'normal'
            },
            {
                speaker: 'mate',
                text: '放心吧，无论多晚，我都会陪着你的💕',
                emotion: 'happy'
            }
        ],
        rewards: { affection: 8, exp: 80, item: 'night_coffee' },
        unlocked: false,
        viewed: false
    },

    {
        id: 'rainy_day',
        title: '雨天的约定',
        type: 'hidden',
        unlockCondition: { special: 'rainy_day_checkin', affection: 80 },
        dialogues: [
            {
                speaker: 'mate',
                text: '外面下雨了呢...但你还是坚持来学习',
                emotion: 'surprised',
                background: 'rainy'
            },
            {
                speaker: 'mate',
                text: '这样坚持不懈的你，真的很帅气呢💕',
                emotion: 'shy'
            },
            {
                speaker: 'mate',
                text: '作为奖励，今天我会格外认真地陪你学习的！',
                emotion: 'excited'
            }
        ],
        rewards: { affection: 10, exp: 100, item: 'rainbow_umbrella' },
        unlocked: false,
        viewed: false
    },

    {
        id: 'perfect_score',
        title: '完美答题',
        type: 'hidden',
        unlockCondition: { special: 'perfect_study_session', level: 25 },
        dialogues: [
            {
                speaker: 'mate',
                text: '全对了！你真是太厉害了！✨',
                emotion: 'excited',
                effect: 'sparkle'
            },
            {
                speaker: 'mate',
                text: '看到你的进步，我比谁都开心~',
                emotion: 'happy'
            },
            {
                speaker: 'mate',
                text: '继续保持这个状态，我们一定能走得更远！',
                emotion: 'excited'
            }
        ],
        rewards: { affection: 12, exp: 120 },
        unlocked: false,
        viewed: false
    },

    {
        id: 'birthday',
        title: '特别的日子',
        type: 'special',
        unlockCondition: { special: 'user_birthday' },
        dialogues: [
            {
                speaker: 'mate',
                text: '生日快乐！🎉',
                emotion: 'excited',
                effect: 'flash',
                background: 'party'
            },
            {
                speaker: 'mate',
                text: '这是我特意为你准备的...希望你喜欢💝',
                emotion: 'shy'
            },
            {
                speaker: 'mate',
                text: '今天是你的特别日子，让我好好陪你度过吧！',
                emotion: 'happy'
            }
        ],
        rewards: { affection: 20, exp: 200, item: 'birthday_gift' },
        unlocked: false,
        viewed: false
    }
];

// ========== 工具函数 ==========

/**
 * 获取所有剧场
 */
export const getAllStories = (): StoryScene[] => {
    return [...OUTFIT_STORIES, ...MILESTONE_STORIES, ...HIDDEN_STORIES];
};

/**
 * 根据ID获取剧场
 */
export const getStoryById = (id: string): StoryScene | undefined => {
    return getAllStories().find(story => story.id === id);
};
