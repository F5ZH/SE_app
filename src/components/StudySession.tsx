import React, { useState, useEffect } from 'react';
import { StudyPlan, WordBook, Word, StudyRecord, StudyMode, StudySessionConfig } from '../types';
import { studyRecordStorage } from '../utils/storage';
import { updateStudyRecord, createStudyRecord, needsReview } from '../utils/ebbinghaus';
import { generateTodayTask } from '../utils/studyPlan';
import { exportTodayWordsToPDF } from '../utils/pdfExport';
import StudyModeSelector from './StudyModeSelector';
import SpellingExercise from './SpellingExercise';
import ChoiceExercise from './ChoiceExercise';
import { Check, X, RotateCcw, ExternalLink, ArrowLeft, Download, Settings } from 'lucide-react';

interface StudySessionProps {
  plan: StudyPlan;
  wordBooks: WordBook[];
  onComplete: () => void;
}

/**
 * 学习会话组件
 * 处理单词学习和复习的核心逻辑
 */
const StudySession: React.FC<StudySessionProps> = ({ plan, wordBooks, onComplete }) => {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [currentRecord, setCurrentRecord] = useState<StudyRecord | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyQueue, setStudyQueue] = useState<Word[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionType, setSessionType] = useState<'new' | 'review'>('new');
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [sessionConfig, setSessionConfig] = useState<StudySessionConfig>({
    mode: StudyMode.WORD_TO_TRANSLATION,
    showPronunciation: true,
    showExample: true,
    autoAdvance: false
  });
  const [choiceOptions, setChoiceOptions] = useState<string[]>([]);
  const [allWords, setAllWords] = useState<Word[]>([]);

  const wordBook = wordBooks.find(book => book.id === plan.wordBookId);

  useEffect(() => {
    initializeSession();
  }, [plan, wordBooks]);

  /**
   * 初始化学习会话
   */
  const initializeSession = async () => {
    try {
      setIsLoading(true);
      
      if (!wordBook) return;

      // 保存所有单词用于生成选择题选项
      setAllWords(wordBook.words);

      // 生成今日任务
      const todayTask = generateTodayTask(wordBook, plan);
      
      // 优先学习新词，然后复习
      const newWords = todayTask.newWords;
      const reviewWords = todayTask.reviewWords;
      
      if (newWords.length > 0) {
        setStudyQueue(newWords);
        setSessionType('new');
      } else if (reviewWords.length > 0) {
        setStudyQueue(reviewWords);
        setSessionType('review');
      } else {
        // 没有学习任务
        setStudyQueue([]);
      }

    } catch (error) {
      console.error('Failed to initialize study session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 加载下一个单词
   */
  const loadNextWord = () => {
    if (studyQueue.length === 0) {
      // 学习完成
      onComplete();
      return;
    }

    const nextWord = studyQueue[0];
    setCurrentWord(nextWord);
    setShowAnswer(false);

    // 生成选择题选项
    if (sessionConfig.mode === StudyMode.WORD_TO_CHOICE) {
      generateChoiceOptions(nextWord);
    }

    // 获取或创建学习记录
    const existingRecord = studyRecordStorage.getByWordId(nextWord.id);
    if (existingRecord) {
      setCurrentRecord(existingRecord);
    } else {
      const newRecord = createStudyRecord(nextWord.id, nextWord.word);
      setCurrentRecord(newRecord);
    }
  };

  /**
   * 生成选择题选项
   */
  const generateChoiceOptions = (word: Word) => {
    const correctAnswer = word.translation;
    const otherWords = allWords
      .filter(w => w.id !== word.id)
      .map(w => w.translation)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const options = [correctAnswer, ...otherWords].sort(() => Math.random() - 0.5);
    setChoiceOptions(options);
  };

  /**
   * 显示答案
   */
  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  /**
   * 处理回答质量评分
   */
  const handleQualityRating = (quality: number) => {
    if (!currentWord || !currentRecord) return;

    // 更新学习记录
    const updatedRecord = updateStudyRecord(currentRecord, quality, sessionConfig.mode);
    studyRecordStorage.save(updatedRecord);

    // 移除当前单词
    const newQueue = studyQueue.slice(1);
    setStudyQueue(newQueue);
    setCompletedCount(prev => prev + 1);

    // 加载下一个单词
    if (sessionConfig.autoAdvance) {
      setTimeout(() => {
        loadNextWord();
      }, 500);
    }
  };

  /**
   * 处理练习完成
   */
  const handleExerciseComplete = (isCorrect: boolean) => {
    const quality = isCorrect ? 4 : 2; // 正确4分，错误2分
    handleQualityRating(quality);
  };

  /**
   * 重新开始当前单词
   */
  const handleRestart = () => {
    setShowAnswer(false);
  };

  /**
   * 查词功能
   */
  const handleLookupWord = () => {
    if (!currentWord) return;
    
    // 打开词典网站
    const searchUrl = `https://www.merriam-webster.com/dictionary/${encodeURIComponent(currentWord.word)}`;
    window.open(searchUrl, '_blank');
  };

  /**
   * 导出今日单词表为PDF
   */
  const handleExportPDF = () => {
    if (!wordBook) return;
    
    const todayTask = generateTodayTask(wordBook, plan);
    exportTodayWordsToPDF(todayTask, wordBook.name);
  };

  /**
   * 开始学习
   */
  const handleStartStudy = () => {
    setShowModeSelector(false);
    loadNextWord();
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="study-session">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>准备学习内容...</p>
        </div>
      </div>
    );
  }

  // 显示学习模式选择器
  if (showModeSelector) {
    return (
      <div className="study-session">
        <div className="session-header">
          <button className="back-button" onClick={onComplete}>
            <ArrowLeft size={20} />
            返回
          </button>
          
          <div className="session-info">
            <h1 className="session-title">选择学习模式</h1>
            <p className="session-subtitle">
              词书：{wordBook?.name} | 任务：{studyQueue.length} 个单词
            </p>
          </div>

          <div className="session-actions">
            <button className="btn btn-secondary" onClick={handleExportPDF}>
              <Download size={16} />
              导出PDF
            </button>
          </div>
        </div>

        <StudyModeSelector
          config={sessionConfig}
          onConfigChange={setSessionConfig}
          onStartStudy={handleStartStudy}
        />
      </div>
    );
  }

  // 没有学习任务
  if (studyQueue.length === 0) {
    return (
      <div className="study-session">
        <div className="session-complete">
          <div className="complete-icon">
            <Check size={64} />
          </div>
          <h2 className="complete-title">今日学习完成！</h2>
          <p className="complete-description">
            恭喜您完成了今日的学习任务，继续保持！
          </p>
          <div className="complete-stats">
            <div className="stat-item">
              <span className="stat-number">{completedCount}</span>
              <span className="stat-label">已完成</span>
            </div>
          </div>
          <div className="complete-actions">
            <button className="btn btn-secondary" onClick={handleExportPDF}>
              <Download size={16} />
              导出PDF
            </button>
            <button className="btn btn-primary btn-lg" onClick={onComplete}>
              <ArrowLeft size={20} />
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="study-session">
      {/* 学习进度 */}
      <div className="session-header">
        <button className="back-button" onClick={onComplete}>
          <ArrowLeft size={20} />
          返回
        </button>
        
        <div className="session-info">
          <h1 className="session-title">
            {sessionType === 'new' ? '新词学习' : '复习巩固'} - {
              sessionConfig.mode === StudyMode.WORD_TO_TRANSLATION ? '看英语回忆汉语' :
              sessionConfig.mode === StudyMode.TRANSLATION_TO_WORD ? '看汉语拼写英语' :
              '看英语选择汉语'
            }
          </h1>
          <div className="session-progress">
            <span className="progress-text">
              {completedCount} / {completedCount + studyQueue.length}
            </span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${(completedCount / (completedCount + studyQueue.length)) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="session-actions">
          <button className="btn btn-secondary" onClick={handleExportPDF}>
            <Download size={16} />
            导出PDF
          </button>
          <button className="btn btn-secondary" onClick={() => setShowModeSelector(true)}>
            <Settings size={16} />
            设置
          </button>
        </div>
      </div>

      {/* 根据学习模式渲染不同的练习组件 */}
      {currentWord && (
        <>
          {sessionConfig.mode === StudyMode.WORD_TO_TRANSLATION && (
            <div className="word-card">
              <div className="card-header">
                <div className="word-info">
                  <h2 className="word-text">{currentWord.word}</h2>
                  {sessionConfig.showPronunciation && currentWord.pronunciation && (
                    <p className="word-pronunciation">{currentWord.pronunciation}</p>
                  )}
                </div>
                
                <div className="word-actions">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={handleLookupWord}
                    title="查词"
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>

              {!showAnswer ? (
                <div className="card-content">
                  <div className="word-prompt">
                    <p className="prompt-text">请回忆这个单词的含义</p>
                    <button 
                      className="btn btn-primary"
                      onClick={handleShowAnswer}
                    >
                      显示答案
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card-content">
                  <div className="word-answer">
                    <h3 className="answer-title">翻译：</h3>
                    <p className="answer-translation">{currentWord.translation}</p>
                    
                    {sessionConfig.showExample && currentWord.example && (
                      <div className="word-example">
                        <h4 className="example-title">例句：</h4>
                        <p className="example-text">{currentWord.example}</p>
                      </div>
                    )}

                    <div className="quality-rating">
                      <h4 className="rating-title">请评价您的掌握程度：</h4>
                      <div className="rating-buttons">
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleQualityRating(1)}
                        >
                          <X size={16} />
                          完全不会
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleQualityRating(2)}
                        >
                          有点印象
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleQualityRating(3)}
                        >
                          基本掌握
                        </button>
                        <button 
                          className="btn btn-success"
                          onClick={() => handleQualityRating(4)}
                        >
                          熟练掌握
                        </button>
                        <button 
                          className="btn btn-success"
                          onClick={() => handleQualityRating(5)}
                        >
                          <Check size={16} />
                          完全掌握
                        </button>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button 
                        className="btn btn-secondary"
                        onClick={handleRestart}
                      >
                        <RotateCcw size={16} />
                        重新学习
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {sessionConfig.mode === StudyMode.TRANSLATION_TO_WORD && (
            <SpellingExercise
              word={currentWord}
              onComplete={handleExerciseComplete}
              onRestart={handleRestart}
              showPronunciation={sessionConfig.showPronunciation}
              showExample={sessionConfig.showExample}
            />
          )}

          {sessionConfig.mode === StudyMode.WORD_TO_CHOICE && (
            <ChoiceExercise
              word={currentWord}
              choices={choiceOptions}
              correctAnswer={currentWord.translation}
              onComplete={handleExerciseComplete}
              onRestart={handleRestart}
              showPronunciation={sessionConfig.showPronunciation}
              showExample={sessionConfig.showExample}
            />
          )}
        </>
      )}

      {/* 学习提示 */}
      <div className="study-tips">
        <h3 className="tips-title">学习提示</h3>
        <ul className="tips-list">
          <li>根据艾宾浩斯遗忘曲线，系统会自动安排复习时间</li>
          <li>诚实评价您的掌握程度，有助于优化学习计划</li>
          <li>建议每天坚持学习，保持学习节奏</li>
          <li>回答错误会增加生词标记，提高复习频率</li>
        </ul>
      </div>
    </div>
  );
};

export default StudySession;
