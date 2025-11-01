import React, { useState, useEffect } from 'react';
import { WordMateState } from '../types';
import { getLevelTier, getLevelTierDescription } from '../data/outfitSystem';
import './MateAvatar.css';

interface MateAvatarProps {
    mate: WordMateState;
    onClick?: () => void;
    showMoodIndicator?: boolean;
    className?: string;
}

/**
 * WordMate 角色立绘组件
 * 根据等级显示对应的角色形象
 */
const MateAvatar: React.FC<MateAvatarProps> = ({
    mate,
    onClick,
    showMoodIndicator = true,
    className = ''
}) => {
    const [imageError, setImageError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // 获取当前等级对应的立绘
    const levelTier = getLevelTier(mate.level);
    const tierDescription = getLevelTierDescription(mate.level);
    const avatarPath = `/assets/mate/base/${levelTier}.png`;

    // 重置加载状态（当等级变化时）
    useEffect(() => {
        setIsLoaded(false);
        setImageError(false);
    }, [levelTier]);

    // 获取心情表情
    const getMoodEmoji = (mood: string): string => {
        const moodMap: Record<string, string> = {
            happy: '😊',
            excited: '🤩',
            normal: '😌',
            tired: '😪',
            sad: '😔',
            angry: '😠'
        };
        return moodMap[mood] || '😊';
    };

    // 图片加载成功
    const handleImageLoad = () => {
        setIsLoaded(true);
    };

    // 图片加载失败，显示占位符
    const handleImageError = () => {
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
                        {levelTier === 'lv1-10' && '👧'}
                        {levelTier === 'lv11-20' && '👩'}
                        {levelTier === 'lv21-30' && '🧑‍🎓'}
                        {levelTier === 'lv31-40' && '👩‍🏫'}
                        {levelTier === 'lv41-50' && '👸'}
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
