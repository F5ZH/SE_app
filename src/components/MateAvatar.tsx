import React, { useState, useEffect } from 'react';
import { WordMateState } from '../types';
import { getStageByLevel } from '../data/wardrobeSystem';
import './MateAvatar.css';

interface MateAvatarProps {
    mate: WordMateState;
    onClick?: () => void;
    showMoodIndicator?: boolean;
    className?: string;
}

/**
 * WordMate 角色立绘组件
 * 根据等级和选择的皮肤显示对应的角色形象
 */
const MateAvatar: React.FC<MateAvatarProps> = ({
    mate,
    onClick,
    showMoodIndicator = true,
    className = ''
}) => {
    const [imageError, setImageError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // 获取当前显示的立绘路径
    const getAvatarPath = (): string => {
        const currentOutfit = mate.appearance.outfit;
        
        // 如果选择了特殊皮肤
        if (currentOutfit && currentOutfit !== 'default') {
            console.log('🎨 使用特殊皮肤:', currentOutfit);
            return `/img/${currentOutfit}.png`;
        }
        
        // 默认使用基础立绘（根据等级阶段）
        const stage = getStageByLevel(mate.level);
        console.log('👤 使用基础立绘 - 等级:', mate.level, '阶段:', stage, '路径:', `/img/${stage}.png`);
        return `/img/${stage}.png`;
    };

    const avatarPath = getAvatarPath();
    const stage = getStageByLevel(mate.level);

    // 获取阶段描述
    const getStageDescription = (): string => {
        switch (stage) {
            case 1: return '初遇阶段 - 天真无邪';
            case 2: return '成长阶段 - 充满活力';
            case 3: return '精进阶段 - 优雅知性';
            case 4: return '卓越阶段 - 专业权威';
            case 5: return '巅峰阶段 - 超凡脱俗';
            default: return '未知阶段';
        }
    };

    const tierDescription = getStageDescription();

    // 重置加载状态（当等级或皮肤变化时）
    useEffect(() => {
        setIsLoaded(false);
        setImageError(false);
    }, [avatarPath]);

    // 获取心情表情
    const getMoodEmoji = (mood: string): string => {
        const moodMap: Record<string, string> = {
            happy: '😊',
            excited: '🤩',
            normal: '😌',
            tired: '😪',
            sad: '😔',
            angry: '😠',
            encouraging: '💪',
            proud: '🌟',
            worried: '😟'
        };
        return moodMap[mood] || '😊';
    };

    // 图片加载成功
    const handleImageLoad = () => {
        console.log('✅ 立绘加载成功:', avatarPath);
        setIsLoaded(true);
    };

    // 图片加载失败，显示占位符
    const handleImageError = () => {
        console.error('❌ 立绘加载失败:', avatarPath);
        setImageError(true);
        setIsLoaded(true);
    };

    return (
        <div
            className={`mate-avatar-container ${className} ${isLoaded ? 'loaded' : ''}`}
            onClick={onClick}
            title={tierDescription}
        >
            {/* 角色立绘 */}
            {!imageError ? (
                <img
                    src={avatarPath}
                    alt={`${mate.name} - ${tierDescription}`}
                    className="mate-avatar-image"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                />
            ) : (
                // 加载失败的占位符
                <div className="avatar-placeholder">
                    <div className="placeholder-icon">
                        {stage === 1 && '👧'}
                        {stage === 2 && '👩'}
                        {stage === 3 && '🧑‍🎓'}
                        {stage === 4 && '👩‍🏫'}
                        {stage === 5 && '👸'}
                    </div>
                    <span className="placeholder-text">{tierDescription}</span>
                </div>
            )}

            {/* 加载动画 */}
            {!isLoaded && (
                <div className="avatar-loading">
                    <div className="loading-spinner"></div>
                </div>
            )}

            {/* 心情指示器 */}
            {showMoodIndicator && isLoaded && (
                <div className="mood-indicator" title={mate.mood}>
                    {getMoodEmoji(mate.mood)}
                </div>
            )}

            {/* 等级标签 */}
            <div className="level-tag">
                <span className="level-number">Lv.{mate.level}</span>
            </div>

            {/* 点击提示 */}
            {onClick && (
                <div className="click-hint">
                    <span>点击互动</span>
                </div>
            )}
        </div>
    );
};

export default MateAvatar;
