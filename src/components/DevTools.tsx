import React, { useState } from 'react';
import { Settings, Calendar, Trash2, Clock, RefreshCw, BarChart3, Download, Heart, Star, Zap, Award, AlertTriangle } from 'lucide-react';
import { studyRecordStorage, checkInStorage } from '../utils/storage';
import { getMateState, addAffection, addExp, updateStats, resetMateData, getAchievements } from '../utils/wordMate';
import './DevTools.css';

interface DevToolsProps {
    onRefresh?: () => void;
}

/**
 * 开发者工具组件
 * 提供调试和测试功能
 */
const DevTools: React.FC<DevToolsProps> = ({ onRefresh }) => {
    const [isOpen, setIsOpen] = useState(false);

    /**
     * 快速进入下一天
     * 通过修改所有学习记录的时间戳来模拟时间流逝
     */
    const handleNextDay = () => {
        const confirmed = window.confirm(
            '确定要快速进入下一天吗？\n\n这将:\n1. 将所有学习记录的时间向前推进1天\n2. 将打卡记录也向前推进1天\n3. 刷新页面数据\n\n注意：此操作不可撤销！'
        );

        if (!confirmed) return;

        try {
            const records = studyRecordStorage.getAll();
            const checkIns = checkInStorage.getAll();
            const oneDayInMs = 24 * 60 * 60 * 1000;

            // 将所有学习记录的时间向前推进一天
            records.forEach(record => {
                record.lastReviewed -= oneDayInMs;
                record.nextReview -= oneDayInMs;
                studyRecordStorage.save(record);
            });

            // 将所有打卡记录的日期向前推进一天
            const updatedCheckIns = checkIns.map(checkIn => {
                const date = new Date(checkIn.date);
                date.setDate(date.getDate() - 1); // 向前推1天
                return {
                    ...checkIn,
                    date: date.toISOString().split('T')[0],
                    timestamp: checkIn.timestamp - oneDayInMs
                };
            });

            // 保存更新后的打卡记录
            localStorage.setItem('vocabulary_app_check_in', JSON.stringify(updatedCheckIns));

            alert('已成功进入下一天！\n\n所有学习记录和打卡记录已更新。');

            // 刷新页面数据
            if (onRefresh) {
                onRefresh();
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('快速进入下一天失败:', error);
            alert('操作失败，请查看控制台了解详情。');
        }
    };

    /**
     * 快速跳转N天
     */
    const handleSkipDays = () => {
        const days = prompt('请输入要跳过的天数:', '7');
        if (!days) return;

        const daysNum = parseInt(days);
        if (isNaN(daysNum) || daysNum < 1) {
            alert('请输入有效的天数！');
            return;
        }

        const confirmed = window.confirm(
            `确定要跳过 ${daysNum} 天吗？\n\n这将模拟时间流逝 ${daysNum} 天。`
        );

        if (!confirmed) return;

        try {
            const records = studyRecordStorage.getAll();
            const checkIns = checkInStorage.getAll();
            const skipMs = daysNum * 24 * 60 * 60 * 1000;

            // 将学习记录时间向前推进
            records.forEach(record => {
                record.lastReviewed -= skipMs;
                record.nextReview -= skipMs;
                studyRecordStorage.save(record);
            });

            // 将打卡记录日期向前推进
            const updatedCheckIns = checkIns.map(checkIn => {
                const date = new Date(checkIn.date);
                date.setDate(date.getDate() - daysNum);
                return {
                    ...checkIn,
                    date: date.toISOString().split('T')[0],
                    timestamp: checkIn.timestamp - skipMs
                };
            });

            // 保存更新后的打卡记录
            localStorage.setItem('vocabulary_app_check_in', JSON.stringify(updatedCheckIns));

            alert(`已成功跳过 ${daysNum} 天！`);

            if (onRefresh) {
                onRefresh();
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('跳过天数失败:', error);
            alert('操作失败，请查看控制台了解详情。');
        }
    };

    /**
     * 清除所有学习记录
     */
    const handleClearAllRecords = () => {
        const confirmed = window.confirm(
            '⚠️ 警告：此操作将清除所有学习记录！\n\n确定要继续吗？此操作不可撤销！'
        );

        if (!confirmed) return;

        const doubleConfirm = window.confirm(
            '最后确认：真的要删除所有学习记录吗？'
        );

        if (!doubleConfirm) return;

        try {
            studyRecordStorage.clearAll();
            checkInStorage.clear();
            alert('所有学习记录已清除！');

            if (onRefresh) {
                onRefresh();
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('清除记录失败:', error);
            alert('操作失败，请查看控制台了解详情。');
        }
    };

    /**
     * 显示当前统计信息
     */
    const handleShowStats = () => {
        const records = studyRecordStorage.getAll();
        const checkIns = checkInStorage.getAll();

        // 去重统计打卡天数（按日期去重）
        const uniqueDates = new Set(checkIns.map(c => c.date));
        const checkInDays = uniqueDates.size;

        // 计算连续打卡天数
        const sortedDates = Array.from(uniqueDates).sort();
        let consecutiveDays = 0;
        const today = new Date().toISOString().split('T')[0];

        if (sortedDates.length > 0) {
            let currentDate = new Date(today);
            consecutiveDays = 0;

            while (true) {
                const dateStr = currentDate.toISOString().split('T')[0];
                if (sortedDates.includes(dateStr)) {
                    consecutiveDays++;
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        const stats = {
            总学习记录数: records.length,
            累计打卡天数: checkInDays,
            连续打卡天数: consecutiveDays,
            今日是否打卡: checkInStorage.hasCheckedInToday() ? '是' : '否',
            需要复习的单词数: records.filter(r => r.nextReview <= Date.now()).length,
            已掌握的单词数: records.filter(r => r.interval >= 30).length,
        };

        const statsText = Object.entries(stats)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

        alert(`📊 当前统计信息\n\n${statsText}`);
    };

    /**
     * 重置打卡状态
     */
    const handleResetCheckIn = () => {
        checkInStorage.clear();
        alert('打卡状态已重置！');
        if (onRefresh) onRefresh();
    };

    /**
     * 导出学习数据
     */
    const handleExportData = () => {
        try {
            const data = {
                records: studyRecordStorage.getAll(),
                checkIns: checkInStorage.getAll(),
                exportTime: new Date().toISOString(),
            };

            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `study-data-backup-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            alert('学习数据已导出！');
        } catch (error) {
            console.error('导出数据失败:', error);
            alert('导出失败，请查看控制台了解详情。');
        }
    };

    /**
     * 显示单词姬统计信息
     */
    const handleShowMateStats = () => {
        try {
            const mate = getMateState();
            const achievements = getAchievements();
            const unlockedTiers = achievements.reduce((sum, achievement) => {
                return sum + achievement.tiers.filter(tier => tier.unlocked).length;
            }, 0);
            const totalTiers = achievements.reduce((sum, achievement) => sum + achievement.tiers.length, 0);

            const stats = {
                '名称': mate.name,
                '等级': `Lv.${mate.level}`,
                '经验值': `${mate.exp} EXP`,
                '好感度': `${mate.affection}/100`,
                '心情': mate.mood,
                '总学习天数': mate.stats.totalStudyDays,
                '连续打卡天数': mate.stats.consecutiveDays,
                '累计学习单词': mate.stats.totalWordsLearned,
                '完成故事数': mate.stats.storiesCompleted,
                '完成冒险数': mate.stats.adventuresCompleted,
                '解锁成就': `${unlockedTiers}/${totalTiers}`,
                '最后互动': new Date(mate.lastInteraction).toLocaleString()
            };

            const statsText = Object.entries(stats)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');

            alert(`💕 单词姬状态\n\n${statsText}`);
        } catch (error) {
            console.error('获取单词姬信息失败:', error);
            alert('获取信息失败，请查看控制台了解详情。');
        }
    };

    /**
     * 快速增加好感度
     */
    const handleAddAffection = () => {
        const amount = prompt('请输入要增加的好感度（1-50）:', '10');
        if (!amount) return;

        const affectionNum = parseInt(amount);
        if (isNaN(affectionNum) || affectionNum < 1 || affectionNum > 50) {
            alert('请输入1-50之间的有效数值！');
            return;
        }

        try {
            addAffection(affectionNum);
            alert(`成功增加 ${affectionNum} 点好感度！`);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('增加好感度失败:', error);
            alert('操作失败，请查看控制台了解详情。');
        }
    };

    /**
     * 快速增加经验值
     */
    const handleAddExp = () => {
        const amount = prompt('请输入要增加的经验值（1-500）:', '100');
        if (!amount) return;

        const expNum = parseInt(amount);
        if (isNaN(expNum) || expNum < 1 || expNum > 500) {
            alert('请输入1-500之间的有效数值！');
            return;
        }

        try {
            const result = addExp(expNum);
            if (result.leveledUp) {
                alert(`成功增加 ${expNum} 点经验！\n🎉 恭喜升级到 Lv.${result.newLevel}！`);
            } else {
                alert(`成功增加 ${expNum} 点经验！`);
            }
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('增加经验值失败:', error);
            alert('操作失败，请查看控制台了解详情。');
        }
    };

    /**
     * 调整学习天数
     */
    const handleAdjustStudyDays = () => {
        const days = prompt('请输入要设置的连续打卡天数（0-365）:', '30');
        if (!days) return;

        const daysNum = parseInt(days);
        if (isNaN(daysNum) || daysNum < 0 || daysNum > 365) {
            alert('请输入0-365之间的有效数值！');
            return;
        }

        try {
            updateStats({ consecutiveDays: daysNum });
            alert(`连续打卡天数已设置为 ${daysNum} 天！`);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('设置天数失败:', error);
            alert('操作失败，请查看控制台了解详情。');
        }
    };

    /**
     * 重置单词姬数据
     */
    const handleResetMateData = () => {
        const confirmed = window.confirm(
            '⚠️ 警告：此操作将重置单词姬的所有数据！\n\n包括:\n- 等级和经验\n- 好感度\n- 所有统计数据\n- 成就进度\n- 连击记录\n\n确定要继续吗？'
        );

        if (!confirmed) return;

        try {
            resetMateData();
            alert('单词姬数据已重置！');
            if (onRefresh) {
                onRefresh();
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('重置单词姬数据失败:', error);
            alert('操作失败，请查看控制台了解详情。');
        }
    };

    /**
     * 重置一切数据（终极重置）
     */
    const handleResetEverything = () => {
        const confirmed = window.confirm(
            '🚨 终极警告：此操作将清除所有数据！\n\n包括:\n✗ 所有学习记录\n✗ 所有打卡记录\n✗ 单词姬所有数据\n✗ 所有词书\n✗ 所有学习计划\n✗ 所有本地存储数据\n\n这相当于完全重新开始！\n\n确定要继续吗？'
        );

        if (!confirmed) return;

        const doubleConfirm = window.confirm(
            '⚠️ 最后确认：真的要删除一切数据吗？\n\n此操作无法撤销！请输入 YES 确认（区分大小写）'
        );

        if (!doubleConfirm) return;

        const finalConfirm = prompt('请输入 "DELETE ALL" 以确认删除所有数据:');
        if (finalConfirm !== 'DELETE ALL') {
            alert('确认失败，操作已取消。');
            return;
        }

        try {
            // 清除所有 localStorage 数据
            const keysToRemove = [
                'wordmate_state',
                'wordmate_interactions',
                'wordmate_achievements',
                'wordmate_combo',
                'wordmate_milestones',
                'vocabulary_app_records',
                'vocabulary_app_check_in',
                'vocabulary_app_word_books',
                'vocabulary_app_study_plans',
                'vocabulary_app_current_plan'
            ];

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            alert('✅ 所有数据已清除！\n\n页面将刷新以重新初始化。');
            window.location.reload();
        } catch (error) {
            console.error('重置所有数据失败:', error);
            alert('操作失败，请查看控制台了解详情。');
        }
    };

    if (!isOpen) {
        return (
            <button
                className="dev-tools-toggle"
                onClick={() => setIsOpen(true)}
                title="开发者工具"
            >
                <Settings size={20} />
            </button>
        );
    }

    return (
        <div className="dev-tools-panel">
            <div className="dev-tools-header">
                <h3>🛠️ 开发者工具</h3>
                <button
                    className="dev-tools-close"
                    onClick={() => setIsOpen(false)}
                >
                    ×
                </button>
            </div>

            <div className="dev-tools-content">
                <div className="dev-tools-section">
                    <h4>⏰ 时间控制</h4>
                    <button className="dev-btn dev-btn-primary" onClick={handleNextDay}>
                        <Calendar size={16} />
                        快速进入下一天
                    </button>
                    <button className="dev-btn dev-btn-primary" onClick={handleSkipDays}>
                        <Clock size={16} />
                        跳过N天
                    </button>
                    <button className="dev-btn dev-btn-secondary" onClick={handleResetCheckIn}>
                        <RefreshCw size={16} />
                        重置打卡状态
                    </button>
                </div>

                <div className="dev-tools-section">
                    <h4>� 单词姬工具</h4>
                    <button className="dev-btn dev-btn-info" onClick={handleShowMateStats}>
                        <Heart size={16} />
                        查看单词姬状态
                    </button>
                    <button className="dev-btn dev-btn-success" onClick={handleAddAffection}>
                        <Heart size={16} />
                        增加好感度
                    </button>
                    <button className="dev-btn dev-btn-success" onClick={handleAddExp}>
                        <Star size={16} />
                        增加经验值
                    </button>
                    <button className="dev-btn dev-btn-primary" onClick={handleAdjustStudyDays}>
                        <Zap size={16} />
                        调整连续天数
                    </button>
                    <button className="dev-btn dev-btn-warning" onClick={handleResetMateData}>
                        <Award size={16} />
                        重置单词姬
                    </button>
                </div>

                <div className="dev-tools-section">
                    <h4>�📊 数据管理</h4>
                    <button className="dev-btn dev-btn-info" onClick={handleShowStats}>
                        <BarChart3 size={16} />
                        查看学习统计
                    </button>
                    <button className="dev-btn dev-btn-success" onClick={handleExportData}>
                        <Download size={16} />
                        导出学习数据
                    </button>
                    <button className="dev-btn dev-btn-danger" onClick={handleClearAllRecords}>
                        <Trash2 size={16} />
                        清除学习记录
                    </button>
                </div>

                <div className="dev-tools-section dev-tools-danger-zone">
                    <h4>🚨 危险区域</h4>
                    <button className="dev-btn dev-btn-danger-extreme" onClick={handleResetEverything}>
                        <AlertTriangle size={16} />
                        重置一切数据
                    </button>
                </div>

                <div className="dev-tools-note">
                    <p>⚠️ 注意：这些工具仅用于开发和测试，请谨慎使用！</p>
                </div>
            </div>
        </div>
    );
};

export default DevTools;
