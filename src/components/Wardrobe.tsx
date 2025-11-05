import React, { useState, useEffect } from 'react';
import { WordMateState, OutfitItem, WardrobeState } from '../types';
import {
    ALL_OUTFITS,
    getStageByLevel,
    getStageDescription,
    RARITY_COLORS,
    RARITY_NAMES,
    getOutfitsByStage
} from '../data/wardrobeSystem';
import './Wardrobe.css';

interface WardrobeProps {
    mate: WordMateState;
    onClose: () => void;
    onOutfitChange: (outfitId: string) => void;
}

/**
 * 橱窗系统组件
 * 展示所有皮肤的解锁状态，支持预览和切换
 */
const Wardrobe: React.FC<WardrobeProps> = ({ mate, onClose, onOutfitChange }) => {
    const [selectedStage, setSelectedStage] = useState<number>(getStageByLevel(mate.level));
    const [previewOutfit, setPreviewOutfit] = useState<string | null>(null);
    const [currentOutfit, setCurrentOutfit] = useState<string>(mate.appearance.outfit);
    const [wardrobeState, setWardrobeState] = useState<WardrobeState>({
        currentOutfit: mate.appearance.outfit,
        unlockedOutfits: [],
        newUnlocks: []
    });

    // 初始化橱窗状态
    useEffect(() => {
        const stored = localStorage.getItem('wardrobe_state');
        if (stored) {
            const state = JSON.parse(stored) as WardrobeState;
            setWardrobeState(state);
        } else {
            // 初始化默认状态
            const defaultState: WardrobeState = {
                currentOutfit: 'default',
                unlockedOutfits: ['default'],
                newUnlocks: []
            };
            setWardrobeState(defaultState);
            localStorage.setItem('wardrobe_state', JSON.stringify(defaultState));
        }
    }, []);

    // 检查皮肤是否已解锁
    const isOutfitUnlocked = (outfit: OutfitItem): boolean => {
        const condition = outfit.unlockCondition;

        switch (condition.type) {
            case 'level':
                return mate.level >= (condition.level || 999);

            case 'affection':
                return mate.affection >= (condition.affection || 999);

            case 'achievement':
                // TODO: 集成成就系统检查
                // 暂时返回false，待成就系统完善后更新
                return false;

            case 'mixed':
                const levelOk = mate.level >= (condition.level || 0);
                const affectionOk = mate.affection >= (condition.affection || 0);
                return levelOk && affectionOk;

            default:
                return false;
        }
    };

    // 获取当前阶段的皮肤列表
    const getCurrentStageOutfits = (): OutfitItem[] => {
        return getOutfitsByStage(selectedStage).map(outfit => ({
            ...outfit,
            unlocked: wardrobeState.unlockedOutfits.includes(outfit.id) || isOutfitUnlocked(outfit)
        }));
    };

    // 获取解锁条件描述
    const getUnlockDescription = (outfit: OutfitItem): string => {
        const condition = outfit.unlockCondition;

        switch (condition.type) {
            case 'level':
                return `等级达到 Lv.${condition.level}`;

            case 'affection':
                return `好感度达到 ${condition.affection}`;

            case 'achievement':
                return `完成成就「${condition.achievementTitle || '???'}」`;

            case 'mixed':
                const parts: string[] = [];
                if (condition.level) parts.push(`Lv.${condition.level}`);
                if (condition.affection) parts.push(`好感度${condition.affection}`);
                return parts.join(' & ');

            default:
                return '未知条件';
        }
    };

    // 切换皮肤
    const handleOutfitChange = (outfitId: string) => {
        const outfit = ALL_OUTFITS.find(o => o.id === outfitId);
        
        // 检查是否解锁
        if (outfit && !isOutfitUnlocked(outfit) && !wardrobeState.unlockedOutfits.includes(outfitId)) {
            alert('该装扮尚未解锁！');
            return;
        }

        // 更新当前装扮
        setCurrentOutfit(outfitId);
        
        // 更新橱窗状态
        const newState: WardrobeState = {
            ...wardrobeState,
            currentOutfit: outfitId,
            newUnlocks: wardrobeState.newUnlocks.filter(id => id !== outfitId)
        };
        setWardrobeState(newState);
        localStorage.setItem('wardrobe_state', JSON.stringify(newState));

        // 通知父组件
        onOutfitChange(outfitId);
        setPreviewOutfit(null);
        
        // 给用户反馈
        console.log('✅ 已切换装扮:', outfitId);
    };

    // 预览皮肤
    const handlePreview = (outfitId: string) => {
        setPreviewOutfit(outfitId);
    };

    // 关闭预览
    const closePreview = () => {
        setPreviewOutfit(null);
    };

    // 获取统计信息
    const getStatistics = () => {
        const unlockedCount = wardrobeState.unlockedOutfits.length;
        const totalCount = ALL_OUTFITS.length + 5; // +5 为5个基础立绘
        const currentStageUnlocked = getCurrentStageOutfits().filter(o => o.unlocked).length;
        const currentStageTotal = getCurrentStageOutfits().length;

        return {
            unlockedCount,
            totalCount,
            currentStageUnlocked,
            currentStageTotal,
            progress: Math.floor((unlockedCount / totalCount) * 100)
        };
    };

    const stats = getStatistics();
    const currentOutfits = getCurrentStageOutfits();
    const previewedOutfit = previewOutfit ? ALL_OUTFITS.find(o => o.id === previewOutfit) : null;

    return (
        <div className="wardrobe-overlay" onClick={onClose}>
            <div className="wardrobe-container" onClick={(e) => e.stopPropagation()}>
                {/* 头部 */}
                <div className="wardrobe-header">
                    <h2>👗 单词姬的橱窗</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {/* 统计信息 */}
                <div className="wardrobe-stats">
                    <div className="stat-item">
                        <span className="stat-label">收集进度</span>
                        <span className="stat-value">{stats.unlockedCount}/{stats.totalCount}</span>
                    </div>
                    <div className="stat-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${stats.progress}%` }}
                            />
                        </div>
                        <span className="progress-text">{stats.progress}%</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">当前阶段</span>
                        <span className="stat-value">{stats.currentStageUnlocked}/{stats.currentStageTotal}</span>
                    </div>
                </div>

                {/* 阶段选择器 */}
                <div className="stage-selector">
                    {[1, 2, 3, 4, 5].map(stage => {
                        const isUnlocked = mate.level >= (stage - 1) * 10 + 1;
                        const isCurrent = stage === selectedStage;
                        return (
                            <button
                                key={stage}
                                className={`stage-btn ${isCurrent ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`}
                                onClick={() => isUnlocked && setSelectedStage(stage)}
                                disabled={!isUnlocked}
                            >
                                <div className="stage-number">阶段 {stage}</div>
                                <div className="stage-desc">
                                    {isUnlocked ? getStageDescription(stage).split(' - ')[1] : '🔒'}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* 皮肤列表 */}
                <div className="outfits-grid">
                    {/* 基础立绘 */}
                    <div className="outfit-card basic-outfit">
                        <div className="outfit-preview">
                            <img
                                src={`/img/${selectedStage}.png`}
                                alt={`阶段${selectedStage}基础`}
                                className="outfit-image"
                            />
                        </div>
                        <div className="outfit-info">
                            <h4 className="outfit-name">基础形态</h4>
                            <p className="outfit-desc">阶段{selectedStage}的基础立绘</p>
                            <span className="rarity-badge" style={{ background: RARITY_COLORS.common }}>
                                {RARITY_NAMES.common}
                            </span>
                        </div>
                        <button
                            className={`wear-btn ${currentOutfit === 'default' ? 'current' : ''}`}
                            onClick={() => handleOutfitChange('default')}
                        >
                            {currentOutfit === 'default' ? '✓ 当前穿戴' : '穿上'}
                        </button>
                    </div>

                    {/* 特殊皮肤 */}
                    {currentOutfits.map(outfit => (
                        <div
                            key={outfit.id}
                            className={`outfit-card ${!outfit.unlocked ? 'locked' : ''} ${wardrobeState.newUnlocks.includes(outfit.id) ? 'new-unlock' : ''
                                }`}
                        >
                            <div className="outfit-preview" onClick={() => outfit.unlocked && handlePreview(outfit.id)}>
                                {outfit.unlocked ? (
                                    <img
                                        src={outfit.imagePath}
                                        alt={outfit.name}
                                        className="outfit-image"
                                    />
                                ) : (
                                    <div className="locked-preview">
                                        <span className="lock-icon">🔒</span>
                                        <div className="silhouette" />
                                    </div>
                                )}
                                {outfit.unlocked && (
                                    <div className="preview-hint">
                                        <span>👁 预览</span>
                                    </div>
                                )}
                            </div>

                            <div className="outfit-info">
                                <h4 className="outfit-name">
                                    {outfit.unlocked ? outfit.name : '???'}
                                    {wardrobeState.newUnlocks.includes(outfit.id) && (
                                        <span className="new-badge">NEW</span>
                                    )}
                                </h4>
                                <p className="outfit-desc">
                                    {outfit.unlocked ? outfit.description : getUnlockDescription(outfit)}
                                </p>
                                <span
                                    className="rarity-badge"
                                    style={{ background: RARITY_COLORS[outfit.rarity] }}
                                >
                                    {RARITY_NAMES[outfit.rarity]}
                                </span>
                            </div>

                            {outfit.unlocked ? (
                                <button
                                    className={`wear-btn ${currentOutfit === outfit.id ? 'current' : ''}`}
                                    onClick={() => handleOutfitChange(outfit.id)}
                                >
                                    {currentOutfit === outfit.id ? '✓ 当前穿戴' : '穿上'}
                                </button>
                            ) : (
                                <div className="unlock-requirement">
                                    {getUnlockDescription(outfit)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* 预览弹窗 */}
                {previewedOutfit && (
                    <div className="preview-modal" onClick={closePreview}>
                        <div className="preview-content" onClick={(e) => e.stopPropagation()}>
                            <button className="preview-close" onClick={closePreview}>✕</button>
                            <img
                                src={previewedOutfit.imagePath}
                                alt={previewedOutfit.name}
                                className="preview-image"
                            />
                            <div className="preview-info">
                                <h3>{previewedOutfit.name}</h3>
                                <p>{previewedOutfit.description}</p>
                                <button
                                    className="preview-wear-btn"
                                    onClick={() => handleOutfitChange(previewedOutfit.id)}
                                >
                                    {currentOutfit === previewedOutfit.id ? '✓ 当前穿戴' : '穿上这套'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wardrobe;
