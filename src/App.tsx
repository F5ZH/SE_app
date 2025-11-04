// src/App.tsx (已合并登录功能)

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
import WordMateHome from './components/WordMateHome';
import AuthPage from './pages/AuthPage'; // 1. 引入 AuthPage
import './App.css';
import './components/Modal.css';
// 2. AuthPage.css 已经在 main.tsx 中引入

function App() {
  // 3. 核心状态：用 token 判断是否登录
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // 你原有的状态
  const [currentView, setCurrentView] = useState<'dashboard' | 'wordbooks' | 'study' | 'plan' | 'wordmate'>('dashboard');
  const [wordBooks, setWordBooks] = useState<WordBook[]>([]);
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setWordMateActivity] = useState<'story' | 'adventure' | 'basic' | null>(null);

  // 4. 应用加载时，检查 token 并加载数据
  useEffect(() => {
    if (token) {
      // 只有在登录后才加载应用数据
      initializeApp();
    } else {
      // 如果没有 token，停止加载，准备显示登录页
      setIsLoading(false);
    }
  }, [token]); // 当 token 变化时（登录或登出），重新执行

  /**
   * 初始化应用数据
   * 加载词书和学习计划
   */
  const initializeApp = async () => {
    try {
      setIsLoading(true);
      // TODO: 将来，这些数据应该从后端获取
      let books = wordBookStorage.getAll();
      if (books.length === 0) {
        books = presetWordBooks;
        wordBookStorage.saveAll(books);
      }
      setWordBooks(books);

      const plan = studyPlanStorage.getCurrent();
      setCurrentPlan(plan);

    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. 登录处理：由 AuthPage 调用
  const handleLogin = (receivedToken: string) => {
    localStorage.setItem('token', receivedToken); // 把 "通行证" 存到本地
    setToken(receivedToken); // 更新状态，触发 App 重新渲染
  };

  // 6. 登出处理：由 Header 调用
  const handleLogout = () => {
    localStorage.removeItem('token'); // 丢掉 "通行证"
    setToken(null); // 更新状态，触发 App 重新渲染
    // 重置所有状态
    setWordBooks([]);
    setCurrentPlan(null);
    setCurrentView('dashboard');
  };

  // --- 你原有的所有 handle 函数 (保持不变) ---
  const handleAddWordBook = (newBook: WordBook) => {
    const updatedBooks = [...wordBooks, newBook];
    setWordBooks(updatedBooks);
    wordBookStorage.save(newBook);
  };

  const handleDeleteWordBook = (bookId: string) => {
    const updatedBooks = wordBooks.filter(book => book.id !== bookId);
    setWordBooks(updatedBooks);
    wordBookStorage.delete(bookId);
  };

  const handleCreateStudyPlan = (plan: StudyPlan) => {
    studyPlanStorage.save(plan);
    studyPlanStorage.setCurrent(plan.id);
    setCurrentPlan(plan);
    clearCachedTodayWords();
    setCurrentView('dashboard');
  };

  const handleStartStudy = () => {
    if (currentPlan) {
      setCurrentView('study');
    }
  };

  const handlePlanNavigation = () => {
    if (currentPlan) {
      const confirmed = window.confirm(
        '您已有一个学习计划，修改计划将重置当前的学习进度。\n\n确定要继续吗？'
      );
      if (confirmed) {
        setCurrentView('plan');
      }
    } else {
      setCurrentView('plan');
    }
  };
  // --- End 原有函数 ---

  // 7. 渲染逻辑：根据是否登录显示不同内容

  // 状态 1: 正在加载
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

  // 状态 2: 未登录 (没有 token)
  if (!token) {
    return <AuthPage onLogin={handleLogin} />;
  }

  // 状态 3: 已登录 (有 token)
  // (这部分是你原有的 return 内容，但 Header 多了一个 prop)
  return (
    <div className="app">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onPlanNavigation={handlePlanNavigation}
        hasActivePlan={!!currentPlan}
        onLogout={handleLogout} // 8. 把登出函数传给 Header
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
            onStartActivity={(activityType) => {
              setWordMateActivity(activityType); // 9. 这里的 setWordMateActivity 仍然保留
              if (activityType === 'basic') {
                handleStartStudy();
              } else {
                // TODO: 启动 AI 故事或 Word Odyssey
                setCurrentView('study');
              }
            }}
            onBack={() => setCurrentView('dashboard')}
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