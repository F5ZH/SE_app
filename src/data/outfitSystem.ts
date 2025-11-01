/**
 * 服装系统配置
 * 根据好感度、等级、成就解锁不同服装
 */

import { OutfitConfig, AccessoryConfig } from '../types';

// ========== 服装配置 ==========

export const OUTFITS: OutfitConfig[] = [
  // === 基础服装（主要看好感度）===
  {
    id: 'default',
    name: '日常装',
    description: '最初相遇时的装扮，简约而温馨',
    rarity: 'common',
    unlockCondition: { affection: 0, level: 1 },
    previewImage: '/assets/mate/outfits/default.png',
  },
  {
    id: 'school',
    name: '校服',
    description: '学生时代的标准装扮，充满青春气息',
    rarity: 'common',
    unlockCondition: { affection: 20, level: 1 },
    storyId: 'school_uniform',
    previewImage: '/assets/mate/outfits/school.png',
  },
  {
    id: 'casual',
    name: '休闲装',
    description: '周末约会的轻松装扮',
    rarity: 'rare',
    unlockCondition: { affection: 50, level: 1 },
    storyId: 'casual_date',
    previewImage: '/assets/mate/outfits/casual.png',
  },
  {
    id: 'summer',
    name: '夏日装',
    description: '清爽的夏日服装，带着海风的味道',
    rarity: 'rare',
    unlockCondition: { affection: 80, level: 1 },
    storyId: 'summer_beach',
    previewImage: '/assets/mate/outfits/summer.png',
  },
  
  // === 高级服装（好感度 + 等级双重要求）===
  {
    id: 'elegant',
    name: '优雅礼服',
    description: '适合参加重要宴会的华丽礼服',
    rarity: 'epic',
    unlockCondition: { affection: 100, level: 20 },
    storyId: 'elegant_party',
    previewImage: '/assets/mate/outfits/elegant.png',
  },
  {
    id: 'knight',
    name: '骑士装',
    description: '守护誓言的象征，英姿飒爽',
    rarity: 'epic',
    unlockCondition: { affection: 120, level: 25 },
    storyId: 'knight_oath',
    previewImage: '/assets/mate/outfits/knight.png',
  },
  {
    id: 'magical',
    name: '魔法装',
    description: '充满魔力的奇幻服装',
    rarity: 'epic',
    unlockCondition: { affection: 150, level: 30 },
    storyId: 'magical_adventure',
    previewImage: '/assets/mate/outfits/magical.png',
  },
  
  // === 传说服装（极高要求）===
  {
    id: 'goddess',
    name: '女神装',
    description: '超凡脱俗的神圣服装，象征永恒的羁绊',
    rarity: 'legendary',
    unlockCondition: { affection: 200, level: 40 },
    storyId: 'goddess_bond',
    previewImage: '/assets/mate/outfits/goddess.png',
  },
  {
    id: 'bride',
    name: '新娘礼服',
    description: '最珍贵的承诺，纯白的誓言',
    rarity: 'legendary',
    unlockCondition: { affection: 200, level: 50 },
    storyId: 'wedding_ending',
    previewImage: '/assets/mate/outfits/bride.png',
  },
  
  // === 特殊服装（成就解锁）===
  {
    id: 'scholar',
    name: '学者装',
    description: '知识的力量，智慧的象征',
    rarity: 'epic',
    unlockCondition: { achievement: 'words_learned_diamond' },
    storyId: 'scholar_path',
    previewImage: '/assets/mate/outfits/scholar.png',
  },
  {
    id: 'explorer',
    name: '探险装',
    description: '冒险者的荣耀，勇气的证明',
    rarity: 'epic',
    unlockCondition: { achievement: 'adventures_gold' },
    storyId: 'explorer_tale',
    previewImage: '/assets/mate/outfits/explorer.png',
  },
];

// ========== 配饰配置 ==========

export const ACCESSORIES: AccessoryConfig[] = [
  // === 基础配饰 ===
  {
    id: 'ribbon-red',
    name: '红色蝴蝶结',
    description: '可爱的红色蝴蝶结',
    position: 'hair',
    unlockCondition: { affection: 30 },
    previewImage: '/assets/mate/accessories/ribbon-red.png',
  },
  {
    id: 'ribbon-blue',
    name: '蓝色蝴蝶结',
    description: '优雅的蓝色蝴蝶结',
    position: 'hair',
    unlockCondition: { affection: 60 },
    previewImage: '/assets/mate/accessories/ribbon-blue.png',
  },
  
  // === 成就配饰 ===
  {
    id: 'glasses',
    name: '学者眼镜',
    description: '知识的象征',
    position: 'face',
    unlockCondition: { achievement: 'words_learned_gold' },
    previewImage: '/assets/mate/accessories/glasses.png',
  },
  {
    id: 'headband',
    name: '运动发带',
    description: '充满活力',
    position: 'hair',
    unlockCondition: { achievement: 'consecutive_days_silver' },
    previewImage: '/assets/mate/accessories/headband.png',
  },
  
  // === 高级配饰 ===
  {
    id: 'crown',
    name: '胜利之冠',
    description: '达到最高等级的荣耀',
    position: 'head',
    unlockCondition: { level: 50 },
    previewImage: '/assets/mate/accessories/crown.png',
  },
  {
    id: 'wings',
    name: '天使之翼',
    description: '完成所有成就的奖励',
    position: 'back',
    unlockCondition: { special: 'all_achievements' },
    previewImage: '/assets/mate/accessories/wings.png',
  },
  {
    id: 'halo',
    name: '圣光光环',
    description: '满好感度的证明',
    position: 'head',
    unlockCondition: { affection: 200 },
    previewImage: '/assets/mate/accessories/halo.png',
  },
  {
    id: 'ring',
    name: '誓约之戒',
    description: '永恒的承诺',
    position: 'hand',
    unlockCondition: { outfit: 'bride', affection: 200, level: 50 },
    previewImage: '/assets/mate/accessories/ring.png',
  },
];

// ========== 工具函数 ==========

/**
 * 获取等级对应的基础立绘
 */
export const getLevelTier = (level: number): string => {
  if (level <= 10) return 'lv1-10';
  if (level <= 20) return 'lv11-20';
  if (level <= 35) return 'lv21-35';
  return 'lv36-50';
};

/**
 * 获取等级阶段的描述
 */
export const getLevelTierDescription = (level: number): string => {
  if (level <= 10) return '幼女形态 - 天真无邪';
  if (level <= 20) return '少女形态 - 充满活力';
  if (level <= 35) return '成熟形态 - 优雅知性';
  return '女神形态 - 超凡脱俗';
};

/**
 * 获取稀有度对应的标签
 */
export const getRarityLabel = (rarity: string): string => {
  const labels: Record<string, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  };
  return labels[rarity] || rarity;
};

/**
 * 获取稀有度对应的颜色
 */
export const getRarityColor = (rarity: string): string => {
  const colors: Record<string, string> = {
    common: '#9e9e9e',
    rare: '#4caf50',
    epic: '#9c27b0',
    legendary: '#ff9800'
  };
  return colors[rarity] || '#9e9e9e';
};
