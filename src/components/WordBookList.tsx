import React, { useState } from 'react';
import { WordBook } from '../types';
import WordBookCard from './WordBookCard';
import WordBookImporter from './WordBookImporter';
import { Plus, Upload, BookOpen } from 'lucide-react';

interface WordBookListProps {
  wordBooks: WordBook[];
  onAddWordBook: (wordBook: WordBook) => void;
  onDeleteWordBook: (bookId: string) => void;
}

/**
 * 词书列表组件
 * 显示所有词书，支持导入新词书
 */
const WordBookList: React.FC<WordBookListProps> = ({
  wordBooks,
  onAddWordBook,
  onDeleteWordBook
}) => {
  const [showImporter, setShowImporter] = useState(false);
  const [filter, setFilter] = useState<'all' | 'preset' | 'custom'>('all');

  // 过滤词书
  const filteredWordBooks = wordBooks.filter(book => {
    switch (filter) {
      case 'preset':
        return book.isPreset;
      case 'custom':
        return !book.isPreset;
      default:
        return true;
    }
  });

  // 统计信息
  const stats = {
    total: wordBooks.length,
    preset: wordBooks.filter(book => book.isPreset).length,
    custom: wordBooks.filter(book => !book.isPreset).length,
    totalWords: wordBooks.reduce((sum, book) => sum + book.totalWords, 0)
  };

  return (
    <div className="wordbook-list">
      {/* 页面标题和统计 */}
      <div className="page-header">
        <div className="page-title">
          <h1 className="title">
            <BookOpen size={28} />
            词书管理
          </h1>
          <p className="subtitle">管理您的词汇书，导入新的学习内容</p>
        </div>
        
        <div className="page-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">词书总数</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.totalWords}</span>
            <span className="stat-label">单词总数</span>
          </div>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="action-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部 ({stats.total})
          </button>
          <button
            className={`filter-tab ${filter === 'preset' ? 'active' : ''}`}
            onClick={() => setFilter('preset')}
          >
            预设 ({stats.preset})
          </button>
          <button
            className={`filter-tab ${filter === 'custom' ? 'active' : ''}`}
            onClick={() => setFilter('custom')}
          >
            自定义 ({stats.custom})
          </button>
        </div>

        <div className="action-buttons">
          <button
            className="btn btn-secondary"
            onClick={() => setShowImporter(true)}
          >
            <Upload size={16} />
            导入词书
          </button>
        </div>
      </div>

      {/* 词书网格 */}
      {filteredWordBooks.length > 0 ? (
        <div className="wordbook-grid">
          {filteredWordBooks.map(book => (
            <WordBookCard
              key={book.id}
              wordBook={book}
              onDelete={() => onDeleteWordBook(book.id)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <BookOpen size={64} />
          </div>
          <h3 className="empty-title">
            {filter === 'all' ? '暂无词书' : 
             filter === 'preset' ? '暂无预设词书' : '暂无自定义词书'}
          </h3>
          <p className="empty-description">
            {filter === 'all' ? '点击"导入词书"开始添加您的第一个词书' :
             filter === 'preset' ? '预设词书将在应用首次启动时自动加载' :
             '导入您自己的词书文件'}
          </p>
          {filter === 'custom' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowImporter(true)}
            >
              <Plus size={16} />
              导入词书
            </button>
          )}
        </div>
      )}

      {/* 词书导入器 */}
      {showImporter && (
        <WordBookImporter
          onImport={onAddWordBook}
          onClose={() => setShowImporter(false)}
        />
      )}
    </div>
  );
};

export default WordBookList;
