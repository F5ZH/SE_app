import React, { useState, useEffect } from 'react';
import { Heart, Star, Sparkles, Trophy, BookOpen, Map, Gift, Calendar, MessageCircle } from 'lucide-react';
import { WordMateState, InteractionType, WordMateMood, Achievement } from '../types';
import {
  getMateState,
  updateMateName,
  getLevelProgress,
  getAffectionTitle,
  recordInteraction,
  getAchievements,
  checkAchievements,
  checkDailyCheckin
} from '../utils/wordMate';
import { getDialogue, getGreetingByTime } from '../data/dialogues';
import ChatBox from './ChatBox';
import './WordMateHome.css';

interface WordMateHomeProps {
  onStartActivity: (activityType: 'story' | 'adventure' | 'basic') => void;
  onBack: () => void;
}

/**
 * WordMate 主页 - 养成系统核心界面
 */
const WordMateHome: React.FC<WordMateHomeProps> = ({ onStartActivity, onBack }) => {
  const [mate, setMate] = useState<WordMateState>(getMateState());
  const [currentDialogue, setCurrentDialogue] = useState<string>('');
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [newName, setNewName] = useState(mate.name);
  const [showAchievements, setShowAchievements] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [canCheckin, setCanCheckin] = useState(false);
  const [showCheckinReward, setShowCheckinReward] = useState(false);
  const [showChatBox, setShowChatBox] = useState(false);

  const levelProgress = getLevelProgress();
  const affectionTitle = getAffectionTitle(mate.affection);

  // 初始化问候
  useEffect(() => {
    const greeting = getGreetingByTime(mate.level, mate.affection);
    setCurrentDialogue(greeting.text);
    
    // 检查是否可以签到
    const isNewDay = checkDailyCheckin();
    setCanCheckin(isNewDay);
    
    // 如果是新的一天，不自动签到，让用户点击
    if (!isNewDay) {
      // 记录问候互动
      recordInteraction(InteractionType.GREETING);
    }
    
    // 检查成就
    const newAchievements = checkAchievements();
    if (newAchievements.length > 0) {
      setNewAchievements(newAchievements);
      setShowAchievementModal(true);
    }
    
    // 加载成就列表
    setAchievements(getAchievements());
  }, []);

  // 处理互动
  const handleInteraction = (type: InteractionType) => {
    const { state, leveledUp } = recordInteraction(type);
    setMate(state);

    if (leveledUp) {
      setShowLevelUpModal(true);
    }

    const dialogue = getDialogue(type, state.level, state.affection, state.mood);
    setCurrentDialogue(dialogue.text);

    // 检查新成就
    const newAchievements = checkAchievements();
    if (newAchievements.length > 0) {
      setNewAchievements(newAchievements);
      setShowAchievementModal(true);
    }
  };

  // 更新名称
  const handleNameUpdate = () => {
    if (newName.trim()) {
      const updated = updateMateName(newName.trim());
      setMate(updated);
      setShowNameEdit(false);
    }
  };

  // 处理每日签到
  const handleDailyCheckin = () => {
    const currentMate = getMateState();
    const { state, leveledUp } = recordInteraction(
      InteractionType.DAILY_CHECKIN,
      `连续签到 ${currentMate.stats.consecutiveDays + 1} 天`
    );
    
    setMate(state);
    setCanCheckin(false);
    setShowCheckinReward(true);

    if (leveledUp) {
      setShowLevelUpModal(true);
    }

    // 显示签到对话
    const dialogue = getDialogue(InteractionType.DAILY_CHECKIN, state.level, state.affection);
    setCurrentDialogue(dialogue.text);

    // 检查成就
    const newAchievements = checkAchievements();
    if (newAchievements.length > 0) {
      setNewAchievements(newAchievements);
      setShowAchievementModal(true);
    }

    // 3秒后隐藏奖励提示
    setTimeout(() => {
      setShowCheckinReward(false);
    }, 3000);
  };

  // 开始活动
  const handleStartActivity = (activityType: 'story' | 'adventure' | 'basic') => {
    handleInteraction(InteractionType.STUDY_START);
    setTimeout(() => {
      onStartActivity(activityType);
    }, 1000);
  };

  // 获取心情emoji
  const getMoodEmoji = (mood: WordMateMood): string => {
    const emojiMap: Record<WordMateMood, string> = {
      [WordMateMood.HAPPY]: '😊',
      [WordMateMood.EXCITED]: '✨',
      [WordMateMood.NORMAL]: '📚',
      [WordMateMood.TIRED]: '😴',
      [WordMateMood.ENCOURAGING]: '💪',
      [WordMateMood.PROUD]: '🌟',
      [WordMateMood.WORRIED]: '😟'
    };
    return emojiMap[mood];
  };

  // 点击头像触发随机对话
  const handleAvatarClick = () => {
    const randomDialogues = [
      '嘿嘿，你在看我吗？☺️',
      '怎么啦？是想和我聊天吗？💕',
      '有什么问题可以问我哦~',
      '今天学习得怎么样？',
      '要不要一起玩个游戏？',
      '我会一直陪着你的！',
      '加油加油！你最棒了！',
      '休息一下也没关系的~'
    ];
    const randomText = randomDialogues[Math.floor(Math.random() * randomDialogues.length)];
    setCurrentDialogue(randomText);
  };

  return (
    <div className="wordmate-home">
      {/* 返回按钮 */}
      <button className="back-button" onClick={onBack}>
        ← 返回首页
      </button>

      {/* 主要内容区域 */}
      <div className="mate-container">
        {/* 左侧：虚拟形象 */}
        <div className="mate-character-section">
          <div className="character-card">
            {/* 立绘占位符 */}
            <div className="character-avatar" onClick={handleAvatarClick}>
              <div className="avatar-placeholder">
                <span className="avatar-emoji">👧</span>
                <span className="mood-indicator">{getMoodEmoji(mate.mood)}</span>
              </div>
              
              {/* 气泡对话框 */}
              <div className="speech-bubble">
                <p className="bubble-text">{currentDialogue}</p>
                <div className="bubble-tail"></div>
              </div>
            </div>

            {/* 名称 */}
            <div className="character-name">
              {showNameEdit ? (
                <div className="name-edit">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    maxLength={10}
                    autoFocus
                  />
                  <button onClick={handleNameUpdate}>✓</button>
                  <button onClick={() => setShowNameEdit(false)}>✗</button>
                </div>
              ) : (
                <h2 onClick={() => setShowNameEdit(true)}>
                  {mate.name} <span className="edit-icon">✏️</span>
                </h2>
              )}
            </div>

            {/* 等级信息 */}
            <div className="level-info">
              <div className="level-badge">
                <Star size={16} />
                <span>Lv.{mate.level}</span>
              </div>
              <div className="exp-bar">
                <div 
                  className="exp-fill" 
                  style={{ width: `${levelProgress.percentage}%` }}
                />
                <span className="exp-text">
                  {levelProgress.currentExp} / {levelProgress.requiredExp} EXP
                </span>
              </div>
            </div>

            {/* 好感度 */}
            <div className="affection-info">
              <div className="affection-header">
                <Heart size={16} fill="#ff6b9d" color="#ff6b9d" />
                <span>好感度</span>
                <span className="affection-title">{affectionTitle}</span>
              </div>
              <div className="affection-bar">
                <div 
                  className="affection-fill" 
                  style={{ width: `${mate.affection}%` }}
                />
                <span className="affection-text">{mate.affection} / 100</span>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="stats-grid">
              <div className="stat-item">
                <BookOpen size={18} />
                <span className="stat-value">{mate.stats.totalWordsLearned}</span>
                <span className="stat-label">学习单词</span>
              </div>
              <div className="stat-item">
                <Trophy size={18} />
                <span className="stat-value">{mate.stats.achievementsUnlocked}</span>
                <span className="stat-label">解锁成就</span>
              </div>
              <div className="stat-item">
                <Sparkles size={18} />
                <span className="stat-value">{mate.stats.consecutiveDays}</span>
                <span className="stat-label">连续打卡</span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：互动区域 */}
        <div className="interaction-section">
          {/* 每日签到 */}
          {canCheckin && (
            <div className="checkin-banner">
              <button className="checkin-btn" onClick={handleDailyCheckin}>
                <Calendar size={24} />
                <div className="checkin-text">
                  <span className="checkin-title">每日签到</span>
                  <span className="checkin-desc">+5 好感度 +20 经验值</span>
                </div>
              </button>
            </div>
          )}

          {/* 签到奖励提示 */}
          {showCheckinReward && (
            <div className="reward-toast">
              <Sparkles size={20} />
              <span>签到成功！已连续打卡 {mate.stats.consecutiveDays} 天 🔥</span>
            </div>
          )}

          {/* 活动按钮 */}
          <div className="activities">
            <h3>一起学习吧~</h3>
            <div className="activity-buttons">
              <button
                className="activity-btn chat-btn"
                onClick={() => setShowChatBox(true)}
              >
                <MessageCircle size={24} />
                <span className="btn-title">自由对话</span>
                <span className="btn-desc">和我聊聊天吧</span>
                <span className="btn-reward">💬</span>
              </button>

              <button
                className="activity-btn story-btn"
                onClick={() => handleStartActivity('story')}
              >
                <BookOpen size={24} />
                <span className="btn-title">AI 故事</span>
                <span className="btn-desc">在故事中学单词</span>
                <span className="btn-reward">+10 好感度 ❤️</span>
              </button>

              <button
                className="activity-btn adventure-btn"
                onClick={() => handleStartActivity('adventure')}
              >
                <Map size={24} />
                <span className="btn-title">Word Odyssey</span>
                <span className="btn-desc">互动冒险学习</span>
                <span className="btn-reward">+20 好感度 ❤️</span>
              </button>

              <button
                className="activity-btn basic-btn"
                onClick={() => handleStartActivity('basic')}
              >
                <Sparkles size={24} />
                <span className="btn-title">基础练习</span>
                <span className="btn-desc">快速背单词</span>
                <span className="btn-reward">+5 好感度 ❤️</span>
              </button>
            </div>
          </div>

          {/* 成就按钮 */}
          <button 
            className="achievements-btn"
            onClick={() => setShowAchievements(true)}
          >
            <Gift size={20} />
            查看成就 ({mate.stats.achievementsUnlocked}/{achievements.length})
          </button>
        </div>
      </div>

      {/* 成就列表模态框 */}
      {showAchievements && (
        <div className="modal-overlay" onClick={() => setShowAchievements(false)}>
          <div className="modal-content achievements-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🏆 成就列表</h2>
            <div className="achievements-grid">
              {achievements.map(achievement => (
                <div 
                  key={achievement.id} 
                  className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-info">
                    <h4>{achievement.name}</h4>
                    <p>{achievement.description}</p>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <span className="unlock-date">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button className="close-btn" onClick={() => setShowAchievements(false)}>
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 升级提示 */}
      {showLevelUpModal && (
        <div className="modal-overlay" onClick={() => setShowLevelUpModal(false)}>
          <div className="modal-content levelup-modal">
            <h2>🎉 升级了！</h2>
            <p className="levelup-text">
              恭喜你！{mate.name} 升到了 <strong>Lv.{mate.level}</strong>！
            </p>
            <p>继续加油，解锁更多精彩内容~</p>
            <button className="close-btn" onClick={() => setShowLevelUpModal(false)}>
              太棒了！
            </button>
          </div>
        </div>
      )}

      {/* 新成就解锁提示 */}
      {showAchievementModal && newAchievements.length > 0 && (
        <div className="modal-overlay" onClick={() => setShowAchievementModal(false)}>
          <div className="modal-content achievement-unlock-modal">
            <h2>🎊 成就解锁！</h2>
            {newAchievements.map(achievement => (
              <div key={achievement.id} className="new-achievement">
                <div className="achievement-icon-large">{achievement.icon}</div>
                <h3>{achievement.name}</h3>
                <p>{achievement.description}</p>
                <div className="rewards">
                  {achievement.reward.affection > 0 && (
                    <span>❤️ +{achievement.reward.affection} 好感度</span>
                  )}
                  {achievement.reward.exp > 0 && (
                    <span>⭐ +{achievement.reward.exp} 经验值</span>
                  )}
                </div>
              </div>
            ))}
            <button className="close-btn" onClick={() => setShowAchievementModal(false)}>
              收下了！
            </button>
          </div>
        </div>
      )}

      {/* AI 聊天框 */}
      {showChatBox && (
        <ChatBox onClose={() => setShowChatBox(false)} />
      )}
    </div>
  );
};

export default WordMateHome;
