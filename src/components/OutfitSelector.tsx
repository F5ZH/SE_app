import React, { useState } from 'react';
import { Shirt, Lock, Sparkles } from 'lucide-react';
import { OutfitConfig } from '../types';
import { OUTFITS } from '../data/outfitSystem';
import { getUnlockedOutfits } from '../utils/unlockSystem';
import './OutfitSelector.css';

interface OutfitSelectorProps {
    currentOutfitId: string;
    userLevel: number;
    userAffection: number;
    onSelectOutfit: (outfitId: string) => void;
    onClose: () => void;
}

/**
 * 服装选择器组件
 * 显示所有服装并允许切换
 */
const OutfitSelector: React.FC<OutfitSelectorProps> = ({
    currentOutfitId,
    userLevel,
    userAffection,
    onSelectOutfit,
    onClose
}) => {
    const [selectedOutfit, setSelectedOutfit] = useState<string>(currentOutfitId);

    // 获取已解锁的服装ID列表
    const unlockedOutfitIds = getUnlockedOutfits();

    // 检查服装是否已解锁
    const isOutfitUnlocked = (outfit: OutfitConfig): boolean => {
        return unlockedOutfitIds.includes(outfit.id);
    };

    // 获取稀有度颜色
    const getRarityColor = (rarity: string): string => {
        const colors: Record<string, string> = {
            common: '#9e9e9e',
            rare: '#4fc3f7',
            epic: '#ab47bc',
            legendary: '#ffd700'
        };
        return colors[rarity] || colors.common;
    };

    // 获取稀有度文本
    const getRarityText = (rarity: string): string => {
        const texts: Record<string, string> = {
            common: '普通',
            rare: '稀有',
            epic: '史诗',
            legendary: '传说'
        };
        return texts[rarity] || '普通';
    };

    // 处理选择服装
    const handleSelectOutfit = (outfitId: string) => {
        setSelectedOutfit(outfitId);
    };

    // 确认并应用
    const handleConfirm = () => {
        onSelectOutfit(selectedOutfit);
        onClose();
    };

    return (
        <div className="outfit-selector-overlay" onClick={onClose}>
            <div className="outfit-selector-modal" onClick={(e) => e.stopPropagation()}>
                {/* 标题 */}
                <div className="outfit-selector-header">
                    <div className="header-left">
                        <Shirt size={24} />
                        <h2>服装更衣室</h2>
                    </div>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                {/* 统计信息 */}
                <div className="outfit-stats">
                    <div className="stat-item">
                        <span className="stat-label">已解锁</span>
                        <span className="stat-value">{unlockedOutfitIds.length} / {OUTFITS.length}</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-label">当前等级</span>
                        <span className="stat-value">Lv.{userLevel}</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-label">好感度</span>
                        <span className="stat-value">{userAffection}</span>
                    </div>
                </div>

                {/* 服装列表 */}
                <div className="outfit-grid">
                    {OUTFITS.map(outfit => {
                        const isUnlocked = isOutfitUnlocked(outfit);
                        const isSelected = selectedOutfit === outfit.id;
                        const isCurrent = currentOutfitId === outfit.id;

                        return (
                            <div
                                key={outfit.id}
                                className={`outfit-card ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}`}
                                onClick={() => isUnlocked && handleSelectOutfit(outfit.id)}
                                style={{ '--rarity-color': getRarityColor(outfit.rarity) } as React.CSSProperties}
                            >
                                {/* 稀有度标签 */}
                                <div className="rarity-badge" style={{ background: getRarityColor(outfit.rarity) }}>
                                    {getRarityText(outfit.rarity)}
                                </div>

                                {/* 当前装备标签 */}
                                {isCurrent && (
                                    <div className="current-badge">
                                        <Sparkles size={12} />
                                        <span>当前</span>
                                    </div>
                                )}

                                {/* 服装预览图 */}
                                <div className="outfit-preview">
                                    {isUnlocked ? (
                                        <img src={outfit.previewImage} alt={outfit.name} />
                                    ) : (
                                        <div className="locked-preview">
                                            <Lock size={40} />
                                        </div>
                                    )}
                                </div>

                                {/* 服装信息 */}
                                <div className="outfit-info">
                                    <h3 className="outfit-name">{isUnlocked ? outfit.name : '???'}</h3>
                                    <p className="outfit-description">
                                        {isUnlocked ? outfit.description : '未解锁'}
                                    </p>
                                </div>

                                {/* 解锁条件 */}
                                {!isUnlocked && (
                                    <div className="unlock-condition">
                                        {outfit.unlockCondition.affection !== undefined && (
                                            <span>❤️ {outfit.unlockCondition.affection}</span>
                                        )}
                                        {outfit.unlockCondition.level !== undefined && (
                                            <span>⭐ Lv.{outfit.unlockCondition.level}</span>
                                        )}
                                        {outfit.unlockCondition.achievement && (
                                            <span>🏆 成就解锁</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* 底部按钮 */}
                <div className="outfit-selector-footer">
                    <button className="cancel-button" onClick={onClose}>
                        取消
                    </button>
                    <button
                        className="confirm-button"
                        onClick={handleConfirm}
                        disabled={selectedOutfit === currentOutfitId}
                    >
                        确认更换
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OutfitSelector;
