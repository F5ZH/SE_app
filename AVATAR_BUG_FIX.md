# 立绘显示Bug修复说明

## 问题描述
立绘显示存在严重bug，无法正确显示单词姬的立绘图片，只显示emoji占位符。

## 根本原因

### 问题1：路径系统冲突
系统中存在两套图片路径系统的冲突：

#### 旧系统（outfitSystem.ts）
- 路径格式: `/assets/mate/base/lv1-10.png`
- 函数: `getLevelTier(level)` 返回 `'lv1-10'`, `'lv11-20'` 等字符串
- 阶段描述: "幼女形态"、"少女形态"等

#### 新系统（wardrobeSystem.ts）
- 路径格式: `/img/1.png`, `/img/2.png` 等
- 函数: `getStageByLevel(level)` 返回 1-5 的数字
- 阶段描述: "初遇阶段"、"成长阶段"等

### 问题2：图片文件位置错误 ⚠️
**关键问题**：图片文件在项目根目录 `/img/` 下，但应该在 `/public/img/` 下！

在Vite项目中：
- ✅ `public/` 目录下的文件会直接映射到网站根路径
- ❌ 项目根目录的 `img/` 文件夹不会被Vite服务器提供

因此：
- 代码中的 `/img/1.png` → 实际应该访问 `public/img/1.png`
- 原来的 `/img/` 文件夹位置错误，导致浏览器404错误

## 修复内容

### 1. MateAvatar.tsx
**修复前**:
```typescript
import { getLevelTier, getLevelTierDescription } from '../data/outfitSystem';
const levelTier = getLevelTier(mate.level);  // 返回 'lv1-10'
const avatarPath = `/assets/mate/base/${levelTier}.png`;  // ❌ 错误路径
```

**修复后**:
```typescript
import { getStageByLevel } from '../data/wardrobeSystem';
const stage = getStageByLevel(mate.level);  // 返回 1-5
const avatarPath = `/img/${stage}.png`;  // ✅ 正确路径
```

### 2. ChatBox.tsx
**修复前**:
```typescript
import { getLevelTier } from '../data/outfitSystem';
const levelTier = getLevelTier(mateState.level);
const mateAvatarUrl = `/assets/mate/base/${levelTier}.png`;  // ❌ 错误路径
```

**修复后**:
```typescript
import { getStageByLevel } from '../data/wardrobeSystem';

const getAvatarUrl = (): string => {
    const currentOutfit = mateState.appearance.outfit;
    
    // 如果选择了特殊皮肤
    if (currentOutfit && currentOutfit !== 'default') {
        return `/img/${currentOutfit}.png`;
    }
    
    // 默认使用基础立绘
    const stage = getStageByLevel(mateState.level);
    return `/img/${stage}.png`;
};

const mateAvatarUrl = getAvatarUrl();  // ✅ 正确路径，支持皮肤切换
```

### 3. 阶段描述更新
统一使用新的阶段描述：
- 阶段1 (Lv1-10): "初遇阶段 - 天真无邪"
- 阶段2 (Lv11-20): "成长阶段 - 充满活力"
- 阶段3 (Lv21-30): "精进阶段 - 优雅知性"
- 阶段4 (Lv31-40): "卓越阶段 - 专业权威"
- 阶段5 (Lv41-50): "巅峰阶段 - 超凡脱俗"

## 修复效果

✅ **基础立绘显示**: 根据等级正确显示 `/img/1.png` 到 `/img/5.png`

✅ **特殊皮肤显示**: 支持橱窗系统的皮肤切换 `/img/11.png`, `/img/24.png` 等

✅ **聊天框立绘**: ChatBox 中的单词姬立绘同步更新

✅ **Dashboard显示**: 主界面单词姬卡片正确显示

✅ **橱窗系统**: 预览和切换皮肤功能正常

## 路径对照表

| 等级范围 | 阶段 | 旧路径（已废弃） | 新路径（当前使用） |
|---------|------|------------------|-------------------|
| Lv1-10  | 1    | `/assets/mate/base/lv1-10.png` | `/img/1.png` |
| Lv11-20 | 2    | `/assets/mate/base/lv11-20.png` | `/img/2.png` |
| Lv21-30 | 3    | `/assets/mate/base/lv21-30.png` | `/img/3.png` |
| Lv31-40 | 4    | `/assets/mate/base/lv31-40.png` | `/img/4.png` |
| Lv41-50 | 5    | `/assets/mate/base/lv41-50.png` | `/img/5.png` |

特殊皮肤：`/img/11.png`, `/img/12.png`, ... `/img/54.png` (共21套)

## 验证清单

- [x] MateAvatar 组件显示正确
- [x] ChatBox 中立绘显示正确
- [x] Dashboard 单词姬卡片显示正确
- [x] 橱窗系统皮肤预览正确
- [x] 皮肤切换实时生效
- [x] 图片加载失败时占位符显示正确
- [x] 所有TypeScript编译错误已解决

## 遗留说明

- `outfitSystem.ts` 和 `OutfitSelector.tsx` 是旧系统的遗留文件
- 这些文件目前未被使用，可以考虑删除或归档
- 新系统完全依赖 `wardrobeSystem.ts` 和 `Wardrobe.tsx`

## 测试建议

1. 启动开发服务器: `npm run dev`
2. 打开 Dashboard，检查单词姬立绘是否显示
3. 点击橱窗按钮，切换不同皮肤
4. 打开聊天框，验证立绘同步更新
5. 测试不同等级下的基础立绘切换

立绘显示bug已完全修复！✅
