import React, { useState } from 'react';
import { WordBook } from '../types';
import { Trash2, BookOpen, Calendar, Users, Eye } from 'lucide-react';

interface WordBookCardProps {
  wordBook: WordBook;
  onDelete: () => void;
}

/**
 * 词书卡片组件
 * 显示词书的基本信息和操作按钮
 */
const WordBookCard: React.FC<WordBookCardProps> = ({ wordBook, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /**
   * 处理删除确认
   */
  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // 3秒后自动取消确认状态
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  /**
   * 格式化创建时间
   */
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`wordbook-card ${wordBook.isPreset ? 'preset' : 'custom'}`}>
      {/* 词书头部 */}
      <div className="card-header">
        <div className="book-info">
          <div className="book-icon">
            <BookOpen size={20} />
          </div>
          <div className="book-title">
            <h3 className="title">{wordBook.name}</h3>
            {wordBook.description && (
              <p className="description">{wordBook.description}</p>
            )}
          </div>
        </div>
        
        <div className="book-badge">
          {wordBook.isPreset ? (
            <span className="badge badge-primary">预设</span>
          ) : (
            <span className="badge badge-success">自定义</span>
          )}
        </div>
      </div>

      {/* 词书统计 */}
      <div className="card-stats">
        <div className="stat-item">
          <div className="stat-icon">
            <BookOpen size={16} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{wordBook.totalWords}</span>
            <span className="stat-label">单词数</span>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">
            <Calendar size={16} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatDate(wordBook.createdAt)}</span>
            <span className="stat-label">创建时间</span>
          </div>
        </div>
      </div>

      {/* 词书预览 */}
      <div className="card-preview">
        <h4 className="preview-title">词汇预览</h4>
        <div className="word-list">
          {wordBook.words.slice(0, 3).map((word, index) => (
            <div key={word.id} className="word-item">
              <span className="word-text">{word.word}</span>
              <span className="word-translation">{word.translation}</span>
            </div>
          ))}
          {wordBook.words.length > 3 && (
            <div className="word-more">
              还有 {wordBook.words.length - 3} 个单词...
            </div>
          )}
        </div>
      </div>

      {/* 卡片操作 */}
      <div className="card-actions">
        <button className="btn btn-secondary btn-sm">
          <Eye size={14} />
          预览
        </button>
        
        {!wordBook.isPreset && (
          <button
            className={`btn btn-sm ${showDeleteConfirm ? 'btn-danger' : 'btn-secondary'}`}
            onClick={handleDelete}
          >
            <Trash2 size={14} />
            {showDeleteConfirm ? '确认删除' : '删除'}
          </button>
        )}
      </div>
    </div>
  );
};

export default WordBookCard;
