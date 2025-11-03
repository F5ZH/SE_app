import { useState, useEffect } from 'react';
import { WordBook, StudyPlan } from './types';
import { wordBookStorage, studyPlanStorage } from './utils/storage';
import { clearCachedTodayWords, generateTodayTask } from './utils/studyPlan';
import { presetWordBooks } from './data/presetWordBooks';
import Header from './components/Header';
import WordBookList from './components/WordBookList';
import StudyPlanCreator from './components/StudyPlanCreator';
import StudySession from './components/StudySession';
import Dashboard from './components/Dashboard';
import DevTools from './components/DevTools';
import WordMateHome from './components/WordMateHome';
import AIStoryGenerator from './components/AIStoryGenerator';
import WordOdyssey from './components/WordOdyssey';
import './App.css';
import './components/Modal.css';

/**
 * 主应用组件
 * 管理应用的整体状态和路由
 */
function App() {
  // 应用状态
  const [currentView, setCurrentView] = useState<'dashboard' | 'wordbooks' | 'study' | 'plan' | 'wordmate' | 'story' | 'odyssey'>('dashboard');
  const [wordBooks, setWordBooks] = useState<WordBook[]>([]);
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化应用数据
  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * 初始化应用数据
   * 加载词书和学习计划
   */
  const initializeApp = async () => {
    try {
      setIsLoading(true);

      // 加载词书数据
      let books = wordBookStorage.getAll();

      // 如果是首次使用，添加预设词书
      if (books.length === 0) {
        books = presetWordBooks;
        wordBookStorage.saveAll(books);
      }

      setWordBooks(books);

      // 加载当前学习计划
      const plan = studyPlanStorage.getCurrent();
      setCurrentPlan(plan);

    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 添加新词书
   */
  const handleAddWordBook = (newBook: WordBook) => {
    const updatedBooks = [...wordBooks, newBook];
    setWordBooks(updatedBooks);
    wordBookStorage.save(newBook);
  };

  /**
   * 删除词书
   */
  const handleDeleteWordBook = (bookId: string) => {
    const updatedBooks = wordBooks.filter(book => book.id !== bookId);
    setWordBooks(updatedBooks);
    wordBookStorage.delete(bookId);
  };

  /**
   * 创建学习计划
   */
  const handleCreateStudyPlan = (plan: StudyPlan) => {
    studyPlanStorage.save(plan);
    studyPlanStorage.setCurrent(plan.id);
    setCurrentPlan(plan);

    // 清空今日单词列表缓存，以便重新生成
    clearCachedTodayWords();

    setCurrentView('dashboard');
  };

  /**
   * 开始学习
   */
  const handleStartStudy = () => {
    if (currentPlan) {
      setCurrentView('study');
    }
  };

  /**
   * 获取今天要学习的单词（用于 AI 故事和 Word Odyssey）
   */
  const getTodayWords = () => {
    if (!currentPlan) return [];
    
    // 获取对应的词书
    const wordBook = wordBooks.find(wb => wb.id === currentPlan.wordBookId);
    if (!wordBook) return [];
    
    // 生成今日任务并返回单词列表
    const todayTask = generateTodayTask(wordBook, currentPlan);
    return todayTask ? [...todayTask.newWords, ...todayTask.reviewWords] : [];
  };

  /**
   * 处理学习计划导航
   */
  const handlePlanNavigation = () => {
    if (currentPlan) {
      // 有现有计划，显示确认对话框
      const confirmed = window.confirm(
        '您已有一个学习计划，修改计划将重置当前的学习进度。\n\n确定要继续吗？'
      );
      if (confirmed) {
        setCurrentView('plan');
      }
    } else {
      // 没有现有计划，直接进入创建界面
      setCurrentView('plan');
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onPlanNavigation={handlePlanNavigation}
        hasActivePlan={!!currentPlan}
      />

      <main className="main-content">
        {currentView === 'dashboard' && (
          <Dashboard
            currentPlan={currentPlan}
            wordBooks={wordBooks}
            onStartStudy={handleStartStudy}
            onCreatePlan={handlePlanNavigation}
            onOpenWordMate={() => setCurrentView('wordmate')}
          />
        )}

        {currentView === 'wordmate' && (
          <WordMateHome
            onStartBasicStudy={handleStartStudy}
            onStartStory={() => setCurrentView('story')}
            onStartOdyssey={() => setCurrentView('odyssey')}
            onBack={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'story' && currentPlan && (
          <AIStoryGenerator
            words={getTodayWords()}
            onClose={() => setCurrentView('wordmate')}
          />
        )}

        {currentView === 'odyssey' && currentPlan && (
          <WordOdyssey
            words={getTodayWords()}
            onClose={() => setCurrentView('wordmate')}
          />
        )}

        {currentView === 'wordbooks' && (
          <WordBookList
            wordBooks={wordBooks}
            onAddWordBook={handleAddWordBook}
            onDeleteWordBook={handleDeleteWordBook}
          />
        )}

        {currentView === 'plan' && (
          <StudyPlanCreator
            wordBooks={wordBooks}
            onCreatePlan={handleCreateStudyPlan}
            onCancel={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'study' && currentPlan && (
          <StudySession
            plan={currentPlan}
            wordBooks={wordBooks}
            onComplete={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      {/* 开发者工具 */}
      <DevTools onRefresh={initializeApp} />
    </div>
  );
}

export default App;
