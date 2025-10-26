import React, { useState, useEffect } from 'react';
import { StudyPlan, WordBook, Word, StudyRecord, StudyMode, StudySessionConfig } from '../types';
import { studyRecordStorage } from '../utils/storage';
import { updateStudyRecord, createStudyRecord } from '../utils/ebbinghaus';
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
  const [completedWords, setCompletedWords] = useState<Set<string>>(new Set());
  const [totalWords, setTotalWords] = useState(0); // 初始单词总数
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

      // 获取今天的开始时间戳
      const todayStart = new Date().setHours(0, 0, 0, 0);
      
      // 过滤掉今天已经完成的单词（检查 lastReviewed 是否在今天，且 reviewCount > 0）
      const filterCompletedToday = (words: Word[]) => {
        return words.filter(word => {
          const record = studyRecordStorage.getByWordId(word.id);
          // 如果没有记录，或者记录不是今天创建的，或者 reviewCount 为 0，则保留
          return !record || record.lastReviewed < todayStart || record.reviewCount === 0;
        });
      };

      // 优先学习新词，然后复习
      const newWords = filterCompletedToday(todayTask.newWords);
      const reviewWords = filterCompletedToday(todayTask.reviewWords);

      if (newWords.length > 0) {
        setStudyQueue(newWords);
        setTotalWords(newWords.length); // 设置初始总数
        setSessionType('new');
      } else if (reviewWords.length > 0) {
        setStudyQueue(reviewWords);
        setTotalWords(reviewWords.length); // 设置初始总数
        setSessionType('review');
      } else {
        // 没有学习任务
        setStudyQueue([]);
        setTotalWords(0);
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

    // 检查当前单词是否已经完成过
    if (completedWords.has(currentWord.id)) {
      // 如果已完成，只更新记录，不增加计数
      const updatedRecord = updateStudyRecord(currentRecord, quality, sessionConfig.mode);
      studyRecordStorage.save(updatedRecord);
      return;
    }

    // 更新学习记录
    const updatedRecord = updateStudyRecord(currentRecord, quality, sessionConfig.mode);
    studyRecordStorage.save(updatedRecord);

    // 标记当前单词为已完成
    const newCompletedWords = new Set([...completedWords, currentWord.id]);
    setCompletedWords(newCompletedWords);
    setCompletedCount(prev => prev + 1);

    // 决定如何切换到下一个单词：
    // - 如果开启自动前进，延迟 500ms 后再切换（给用户短暂查看答案的时间）
    // - 否则立即切换到下一个单词，避免需要额外交互导致重复显示当前单词
    const switchToNext = () => {
      // 查找下一个未完成的单词（使用最新的 completed 集合）
      const nextIncompleteWord = studyQueue.find(word => !newCompletedWords.has(word.id));

      if (!nextIncompleteWord) {
        // 所有单词都已完成
        onComplete();
        return;
      }

      setCurrentWord(nextIncompleteWord);
      setShowAnswer(false);

      // 生成选择题选项（若当前模式为选择题）
      if (sessionConfig.mode === StudyMode.WORD_TO_CHOICE) {
        generateChoiceOptions(nextIncompleteWord);
      }

      // 获取或创建学习记录并设置
      const existing = studyRecordStorage.getByWordId(nextIncompleteWord.id);
      if (existing) {
        setCurrentRecord(existing);
      } else {
        const newRecord = createStudyRecord(nextIncompleteWord.id, nextIncompleteWord.word);
        setCurrentRecord(newRecord);
      }
    };

    if (sessionConfig.autoAdvance) {
      setTimeout(switchToNext, 500);
    } else {
      switchToNext();
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
  const handleExportPDF = async () => {
    if (!wordBook) return;

    try {
      const todayTask = generateTodayTask(wordBook, plan);
      await exportTodayWordsToPDF(todayTask, wordBook.name);
    } catch (error) {
      console.error('导出PDF失败:', error);
      alert('导出PDF失败，请重试');
    }
  };

  /**
   * 重置词书学习进度（调试用）
   */
  const handleResetProgress = () => {
    if (!wordBook) return;

    const confirmed = window.confirm('确定要重置此词书的学习进度吗？此操作不可撤销。');
    if (!confirmed) return;

    // 删除该词书所有单词对应的学习记录
    const wordIds = wordBook.words.map(w => w.id);
    studyRecordStorage.deleteByWordIds(wordIds);

    // 重置本地会话状态并重新初始化
    setCompletedCount(0);
    setCompletedWords(new Set());
    setTotalWords(0);
    setCurrentWord(null);
    setCurrentRecord(null);
    setStudyQueue([]);
    setShowModeSelector(true);
    initializeSession();

    alert('学习进度已重置。');
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
              {completedCount} / {totalWords}
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${totalWords > 0 ? (completedCount / totalWords) * 100 : 0}%`
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
          <button className="btn btn-danger" onClick={handleResetProgress} title="重置此词书的学习进度">
            <RotateCcw size={16} />
            重置进度
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
