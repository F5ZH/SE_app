import { Dialogue, InteractionType, WordMateMood } from '../types';

/**
 * WordMate 对话数据库
 * 包含各种场景下的对话内容
 */

export const DIALOGUES: Dialogue[] = [
    // ========== 问候对话 ==========
    {
        id: 'greeting_morning_1',
        type: InteractionType.GREETING,
        mood: WordMateMood.HAPPY,
        text: '早上好呀！新的一天又开始了，今天也要加油背单词哦~ ☀️'
    },
    {
        id: 'greeting_morning_2',
        type: InteractionType.GREETING,
        mood: WordMateMood.EXCITED,
        text: '早安！看到你元气满满的样子，我也充满干劲了呢！✨',
        requiredAffection: 20
    },
    {
        id: 'greeting_afternoon_1',
        type: InteractionType.GREETING,
        mood: WordMateMood.NORMAL,
        text: '下午好~休息得怎么样？要不要一起学习单词放松一下？📚'
    },
    {
        id: 'greeting_evening_1',
        type: InteractionType.GREETING,
        mood: WordMateMood.TIRED,
        text: '晚上好...今天辛苦啦！不过睡前复习一下单词会记得更牢哦~ 🌙'
    },
    {
        id: 'greeting_night_1',
        type: InteractionType.GREETING,
        mood: WordMateMood.WORRIED,
        text: '这么晚了还在学习吗？注意休息哦，身体最重要！明天继续加油~ 💤'
    },

    // ========== 开始学习 ==========
    {
        id: 'study_start_1',
        type: InteractionType.STUDY_START,
        mood: WordMateMood.ENCOURAGING,
        text: '太好了！让我们一起努力吧！我会一直陪着你的~ 💪'
    },
    {
        id: 'study_start_2',
        type: InteractionType.STUDY_START,
        mood: WordMateMood.EXCITED,
        text: '耶！又可以一起学习了！我最喜欢和你一起的时光了~ ❤️',
        requiredAffection: 30
    },
    {
        id: 'study_start_3',
        type: InteractionType.STUDY_START,
        mood: WordMateMood.HAPPY,
        text: '嘿嘿，准备好了吗？今天的单词一定难不倒你！加油~ ✨',
        requiredLevel: 5
    },
    {
        id: 'study_start_adventure',
        type: InteractionType.STUDY_START,
        mood: WordMateMood.EXCITED,
        text: '冒险开始！这次的故事一定会很精彩，期待你的表现哦~ 🗺️',
        requiredLevel: 3
    },

    // ========== 完成学习 ==========
    {
        id: 'study_complete_1',
        type: InteractionType.STUDY_COMPLETE,
        mood: WordMateMood.PROUD,
        text: '太棒了！你今天表现得真好！继续保持这个状态~ 🎉'
    },
    {
        id: 'study_complete_2',
        type: InteractionType.STUDY_COMPLETE,
        mood: WordMateMood.HAPPY,
        text: '完成啦！看到你认真学习的样子，我也很开心呢~ 😊',
        requiredAffection: 20
    },
    {
        id: 'study_complete_3',
        type: InteractionType.STUDY_COMPLETE,
        mood: WordMateMood.PROUD,
        text: '哇！又进步了！和你在一起，每一天都能看到成长~ 🌟',
        requiredAffection: 40
    },
    {
        id: 'study_complete_4',
        type: InteractionType.STUDY_COMPLETE,
        mood: WordMateMood.EXCITED,
        text: '你真是太厉害了！这个进度简直惊人！我为你感到骄傲~ 🏆',
        requiredLevel: 10,
        requiredAffection: 50
    },

    // ========== 掌握单词 ==========
    {
        id: 'word_mastered_1',
        type: InteractionType.WORD_MASTERED,
        mood: WordMateMood.HAPPY,
        text: '又掌握一个单词！你的词汇量越来越丰富了~ 📖'
    },
    {
        id: 'word_mastered_2',
        type: InteractionType.WORD_MASTERED,
        mood: WordMateMood.PROUD,
        text: '太好了！看着你一点点进步，我也跟着开心~ ✨'
    },
    {
        id: 'word_mastered_3',
        type: InteractionType.WORD_MASTERED,
        mood: WordMateMood.ENCOURAGING,
        text: '继续加油！每一个单词都是通向目标的阶梯~ 🎯',
        requiredLevel: 5
    },

    // ========== 完成故事 ==========
    {
        id: 'story_complete_1',
        type: InteractionType.STORY_COMPLETE,
        mood: WordMateMood.EXCITED,
        text: '故事结束了~这个故事里的单词你都记住了吗？很有趣吧！📚'
    },
    {
        id: 'story_complete_2',
        type: InteractionType.STORY_COMPLETE,
        mood: WordMateMood.HAPPY,
        text: '好精彩的故事！在故事中学习单词，是不是比死记硬背有趣多了？✨',
        requiredAffection: 30
    },
    {
        id: 'story_complete_3',
        type: InteractionType.STORY_COMPLETE,
        mood: WordMateMood.PROUD,
        text: '你对故事的理解力真强！我都被你的表现打动了~ 💕',
        requiredLevel: 8,
        requiredAffection: 40
    },

    // ========== 完成冒险 ==========
    {
        id: 'adventure_complete_1',
        type: InteractionType.ADVENTURE_COMPLETE,
        mood: WordMateMood.EXCITED,
        text: '冒险成功！你在旅途中的表现太出色了！🗺️✨'
    },
    {
        id: 'adventure_complete_2',
        type: InteractionType.ADVENTURE_COMPLETE,
        mood: WordMateMood.PROUD,
        text: '太厉害了！这次冒险你运用单词的能力让我刮目相看！🏆',
        requiredAffection: 40
    },
    {
        id: 'adventure_complete_3',
        type: InteractionType.ADVENTURE_COMPLETE,
        mood: WordMateMood.HAPPY,
        text: '完美的冒险！和你一起经历这些故事，我也学到了很多呢~ 🎭',
        requiredLevel: 10,
        requiredAffection: 50
    },

    // ========== 里程碑 ==========
    {
        id: 'milestone_words_10',
        type: InteractionType.MILESTONE,
        mood: WordMateMood.EXCITED,
        text: '已经学了 10 个单词了！这只是个开始，未来的路还很长哦~ 🌱'
    },
    {
        id: 'milestone_words_50',
        type: InteractionType.MILESTONE,
        mood: WordMateMood.PROUD,
        text: '50 个单词达成！你的坚持让我很感动，让我们继续前进吧！✨'
    },
    {
        id: 'milestone_words_100',
        type: InteractionType.MILESTONE,
        mood: WordMateMood.EXCITED,
        text: '哇！100 个单词！这是个了不起的成就！我为你感到骄傲~ 🏆'
    },
    {
        id: 'milestone_level_5',
        type: InteractionType.MILESTONE,
        mood: WordMateMood.HAPPY,
        text: '我升到 5 级了！谢谢你一直陪伴我成长~ 💕'
    },
    {
        id: 'milestone_level_10',
        type: InteractionType.MILESTONE,
        mood: WordMateMood.PROUD,
        text: '10 级啦！和你在一起的日子，我变得越来越强大了！🌟'
    },
    {
        id: 'milestone_affection_50',
        type: InteractionType.MILESTONE,
        mood: WordMateMood.HAPPY,
        text: '我们的羁绊越来越深了呢...能和你成为知己，我真的很开心~ ❤️'
    },

    // ========== 每日打卡 ==========
    {
        id: 'checkin_1',
        type: InteractionType.DAILY_CHECKIN,
        mood: WordMateMood.HAPPY,
        text: '今天也来报到了！你的坚持真让人敬佩~ ⭐'
    },
    {
        id: 'checkin_consecutive_3',
        type: InteractionType.DAILY_CHECKIN,
        mood: WordMateMood.ENCOURAGING,
        text: '连续 3 天打卡！保持这个节奏，你一定能达成目标！🔥'
    },
    {
        id: 'checkin_consecutive_7',
        type: InteractionType.DAILY_CHECKIN,
        mood: WordMateMood.EXCITED,
        text: '连续一周打卡！你的毅力真是太强了！让我们创造更长的记录吧！🌟'
    },
    {
        id: 'checkin_consecutive_30',
        type: InteractionType.DAILY_CHECKIN,
        mood: WordMateMood.PROUD,
        text: '整整一个月！你的坚持让我深深感动...能陪你走到这里，是我最大的幸福~ 💕'
    },

    // ========== 鼓励语（用户学习状态不佳时） ==========
    {
        id: 'encourage_mistake_1',
        type: InteractionType.STUDY_START,
        mood: WordMateMood.ENCOURAGING,
        text: '没关系的！错误是学习的一部分，重要的是坚持下去~ 💪'
    },
    {
        id: 'encourage_mistake_2',
        type: InteractionType.STUDY_START,
        mood: WordMateMood.ENCOURAGING,
        text: '不要气馁！每个人都会遇到困难，我会一直陪着你的！加油~ ✨',
        requiredAffection: 30
    },
    {
        id: 'encourage_long_break',
        type: InteractionType.GREETING,
        mood: WordMateMood.WORRIED,
        text: '好久不见了...我一直在等你呢。不管什么时候，我都会在这里支持你！💕',
        requiredAffection: 40
    }
];

/**
 * 根据条件筛选合适的对话
 */
export const getDialogue = (
    type: InteractionType,
    level: number,
    affection: number,
    mood?: WordMateMood
): Dialogue => {
    // 筛选符合条件的对话
    const candidates = DIALOGUES.filter(d => {
        if (d.type !== type) return false;
        if (d.requiredLevel && level < d.requiredLevel) return false;
        if (d.requiredAffection && affection < d.requiredAffection) return false;
        if (mood && d.mood !== mood) return false;
        return true;
    });

    // 如果没有符合条件的，放宽条件（只匹配类型）
    if (candidates.length === 0) {
        const fallback = DIALOGUES.filter(d => d.type === type);
        return fallback[Math.floor(Math.random() * fallback.length)];
    }

    // 随机返回一个符合条件的对话
    return candidates[Math.floor(Math.random() * candidates.length)];
};

/**
 * 根据时间获取问候语
 */
export const getGreetingByTime = (level: number, affection: number): Dialogue => {
    const hour = new Date().getHours();
    let timeType = 'morning';

    if (hour >= 5 && hour < 12) {
        timeType = 'morning';
    } else if (hour >= 12 && hour < 18) {
        timeType = 'afternoon';
    } else if (hour >= 18 && hour < 22) {
        timeType = 'evening';
    } else {
        timeType = 'night';
    }

    // 筛选符合时间段的问候语
    const greetings = DIALOGUES.filter(d =>
        d.type === InteractionType.GREETING &&
        d.id.includes(timeType) &&
        (!d.requiredLevel || level >= d.requiredLevel) &&
        (!d.requiredAffection || affection >= d.requiredAffection)
    );

    if (greetings.length > 0) {
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // 备用问候语
    return DIALOGUES.find(d => d.id === 'greeting_morning_1')!;
};
