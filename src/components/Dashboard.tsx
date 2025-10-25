import React, { useState, useEffect } from 'react';
import { StudyPlan, WordBook, TodayTask } from '../types';
import { generateTodayTask, getStudyStats } from '../utils/studyPlan';
import { studyRecordStorage } from '../utils/storage';
import { Play, Calendar, BookOpen, TrendingUp, Clock, Target } from 'lucide-react';

interface DashboardProps {
  currentPlan: StudyPlan | null;
  wordBooks: WordBook[];
  onStartStudy: () => void;
  onCreatePlan: () => void;
}

/**
 * 仪表板组件
 * 显示学习概览、统计信息和今日任务
 */
const Dashboard: React.FC<DashboardProps> = ({
  currentPlan,
  wordBooks,
  onStartStudy,
  onCreatePlan
}) => {
  const [todayTask, setTodayTask] = useState<TodayTask | null>(null);
  const [studyStats, setStudyStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentPlan, wordBooks]);

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
   * 在 Dashboard 上直接重置当前计划对应词书的学习进度
   */
  const handleResetProgress = () => {
    if (!currentPlan) return;
    const book = wordBooks.find(b => b.id === currentPlan.wordBookId);
    if (!book) return;
    const ok = window.confirm(`确定要重置词书 "${book.name}" 的学习进度吗？此操作不可撤销。`);
    if (!ok) return;

    const ids = book.words.map(w => w.id);
    studyRecordStorage.deleteByWordIds(ids);
    // 重新加载数据
    loadDashboardData();
    alert('已重置该词书的学习进度。');
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
                  {todayTask.completedNew + todayTask.completedReview} / {todayTask.totalNew + todayTask.totalReview}
                </span>
              ) : (
                <span className="progress-text">今日已完成</span>
              )}
            </div>
          </div>

          <div className="task-grid">
            <div className="task-item new-words">
              <div className="task-icon">
                <BookOpen size={24} />
              </div>
              <div className="task-content">
                <h3 className="task-label">新词学习</h3>
                <p className="task-count">
                  {todayTask.completedNew} / {todayTask.totalNew}
                </p>
              </div>
            </div>

            <div className="task-item review-words">
              <div className="task-icon">
                <TrendingUp size={24} />
              </div>
              <div className="task-content">
                <h3 className="task-label">复习巩固</h3>
                <p className="task-count">
                  {todayTask.completedReview} / {todayTask.totalReview}
                </p>
              </div>
            </div>
          </div>

          <div className="task-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={onStartStudy}
              disabled={todayTask.totalNew + todayTask.totalReview === 0}
            >
              <Play size={20} />
              {todayTask.totalNew + todayTask.totalReview > 0 ? '开始学习' : '今日已完成'}
            </button>
            {/* 重置按钮已移至学习计划信息区域，以免与“开始学习”按钮冲突 */}
          </div>
        </div>
      )}

      {/* 学习统计 */}
      {studyStats && (
        <div className="stats-grid">
          <div className="card stat-card">
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
            </div>
          </div>

          <div className="card stat-card">
            <div className="stat-header">
              <h3 className="stat-title">掌握程度</h3>
              <div className="stat-icon mastery-icon">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">{studyStats.masteryRate}%</div>
              <div className="stat-description">
                已掌握 {studyStats.masteredWords} 个单词
              </div>
            </div>
          </div>

          <div className="card stat-card">
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
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default Dashboard;
