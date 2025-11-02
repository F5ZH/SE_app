import { useState, useEffect } from 'react';
import { WordBook, StudyPlan } from './types';
import { wordBookStorage, studyPlanStorage } from './utils/storage';
import { clearCachedTodayWords } from './utils/studyPlan';
import { presetWordBooks } from './data/presetWordBooks';
import Header from './components/Header';
import WordBookList from './components/WordBookList';
import StudyPlanCreator from './components/StudyPlanCreator';
import StudySession from './components/StudySession';
import Dashboard from './components/Dashboard';
import DevTools from './components/DevTools';

// 新增导入
import Auth from './components/Auth';
import { authService } from './utils/auth';

import './App.css';
import './components/Modal.css';
/**
 * 主应用组件
 * 管理应用的整体状态和路由
 */
function App() {
  // 应用状态
  const [currentUser, setCurrentUser] = useState<string | null>(null); // 新增：当前用户状态
  const [currentView, setCurrentView] = useState<'dashboard' | 'wordbooks' | 'study' | 'plan'>('dashboard');
  const [wordBooks, setWordBooks] = useState<WordBook[]>([]);
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化应用数据
  useEffect(() => {
    // 检查是否存在已登录用户
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      initializeApp();
    } else {
      setIsLoading(false); // 没有用户，停止加载，显示登录页
    }
  }, []); // 仅在应用启动时运行一次
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

  // ... (在 initializeApp 函数的大括号 } 之后)

  /**
   * 处理登录成功
   */
  const handleLoginSuccess = (username: string) => {
    setCurrentUser(username);
    initializeApp(); // 登录成功后，初始化该用户的数据
  };

  /**
   * 处理退出登录
   */
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    // 重置应用状态
    setWordBooks([]);
    setCurrentPlan(null);
    setCurrentView('dashboard');
    clearCachedTodayWords(); // 清除会话缓存
  };

  /**
   * 添加新词书
   */
  // ... (handleAddWordBook, handleDeleteWordBook 等函数保持原样)

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
  // ... (在 handlePlanNavigation 函数的大括号 } 之后)

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

  // 如果没有登录用户，显示 Auth 界面
  if (!currentUser) {
    return (
      <Auth onLoginSuccess={handleLoginSuccess} />
    );
  }

  // 用户已登录，显示主应用
  return (
    <div className="app">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onPlanNavigation={handlePlanNavigation}
        hasActivePlan={!!currentPlan}
        username={currentUser} // 传递用户名
        onLogout={handleLogout}  // 传递登出函数
      />

      <main className="main-content">
        {currentView === 'dashboard' && (
          <Dashboard
            currentPlan={currentPlan}
            wordBooks={wordBooks}
            onStartStudy={handleStartStudy}
            onCreatePlan={handlePlanNavigation}
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