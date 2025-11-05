import React, { useState, useEffect } from 'react';
import { StudyPlan, WordBook, TodayTask } from '../types';
import { generateTodayTask, getStudyStats, clearCachedTodayWords } from '../utils/studyPlan';
import { studyRecordStorage, checkInStorage } from '../utils/storage';
import { getMateState } from '../utils/wordMate';
import { Play, Calendar, BookOpen, TrendingUp, Clock, Target, Eye, Check, Heart, Star } from 'lucide-react';
import Modal from './Modal';
import MateAvatar from './MateAvatar';

interface DashboardProps {
  currentPlan: StudyPlan | null;
  wordBooks: WordBook[];
  onStartStudy: () => void;
  onCreatePlan: () => void;
  onOpenWordMate?: () => void;
}

/**
 * 仪表板组件
 * 显示学习概览、统计信息和今日任务
 */
const Dashboard: React.FC<DashboardProps> = ({
  currentPlan,
  wordBooks,
  onStartStudy,
  onCreatePlan,
  onOpenWordMate
}) => {
  const [todayTask, setTodayTask] = useState<TodayTask | null>(null);
  const [studyStats, setStudyStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [mateState, setMateState] = useState(getMateState());

  // 模态窗状态
  const [showNewWordsModal, setShowNewWordsModal] = useState(false);
  const [showReviewWordsModal, setShowReviewWordsModal] = useState(false);
  const [showMasteryDetailModal, setShowMasteryDetailModal] = useState(false);
  const [showProgressDetailModal, setShowProgressDetailModal] = useState(false);
  const [showAccuracyDetailModal, setShowAccuracyDetailModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [currentPlan, wordBooks]);

  useEffect(() => {
    // 检查今日是否已打卡
    setHasCheckedIn(checkInStorage.hasCheckedInToday());
  }, []);

  /**
   * 加载仪表板数据
   */
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      if (currentPlan) {
        // 获取当前计划的词书
        const wordBook = wordBooks.find(book => book.id === currentPlan.wordBookId);

        if (wordBook) {
          // 生成今日任务
          const task = generateTodayTask(wordBook, currentPlan);
          setTodayTask(task);

          // 获取学习统计
          const stats = getStudyStats(wordBook);
          setStudyStats(stats);
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理打卡签到
   */
  const handleCheckIn = () => {
    if (hasCheckedIn) {
      alert('今日已打卡！');
      return;
    }

    const success = checkInStorage.checkIn(currentPlan?.id);
    if (success) {
      setHasCheckedIn(true);
      alert('打卡成功！继续加油💪');
    } else {
      alert('今日已打卡！');
    }
  };

  /**
   * 重置当前计划对应词书的学习进度
   */
  const handleResetProgress = () => {
    if (!currentPlan) return;
    const book = wordBooks.find(b => b.id === currentPlan.wordBookId);
    if (!book) return;

    const confirmed = window.confirm(
      `确定要重置词书 "${book.name}" 的学习进度吗？\n\n此操作将：\n- 清零所有学习记录\n- 保持当前学习计划不变\n- 此操作不可撤销`
    );

    if (!confirmed) return;

    // 只删除该词书的学习记录，保持学习计划不变
    const ids = book.words.map(w => w.id);
    studyRecordStorage.deleteByWordIds(ids);

    // 清空今日单词列表缓存，以便重新生成
    clearCachedTodayWords();

    // 重新加载数据
    loadDashboardData();
    alert('已重置该词书的学习进度，学习计划保持不变。');
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载数据中...</p>
        </div>
      </div>
    );
  }

  // 没有学习计划时的状态
  if (!currentPlan) {
    return (
      <div className="dashboard">
        <div className="empty-state">
          <div className="empty-icon">
            <BookOpen size={64} />
          </div>
          <h2 className="empty-title">欢迎使用词汇记忆</h2>
          <p className="empty-description">
            创建您的第一个学习计划，开始高效的单词学习之旅
          </p>
          <button className="btn btn-primary btn-lg" onClick={onCreatePlan}>
            <Calendar size={20} />
            创建学习计划
          </button>
        </div>
      </div>
    );
  }

  const wordBook = wordBooks.find(book => book.id === currentPlan.wordBookId);

  return (
    <div className="dashboard">
      {/* 欢迎区域 */}
      <div className="welcome-section">
        <h1 className="welcome-title">今日学习</h1>
        <p className="welcome-subtitle">
          词书：{wordBook?.name} | 计划：{currentPlan.dailyNewWords}词/天
        </p>
      </div>

      {/* WordMate 卡片 */}
      <div className="card wordmate-card">
        <div className="wordmate-content" onClick={onOpenWordMate}>
          <div className="wordmate-avatar">
            <MateAvatar
              mate={mateState}
              showMoodIndicator={false}
            />
          </div>
          <div className="wordmate-info">
            <h3 className="wordmate-name">{mateState.name}</h3>
            <div className="wordmate-stats">
              <div className="mini-stat">
                <Star size={14} fill="#ffd700" color="#ffd700" />
                <span>Lv.{mateState.level}</span>
              </div>
              <div className="mini-stat">
                <Heart size={14} fill="#ff6b9d" color="#ff6b9d" />
                <span>{mateState.affection}</span>
              </div>
            </div>
            <p className="wordmate-hint">点击与我互动 →</p>
          </div>
        </div>
      </div>

      {/* 今日任务卡片 */}
      {todayTask && (
        <div className="card today-task-card">
          <div className="card-header">
            <h2 className="card-title">
              <Target size={20} />
              今日任务
            </h2>
            <div className="task-progress">
              {todayTask.totalNew + todayTask.totalReview > 0 ? (
                <span className="progress-text">
                  今日任务：{todayTask.totalNew + todayTask.totalReview} 个单词
                </span>
              ) : (
                <span className="progress-text">今日已完成</span>
              )}
            </div>
          </div>

          <div className="task-grid">
            <div
              className="task-item new-words clickable"
              onClick={() => setShowNewWordsModal(true)}
            >
              <div className="task-icon">
                <BookOpen size={24} />
              </div>
              <div className="task-content">
                <h3 className="task-label">新词学习</h3>
                <p className="task-count">
                  {todayTask.totalNew}
                </p>
              </div>
              <div className="task-action">
                <Eye size={16} />
              </div>
            </div>

            <div
              className="task-item review-words clickable"
              onClick={() => setShowReviewWordsModal(true)}
            >
              <div className="task-icon">
                <TrendingUp size={24} />
              </div>
              <div className="task-content">
                <h3 className="task-label">复习巩固</h3>
                <p className="task-count">
                  {todayTask.totalReview}
                </p>
              </div>
              <div className="task-action">
                <Eye size={16} />
              </div>
            </div>
          </div>

          <div className="task-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={onStartStudy}
            >
              <Play size={20} />
              开始学习
            </button>

            <button
              className={`btn btn-lg ${hasCheckedIn ? 'btn-success' : 'btn-success'}`}
              onClick={handleCheckIn}
              disabled={hasCheckedIn}
            >
              <Check size={20} />
              {hasCheckedIn ? '已打卡' : '打卡签到'}
            </button>
          </div>
        </div>
      )}

      {/* 学习统计 */}
      {studyStats && (
        <div className="stats-grid">
          <div
            className="card stat-card clickable-card"
            onClick={() => setShowProgressDetailModal(true)}
            style={{ cursor: 'pointer' }}
            title="点击查看详细进度"
          >
            <div className="stat-header">
              <h3 className="stat-title">学习进度</h3>
              <div className="stat-icon progress-icon">
                <Target size={20} />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">{studyStats.progress}%</div>
              <div className="stat-description">
                已学习 {studyStats.learnedWords} / {studyStats.totalWords} 个单词
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${studyStats.progress}%` }}
                ></div>
              </div>
              <div className="stat-hint" style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                点击查看详情 →
              </div>
            </div>
          </div>

          <div
            className="card stat-card clickable-card"
            onClick={() => setShowMasteryDetailModal(true)}
            style={{ cursor: 'pointer' }}
            title="点击查看详细掌握情况"
          >
            <div className="stat-header">
              <h3 className="stat-title">掌握程度</h3>
              <div className="stat-icon mastery-icon">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">{studyStats.masteryRate}%</div>
              <div className="stat-description">
                综合掌握 {studyStats.comprehensiveMastery} / {studyStats.totalWords} 个单词
              </div>
              <div className="stat-hint" style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                点击查看详情 →
              </div>
            </div>
          </div>

          <div
            className="card stat-card clickable-card"
            onClick={() => setShowAccuracyDetailModal(true)}
            style={{ cursor: 'pointer' }}
            title="点击查看详细准确率"
          >
            <div className="stat-header">
              <h3 className="stat-title">学习准确率</h3>
              <div className="stat-icon accuracy-icon">
                <Clock size={20} />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">{studyStats.accuracy}%</div>
              <div className="stat-description">
                总复习次数 {studyStats.totalReviews}
              </div>
              <div className="stat-hint" style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                点击查看详情 →
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 新词学习模态窗 */}
      <Modal
        isOpen={showNewWordsModal}
        onClose={() => setShowNewWordsModal(false)}
        title="今日新词学习"
        className="task-detail-modal"
      >
        <div className="task-detail-header">
          <h3 className="task-detail-title">新词学习</h3>
          <p className="task-detail-subtitle">
            共 {todayTask?.totalNew || 0} 个新词需要学习
          </p>
        </div>
        <div className="task-word-list">
          {todayTask?.newWords.map((word, index) => {
            // 检查单词是否已完成
            const record = studyRecordStorage.getByWordId(word.id);
            const isCompleted = record && record.lastReviewed >= new Date().setHours(0, 0, 0, 0) && record.reviewCount > 0;

            return (
              <div key={word.id} className={`task-word-item ${isCompleted ? 'completed' : ''}`}>
                <div className="task-word-number">{index + 1}</div>
                <div className="task-word-content">
                  <div className="task-word-main">
                    <span className="task-word-text">{word.word}</span>
                    {word.pronunciation && (
                      <span className="task-word-pronunciation">{word.pronunciation}</span>
                    )}
                    {isCompleted && (
                      <span className="task-word-status-badge">✓ 已完成</span>
                    )}
                  </div>
                  <p className="task-word-translation">{word.translation}</p>
                  {word.example && (
                    <p className="task-word-example">{word.example}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* 复习巩固模态窗 */}
      <Modal
        isOpen={showReviewWordsModal}
        onClose={() => setShowReviewWordsModal(false)}
        title="今日复习巩固"
        className="task-detail-modal"
      >
        <div className="task-detail-header">
          <h3 className="task-detail-title">复习巩固</h3>
          <p className="task-detail-subtitle">
            共 {todayTask?.totalReview || 0} 个单词需要复习
          </p>
        </div>
        <div className="task-word-list">
          {todayTask?.reviewWords.map((word, index) => {
            // 检查单词是否已完成
            const record = studyRecordStorage.getByWordId(word.id);
            const isCompleted = record && record.lastReviewed >= new Date().setHours(0, 0, 0, 0);

            return (
              <div key={word.id} className={`task-word-item ${isCompleted ? 'completed' : ''}`}>
                <div className="task-word-number">{index + 1}</div>
                <div className="task-word-content">
                  <div className="task-word-main">
                    <span className="task-word-text">{word.word}</span>
                    {word.pronunciation && (
                      <span className="task-word-pronunciation">{word.pronunciation}</span>
                    )}
                    {isCompleted && (
                      <span className="task-word-status-badge">✓ 已完成</span>
                    )}
                  </div>
                  <p className="task-word-translation">{word.translation}</p>
                  {word.example && (
                    <p className="task-word-example">{word.example}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* 学习计划信息 */}
      <div className="card plan-info-card">
        <div className="card-header">
          <h2 className="card-title">
            <Calendar size={20} />
            学习计划
          </h2>
        </div>
        <div className="plan-info">
          <div className="plan-details">
            <div className="plan-item">
              <span className="plan-label">词书名称：</span>
              <span className="plan-value">{wordBook?.name}</span>
            </div>
            <div className="plan-item">
              <span className="plan-label">每日新词：</span>
              <span className="plan-value">{currentPlan.dailyNewWords} 个</span>
            </div>
            <div className="plan-item">
              <span className="plan-label">开始日期：</span>
              <span className="plan-value">
                {new Date(currentPlan.startDate).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <div className="plan-item">
              <span className="plan-label">预期完成：</span>
              <span className="plan-value">
                {new Date(currentPlan.expectedEndDate).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
          <div className="plan-actions">
            <button className="btn btn-secondary" onClick={onCreatePlan}>
              修改计划
            </button>
            <button
              className="btn btn-danger"
              onClick={handleResetProgress}
              title="重置此计划对应词书的学习进度"
              style={{ marginLeft: '8px' }}
            >
              重置进度
            </button>
          </div>
        </div>
      </div>

      {/* 学习进度详情模态窗 */}
      {studyStats && (
        <Modal
          isOpen={showProgressDetailModal}
          onClose={() => setShowProgressDetailModal(false)}
          title="学习进度详情"
        >
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#2196F3', marginBottom: '8px' }}>
                {studyStats.progress}%
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                整体学习进度
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{
                height: '20px',
                background: '#f0f0f0',
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #4CAF50, #2196F3)',
                  width: `${studyStats.progress}%`,
                  transition: 'width 0.5s ease',
                  borderRadius: '10px'
                }}></div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: '#E8F5E9',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '8px' }}>
                  {studyStats.learnedWords}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>已学习单词</div>
              </div>
              <div style={{
                background: '#F5F5F5',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#999', marginBottom: '8px' }}>
                  {studyStats.totalWords - studyStats.learnedWords}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>未学习单词</div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: '#333', fontSize: '16px' }}>按复习次数分类</h4>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px' }}>复习 1 次</span>
                  <span style={{ fontWeight: 'bold', color: '#FF9800' }}>{studyStats.reviewOnce} 个</span>
                </div>
                <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: '#FF9800',
                    width: `${studyStats.learnedWords > 0 ? (studyStats.reviewOnce / studyStats.learnedWords * 100) : 0}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px' }}>复习 2-5 次</span>
                  <span style={{ fontWeight: 'bold', color: '#2196F3' }}>{studyStats.review2to5} 个</span>
                </div>
                <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: '#2196F3',
                    width: `${studyStats.learnedWords > 0 ? (studyStats.review2to5 / studyStats.learnedWords * 100) : 0}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px' }}>复习 6-10 次</span>
                  <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{studyStats.review6to10} 个</span>
                </div>
                <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: '#4CAF50',
                    width: `${studyStats.learnedWords > 0 ? (studyStats.review6to10 / studyStats.learnedWords * 100) : 0}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px' }}>复习 10+ 次</span>
                  <span style={{ fontWeight: 'bold', color: '#9C27B0' }}>{studyStats.reviewMore10} 个</span>
                </div>
                <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: '#9C27B0',
                    width: `${studyStats.learnedWords > 0 ? (studyStats.reviewMore10 / studyStats.learnedWords * 100) : 0}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            </div>

            <div style={{
              background: '#f5f5f5',
              padding: '16px',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>总单词数：</span>
                <span style={{ fontWeight: 'bold' }}>{studyStats.totalWords} 个</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>总复习次数：</span>
                <span style={{ fontWeight: 'bold', color: '#2196F3' }}>{studyStats.totalReviews} 次</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>平均每词复习：</span>
                <span style={{ fontWeight: 'bold' }}>
                  {studyStats.learnedWords > 0 ? (studyStats.totalReviews / studyStats.learnedWords).toFixed(1) : 0} 次
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 学习准确率详情模态窗 */}
      {studyStats && (
        <Modal
          isOpen={showAccuracyDetailModal}
          onClose={() => setShowAccuracyDetailModal(false)}
          title="学习准确率详情"
        >
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '8px' }}>
                {studyStats.accuracy}%
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                整体学习准确率
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: '#E8F5E9',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '4px' }}>
                  {studyStats.totalCorrect}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>正确次数</div>
              </div>
              <div style={{
                background: '#FFEBEE',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F44336', marginBottom: '4px' }}>
                  {studyStats.totalWrong}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>错误次数</div>
              </div>
              <div style={{
                background: '#FFF3E0',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FF9800', marginBottom: '4px' }}>
                  {studyStats.totalDifficult}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>困难次数</div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: '#333', fontSize: '16px' }}>答题情况分布</h4>

              <div style={{ position: 'relative', height: '150px', marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around',
                  height: '100%',
                  borderBottom: '2px solid #e0e0e0',
                  paddingBottom: '8px'
                }}>
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginRight: '8px'
                  }}>
                    <div style={{
                      width: '100%',
                      background: '#4CAF50',
                      borderRadius: '4px 4px 0 0',
                      height: `${studyStats.totalCorrect + studyStats.totalWrong + studyStats.totalDifficult > 0
                        ? (studyStats.totalCorrect / (studyStats.totalCorrect + studyStats.totalWrong + studyStats.totalDifficult) * 100)
                        : 0}%`,
                      minHeight: '20px',
                      transition: 'height 0.5s ease',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      paddingBottom: '4px'
                    }}>
                      {studyStats.totalCorrect > 0 && studyStats.totalCorrect}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#4CAF50', fontWeight: '500' }}>正确</div>
                  </div>

                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginRight: '8px'
                  }}>
                    <div style={{
                      width: '100%',
                      background: '#F44336',
                      borderRadius: '4px 4px 0 0',
                      height: `${studyStats.totalCorrect + studyStats.totalWrong + studyStats.totalDifficult > 0
                        ? (studyStats.totalWrong / (studyStats.totalCorrect + studyStats.totalWrong + studyStats.totalDifficult) * 100)
                        : 0}%`,
                      minHeight: '20px',
                      transition: 'height 0.5s ease',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      paddingBottom: '4px'
                    }}>
                      {studyStats.totalWrong > 0 && studyStats.totalWrong}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#F44336', fontWeight: '500' }}>错误</div>
                  </div>

                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '100%',
                      background: '#FF9800',
                      borderRadius: '4px 4px 0 0',
                      height: `${studyStats.totalCorrect + studyStats.totalWrong + studyStats.totalDifficult > 0
                        ? (studyStats.totalDifficult / (studyStats.totalCorrect + studyStats.totalWrong + studyStats.totalDifficult) * 100)
                        : 0}%`,
                      minHeight: '20px',
                      transition: 'height 0.5s ease',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      paddingBottom: '4px'
                    }}>
                      {studyStats.totalDifficult > 0 && studyStats.totalDifficult}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#FF9800', fontWeight: '500' }}>困难</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: '#f5f5f5',
              padding: '16px',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>总答题次数：</span>
                <span style={{ fontWeight: 'bold' }}>
                  {studyStats.totalCorrect + studyStats.totalWrong + studyStats.totalDifficult} 次
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>正确率：</span>
                <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{studyStats.accuracy}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>错误率：</span>
                <span style={{ fontWeight: 'bold', color: '#F44336' }}>
                  {studyStats.totalCorrect + studyStats.totalWrong > 0
                    ? Math.round((studyStats.totalWrong / (studyStats.totalCorrect + studyStats.totalWrong)) * 100)
                    : 0}%
                </span>
              </div>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '12px',
              background: '#E3F2FD',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#1976D2'
            }}>
              <strong>💡 提示：</strong> 准确率基于"正确"和"错误"评分计算，"困难"和"一般"评分不计入准确率统计。保持高准确率能帮助单词更快进入长期记忆！
            </div>
          </div>
        </Modal>
      )}

      {/* 掌握程度详情模态窗 */}
      {studyStats && (
        <Modal
          isOpen={showMasteryDetailModal}
          onClose={() => setShowMasteryDetailModal(false)}
          title="掌握程度详情"
        >
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '8px' }}>
                {studyStats.masteryRate}%
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                综合掌握率（熟悉及以上）
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: '#333', fontSize: '16px' }}>掌握程度分级</h4>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFC107' }}></div>
                    <span style={{ fontWeight: '500' }}>初学阶段</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>(间隔 &lt; 7天)</span>
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#FFC107' }}>{studyStats.beginnerWords} 个</span>
                </div>
                <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: '#FFC107',
                    width: `${studyStats.totalWords > 0 ? (studyStats.beginnerWords / studyStats.totalWords * 100) : 0}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2196F3' }}></div>
                    <span style={{ fontWeight: '500' }}>熟悉阶段</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>(7-29天)</span>
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#2196F3' }}>{studyStats.familiarWords} 个</span>
                </div>
                <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: '#2196F3',
                    width: `${studyStats.totalWords > 0 ? (studyStats.familiarWords / studyStats.totalWords * 100) : 0}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4CAF50' }}></div>
                    <span style={{ fontWeight: '500' }}>熟练掌握</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>(30-59天)</span>
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{studyStats.proficientWords} 个</span>
                </div>
                <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: '#4CAF50',
                    width: `${studyStats.totalWords > 0 ? (studyStats.proficientWords / studyStats.totalWords * 100) : 0}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#9C27B0' }}></div>
                    <span style={{ fontWeight: '500' }}>完全掌握</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>(≥ 60天)</span>
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#9C27B0' }}>{studyStats.masteredWords} 个</span>
                </div>
                <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: '#9C27B0',
                    width: `${studyStats.totalWords > 0 ? (studyStats.masteredWords / studyStats.totalWords * 100) : 0}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            </div>

            <div style={{
              background: '#f5f5f5',
              padding: '16px',
              borderRadius: '8px',
              marginTop: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>总单词数：</span>
                <span style={{ fontWeight: 'bold' }}>{studyStats.totalWords} 个</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>已学习：</span>
                <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{studyStats.learnedWords} 个</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>未学习：</span>
                <span style={{ fontWeight: 'bold', color: '#999' }}>{studyStats.totalWords - studyStats.learnedWords} 个</span>
              </div>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '12px',
              background: '#E3F2FD',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#1976D2'
            }}>
              <strong>💡 提示：</strong> 综合掌握率统计的是"熟悉阶段"及以上的单词，表示您对这些单词已经有较好的记忆。坚持复习可以提升到更高阶段！
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
