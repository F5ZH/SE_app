/**
 * 橱窗系统 - 单词姬皮肤配置
 * 
 * 皮肤命名规则: XY.png
 * - X: 阶段 (1-5 对应等级区间 lv1-10, lv11-20, lv21-30, lv31-40, lv41-50)
 * - Y: 皮肤编号 (同阶段内的不同皮肤)
 * 
 * 解锁条件设计理念：
 * - 升级自然解锁：随等级自动获得部分皮肤
 * - 好感度奖励：通过互动、学习提升好感度解锁特殊皮肤
 * - 成就系统：完成特定成就解锁稀有皮肤
 * - 混合条件：部分皮肤需要同时满足多个条件
 */

export interface OutfitItem {
    id: string;                    // 皮肤ID (如 "11", "24")
    name: string;                  // 皮肤名称
    description: string;           // 描述
    imagePath: string;             // 图片路径
    stage: number;                 // 阶段 (1-5)
    outfitNumber: number;          // 同阶段内编号
    rarity: 'common' | 'rare' | 'epic' | 'legendary'; // 稀有度
    unlockCondition: {
        type: 'level' | 'affection' | 'achievement' | 'mixed'; // 解锁类型
        level?: number;            // 需要的等级
        affection?: number;        // 需要的好感度
        achievementId?: string;    // 需要的成就ID
        achievementTitle?: string; // 成就名称（显示用）
    };
    unlocked?: boolean;            // 是否已解锁
    unlockedAt?: number;           // 解锁时间戳
}

// 阶段1皮肤 (Lv1-10) - 初遇阶段
export const STAGE_1_OUTFITS: OutfitItem[] = [
    {
        id: '11',
        name: '校园日常',
        description: '清新的校园制服，充满青春活力',
        imagePath: '/img/11.png',
        stage: 1,
        outfitNumber: 1,
        rarity: 'common',
        unlockCondition: {
            type: 'level',
            level: 3
        }
    },
    {
        id: '12',
        name: '休闲时光',
        description: '舒适的休闲装扮，适合轻松学习',
        imagePath: '/img/12.png',
        stage: 1,
        outfitNumber: 2,
        rarity: 'common',
        unlockCondition: {
            type: 'affection',
            affection: 10
        }
    },
    {
        id: '13',
        name: '运动少女',
        description: '活力四射的运动装，充满朝气',
        imagePath: '/img/13.png',
        stage: 1,
        outfitNumber: 3,
        rarity: 'rare',
        unlockCondition: {
            type: 'achievement',
            achievementId: 'first_week',
            achievementTitle: '初识七日'
        }
    },
    {
        id: '14',
        name: '夏日清凉',
        description: '清爽的夏装，适合炎炎夏日',
        imagePath: '/img/14.png',
        stage: 1,
        outfitNumber: 4,
        rarity: 'rare',
        unlockCondition: {
            type: 'mixed',
            level: 8,
            affection: 20
        }
    }
];

// 阶段2皮肤 (Lv11-20) - 成长阶段
export const STAGE_2_OUTFITS: OutfitItem[] = [
    {
        id: '21',
        name: '知性学姐',
        description: '优雅的学姐装扮，透露出成熟气息',
        imagePath: '/img/21.png',
        stage: 2,
        outfitNumber: 1,
        rarity: 'common',
        unlockCondition: {
            type: 'level',
            level: 13
        }
    },
    {
        id: '22',
        name: '咖啡时光',
        description: '休闲的咖啡厅装扮，文艺气息满满',
        imagePath: '/img/22.png',
        stage: 2,
        outfitNumber: 2,
        rarity: 'rare',
        unlockCondition: {
            type: 'affection',
            affection: 40
        }
    },
    {
        id: '23',
        name: '图书管理员',
        description: '书香气息浓厚的图书馆制服',
        imagePath: '/img/23.png',
        stage: 2,
        outfitNumber: 3,
        rarity: 'epic',
        unlockCondition: {
            type: 'achievement',
            achievementId: 'word_master_100',
            achievementTitle: '词汇达人'
        }
    },
    {
        id: '24',
        name: '春日樱花',
        description: '浪漫的樱花和服，春意盎然',
        imagePath: '/img/24.png',
        stage: 2,
        outfitNumber: 4,
        rarity: 'epic',
        unlockCondition: {
            type: 'mixed',
            level: 18,
            affection: 60
        }
    }
];

// 阶段3皮肤 (Lv21-30) - 精进阶段
export const STAGE_3_OUTFITS: OutfitItem[] = [
    {
        id: '31',
        name: '职场精英',
        description: '干练的职业套装，展现专业风范',
        imagePath: '/img/31.png',
        stage: 3,
        outfitNumber: 1,
        rarity: 'rare',
        unlockCondition: {
            type: 'level',
            level: 23
        }
    },
    {
        id: '32',
        name: '音乐会礼服',
        description: '优雅的礼服装扮，适合正式场合',
        imagePath: '/img/32.png',
        stage: 3,
        outfitNumber: 2,
        rarity: 'epic',
        unlockCondition: {
            type: 'affection',
            affection: 80
        }
    },
    {
        id: '33',
        name: '学术导师',
        description: '学术气息浓厚的导师装扮',
        imagePath: '/img/33.png',
        stage: 3,
        outfitNumber: 3,
        rarity: 'epic',
        unlockCondition: {
            type: 'achievement',
            achievementId: 'word_master_500',
            achievementTitle: '词汇大师'
        }
    },
    {
        id: '34',
        name: '夜空星辰',
        description: '神秘的星空主题装扮，浪漫梦幻',
        imagePath: '/img/34.png',
        stage: 3,
        outfitNumber: 4,
        rarity: 'legendary',
        unlockCondition: {
            type: 'mixed',
            level: 28,
            affection: 100
        }
    }
];

// 阶段4皮肤 (Lv31-40) - 卓越阶段
export const STAGE_4_OUTFITS: OutfitItem[] = [
    {
        id: '41',
        name: '学院教授',
        description: '权威的教授装扮，学识渊博',
        imagePath: '/img/41.png',
        stage: 4,
        outfitNumber: 1,
        rarity: 'rare',
        unlockCondition: {
            type: 'level',
            level: 33
        }
    },
    {
        id: '42',
        name: '旗袍典雅',
        description: '古典优雅的旗袍，东方韵味',
        imagePath: '/img/42.png',
        stage: 4,
        outfitNumber: 2,
        rarity: 'epic',
        unlockCondition: {
            type: 'affection',
            affection: 120
        }
    },
    {
        id: '43',
        name: '魔法学者',
        description: '充满魔幻色彩的学者袍',
        imagePath: '/img/43.png',
        stage: 4,
        outfitNumber: 3,
        rarity: 'epic',
        unlockCondition: {
            type: 'achievement',
            achievementId: 'word_master_1000',
            achievementTitle: '词汇宗师'
        }
    },
    {
        id: '44',
        name: '冰雪女王',
        description: '冰雪主题的华丽装扮',
        imagePath: '/img/44.png',
        stage: 4,
        outfitNumber: 4,
        rarity: 'legendary',
        unlockCondition: {
            type: 'mixed',
            level: 38,
            affection: 140
        }
    },
    {
        id: '45',
        name: '黎明使者',
        description: '象征希望的黎明主题装扮',
        imagePath: '/img/45.png',
        stage: 4,
        outfitNumber: 5,
        rarity: 'legendary',
        unlockCondition: {
            type: 'achievement',
            achievementId: 'perfect_streak_30',
            achievementTitle: '完美连胜'
        }
    }
];

// 阶段5皮肤 (Lv41-50) - 巅峰阶段
export const STAGE_5_OUTFITS: OutfitItem[] = [
    {
        id: '51',
        name: '语言大师',
        description: '象征语言巅峰的大师装扮',
        imagePath: '/img/51.png',
        stage: 5,
        outfitNumber: 1,
        rarity: 'epic',
        unlockCondition: {
            type: 'level',
            level: 43
        }
    },
    {
        id: '52',
        name: '星空歌姬',
        description: '璀璨夺目的舞台装扮',
        imagePath: '/img/52.png',
        stage: 5,
        outfitNumber: 2,
        rarity: 'legendary',
        unlockCondition: {
            type: 'affection',
            affection: 160
        }
    },
    {
        id: '53',
        name: '永恒誓约',
        description: '象征永恒羁绊的婚纱装扮',
        imagePath: '/img/53.png',
        stage: 5,
        outfitNumber: 3,
        rarity: 'legendary',
        unlockCondition: {
            type: 'mixed',
            level: 48,
            affection: 180
        }
    },
    {
        id: '54',
        name: '词汇女神',
        description: '终极形态，词汇学习的化身',
        imagePath: '/img/54.png',
        stage: 5,
        outfitNumber: 4,
        rarity: 'legendary',
        unlockCondition: {
            type: 'mixed',
            level: 50,
            affection: 200
        }
    }
];

// 所有皮肤列表
export const ALL_OUTFITS: OutfitItem[] = [
    ...STAGE_1_OUTFITS,
    ...STAGE_2_OUTFITS,
    ...STAGE_3_OUTFITS,
    ...STAGE_4_OUTFITS,
    ...STAGE_5_OUTFITS
];

// 根据阶段获取皮肤列表
export const getOutfitsByStage = (stage: number): OutfitItem[] => {
    switch (stage) {
        case 1: return STAGE_1_OUTFITS;
        case 2: return STAGE_2_OUTFITS;
        case 3: return STAGE_3_OUTFITS;
        case 4: return STAGE_4_OUTFITS;
        case 5: return STAGE_5_OUTFITS;
        default: return [];
    }
};

// 根据等级获取当前阶段
export const getStageByLevel = (level: number): number => {
    if (level <= 10) return 1;
    if (level <= 20) return 2;
    if (level <= 30) return 3;
    if (level <= 40) return 4;
    return 5;
};

// 根据等级获取阶段描述
export const getStageDescription = (stage: number): string => {
    const descriptions: Record<number, string> = {
        1: '初遇阶段 - 与单词姬的初次相遇',
        2: '成长阶段 - 逐渐成长的学习伙伴',
        3: '精进阶段 - 学识渐深的知心好友',
        4: '卓越阶段 - 卓越非凡的导师挚友',
        5: '巅峰阶段 - 语言学习的至高境界'
    };
    return descriptions[stage] || '未知阶段';
};

// 稀有度对应的颜色
export const RARITY_COLORS: Record<string, string> = {
    common: '#9e9e9e',      // 灰色
    rare: '#2196f3',        // 蓝色
    epic: '#9c27b0',        // 紫色
    legendary: '#ff9800'    // 橙色
};

// 稀有度对应的中文名称
export const RARITY_NAMES: Record<string, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
};
