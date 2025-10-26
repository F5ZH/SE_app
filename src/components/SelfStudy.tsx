import React, { useState, useEffect } from 'react';
import { StudyPlan, WordBook, Word, TodayTask } from '../types';
import { studyRecordStorage } from '../utils/storage';
import { generateTodayTask } from '../utils/studyPlan';
import { exportTodayWordsToPDF } from '../utils/pdfExport';
import { BookOpen, Download, ArrowLeft, Eye, EyeOff, Languages } from 'lucide-react';

interface SelfStudyProps {
  plan: StudyPlan;
  wordBooks: WordBook[];
  onBack: () => void;
}

/**
 * 自主学习界面组件
 * 展示今日需要学习的所有单词，支持PDF导出
 */
const SelfStudy: React.FC<SelfStudyProps> = ({ plan, wordBooks, onBack }) => {
  const [todayTask, setTodayTask] = useState<TodayTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewWords, setShowNewWords] = useState(true);
  const [showReviewWords, setShowReviewWords] = useState(true);
  const [displayMode, setDisplayMode] = useState<'both' | 'chinese' | 'english'>('both');

  const wordBook = wordBooks.find(book => book.id === plan.wordBookId);

  useEffect(() => {
    loadTodayTask();
  }, [plan, wordBooks]);

  /**
   * 加载今日学习任务
   */
  const loadTodayTask = async () => {
    try {
      setIsLoading(true);
      
      if (!wordBook) return;

      const task = generateTodayTask(wordBook, plan);
      setTodayTask(task);
    } catch (error) {
      console.error('Failed to load today task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 导出PDF
   */
  const handleExportPDF = () => {
    if (!todayTask || !wordBook) return;
    
    exportTodayWordsToPDF(todayTask, wordBook.name);
  };

  /**
   * 获取单词的学习状态
   */
  const getWordStatus = (word: Word) => {
    const record = studyRecordStorage.getByWordId(word.id);
    if (!record) return 'new';
    
    if (record.reviewCount === 0) return 'new';
    if (record.difficultCount > 0) return 'difficult';
    if (record.interval >= 30) return 'mastered';
    return 'learning';
  };

  /**
   * 获取状态标签
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="badge badge-primary">新词</span>;
      case 'difficult':
        return <span className="badge badge-danger">生词</span>;
      case 'mastered':
        return <span className="badge badge-success">已掌握</span>;
      case 'learning':
        return <span className="badge badge-warning">学习中</span>;
      default:
        return null;
    }
  };

  /**
   * 根据显示模式渲染单词内容
   */
  const renderWordContent = (word: Word) => {
    switch (displayMode) {
      case 'chinese':
        return (
          <div className="word-content">
            <p className="word-translation">{word.translation}</p>
            {word.example && (
              <p className="word-example">{word.example}</p>
            )}
          </div>
        );
      case 'english':
        return (
          <div className="word-content">
            <div className="word-main">
              <h3 className="word-text">{word.word}</h3>
              {word.pronunciation && (
                <span className="word-pronunciation">{word.pronunciation}</span>
              )}
            </div>
            {word.example && (
              <p className="word-example">{word.example}</p>
            )}
          </div>
        );
      default: // 'both'
        return (
          <div className="word-content">
            <div className="word-main">
              <h3 className="word-text">{word.word}</h3>
              {word.pronunciation && (
                <span className="word-pronunciation">{word.pronunciation}</span>
              )}
            </div>
            <p className="word-translation">{word.translation}</p>
            {word.example && (
              <p className="word-example">{word.example}</p>
            )}
          </div>
        );
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="self-study">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载学习内容...</p>
        </div>
      </div>
    );
  }

  if (!todayTask || !wordBook) {
    return (
      <div className="self-study">
        <div className="empty-state">
          <div className="empty-icon">
            <BookOpen size={64} />
          </div>
          <h2 className="empty-title">暂无学习内容</h2>
          <p className="empty-description">请先创建学习计划</p>
          <button className="btn btn-primary" onClick={onBack}>
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="self-study">
      {/* 页面头部 */}
      <div className="self-study-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          返回
        </button>
        
        <div className="header-info">
          <h1 className="page-title">自主学习</h1>
          <p className="page-subtitle">
            词书：{wordBook.name} | 今日任务：{todayTask.totalNew + todayTask.totalReview} 个单词
          </p>
        </div>

        <div className="header-actions">
          <div className="display-controls">
            <div className="display-toggle">
              <button 
                className={displayMode === 'both' ? 'active' : ''}
                onClick={() => setDisplayMode('both')}
              >
                全部
              </button>
              <button 
                className={displayMode === 'chinese' ? 'active' : ''}
                onClick={() => setDisplayMode('chinese')}
              >
                只显示中文
              </button>
              <button 
                className={displayMode === 'english' ? 'active' : ''}
                onClick={() => setDisplayMode('english')}
              >
                只显示英文
              </button>
            </div>
          </div>
          
          <button className="btn btn-primary" onClick={handleExportPDF}>
            <Download size={16} />
            导出PDF
          </button>
        </div>
      </div>

      {/* 学习统计 */}
      <div className="study-stats">
        <div className="stat-card">
          <div className="stat-icon new">
            <BookOpen size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{todayTask.totalNew}</div>
            <div className="stat-label">新词学习</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon review">
            <BookOpen size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{todayTask.totalReview}</div>
            <div className="stat-label">复习巩固</div>
          </div>
        </div>
      </div>

      {/* 新词学习 */}
      {todayTask.newWords.length > 0 && (
        <div className="word-section">
          <div className="section-header">
            <h2 className="section-title">
              <BookOpen size={20} />
              新词学习 ({todayTask.newWords.length})
            </h2>
            <button 
              className="toggle-button"
              onClick={() => setShowNewWords(!showNewWords)}
            >
              {showNewWords ? <EyeOff size={16} /> : <Eye size={16} />}
              {showNewWords ? '隐藏' : '显示'}
            </button>
          </div>
          
          {showNewWords && (
            <div className="word-list">
              {todayTask.newWords.map((word, index) => (
                <div key={word.id} className="word-item">
                  <div className="word-number">{index + 1}</div>
                  {renderWordContent(word)}
                  <div className="word-status">
                    {getStatusBadge(getWordStatus(word))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 复习巩固 */}
      {todayTask.reviewWords.length > 0 && (
        <div className="word-section">
          <div className="section-header">
            <h2 className="section-title">
              <BookOpen size={20} />
              复习巩固 ({todayTask.reviewWords.length})
            </h2>
            <button 
              className="toggle-button"
              onClick={() => setShowReviewWords(!showReviewWords)}
            >
              {showReviewWords ? <EyeOff size={16} /> : <Eye size={16} />}
              {showReviewWords ? '隐藏' : '显示'}
            </button>
          </div>
          
          {showReviewWords && (
            <div className="word-list">
              {todayTask.reviewWords.map((word, index) => (
                <div key={word.id} className="word-item">
                  <div className="word-number">{index + 1}</div>
                  {renderWordContent(word)}
                  <div className="word-status">
                    {getStatusBadge(getWordStatus(word))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 学习提示 */}
      <div className="study-tips">
        <h3 className="tips-title">学习提示</h3>
        <ul className="tips-list">
          <li>新词：今日首次学习的单词</li>
          <li>复习：根据艾宾浩斯遗忘曲线安排的复习单词</li>
          <li>生词：标记为困难的单词，会提高复习频率</li>
          <li>已掌握：间隔30天以上的单词</li>
        </ul>
      </div>
    </div>
  );
};

export default SelfStudy;

