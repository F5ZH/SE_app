import { useState } from 'react';
import { WordBook, StudyPlan } from '../types';
import { calculateExpectedEndDate } from '../utils/studyPlan';
import { Calendar, BookOpen, Target, Clock, ArrowLeft } from 'lucide-react';

interface StudyPlanCreatorProps {
  wordBooks: WordBook[];
  onCreatePlan: (plan: StudyPlan) => void;
  onCancel: () => void;
}

/**
 * 学习计划创建组件
 * 允许用户创建新的学习计划
 */
const StudyPlanCreator = ({
  wordBooks,
  onCreatePlan,
  onCancel
}: StudyPlanCreatorProps) => {
  const [selectedWordBook, setSelectedWordBook] = useState<WordBook | null>(null);
  const [dailyNewWords, setDailyNewWords] = useState(20);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 计算预期完成日期
  const expectedEndDate = selectedWordBook ?
    calculateExpectedEndDate(
      selectedWordBook.totalWords,
      dailyNewWords,
      new Date(startDate).getTime()
    ) : null;

  // 计算学习天数
  const studyDays = selectedWordBook ?
    Math.ceil(selectedWordBook.totalWords / dailyNewWords) : 0;

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedWordBook) {
      newErrors.wordBook = '请选择一个词书';
    }

    if (dailyNewWords < 1 || dailyNewWords > 100) {
      newErrors.dailyNewWords = '每日新词量应在1-100之间';
    }

    if (!startDate) {
      newErrors.startDate = '请选择开始日期';
    } else {
      const selectedDate = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.startDate = '开始日期不能早于今天';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 创建学习计划
   */
  const handleCreatePlan = () => {
    if (!validateForm() || !selectedWordBook) return;

    const plan: StudyPlan = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      wordBookId: selectedWordBook.id,
      wordBookName: selectedWordBook.name,
      dailyNewWords,
      startDate: new Date(startDate).getTime(),
      expectedEndDate: expectedEndDate!,
      isActive: true,
      createdAt: Date.now()
    };

    onCreatePlan(plan);
  };

  // generateId 已不再使用

  return (
    <div className="study-plan-creator">
      <div className="creator-header">
        <button className="back-button" onClick={onCancel}>
          <ArrowLeft size={20} />
          返回
        </button>
        <h1 className="creator-title">
          <Target size={24} />
          创建学习计划
        </h1>
        <p className="creator-subtitle">设置您的学习目标和计划</p>
      </div>

      <div className="creator-content">
        {/* 词书选择 */}
        <div className="form-section">
          <h2 className="section-title">
            <BookOpen size={20} />
            选择词书
          </h2>

          <div className="wordbook-selector">
            {wordBooks.map(book => (
              <div
                key={book.id}
                className={`wordbook-option ${selectedWordBook?.id === book.id ? 'selected' : ''}`}
                onClick={() => setSelectedWordBook(book)}
              >
                <div className="option-header">
                  <h3 className="option-title">{book.name}</h3>
                  <div className="option-badge">
                    {book.isPreset ? '预设' : '自定义'}
                  </div>
                </div>
                <p className="option-description">{book.description}</p>
                <div className="option-stats">
                  <span className="stat">
                    <BookOpen size={14} />
                    {book.totalWords} 个单词
                  </span>
                </div>
              </div>
            ))}
          </div>

          {errors.wordBook && (
            <p className="error-message">{errors.wordBook}</p>
          )}
        </div>

        {/* 学习设置 */}
        <div className="form-section">
          <h2 className="section-title">
            <Calendar size={20} />
            学习设置
          </h2>

          <div className="settings-grid">
            <div className="setting-item">
              <label className="label">每日新词量</label>
              <div className="input-group">
                <input
                  type="number"
                  className={`input ${errors.dailyNewWords ? 'input-error' : ''}`}
                  value={dailyNewWords}
                  onChange={(e) => setDailyNewWords(parseInt(e.target.value) || 0)}
                  min="1"
                  max="100"
                />
                <span className="input-suffix">个/天</span>
              </div>
              {errors.dailyNewWords && (
                <p className="error-message">{errors.dailyNewWords}</p>
              )}
              <p className="input-help">
                建议每日学习10-50个新词，根据您的学习能力调整
              </p>
            </div>

            <div className="setting-item">
              <label className="label">开始日期</label>
              <input
                type="date"
                className={`input ${errors.startDate ? 'input-error' : ''}`}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.startDate && (
                <p className="error-message">{errors.startDate}</p>
              )}
            </div>
          </div>
        </div>

        {/* 计划预览 */}
        {selectedWordBook && (
          <div className="form-section">
            <h2 className="section-title">
              <Clock size={20} />
              计划预览
            </h2>

            <div className="plan-preview">
              <div className="preview-card">
                <div className="preview-item">
                  <span className="preview-label">词书名称</span>
                  <span className="preview-value">{selectedWordBook.name}</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">总单词数</span>
                  <span className="preview-value">{selectedWordBook.totalWords} 个</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">每日新词</span>
                  <span className="preview-value">{dailyNewWords} 个</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">预计学习天数</span>
                  <span className="preview-value">{studyDays} 天</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">开始日期</span>
                  <span className="preview-value">
                    {new Date(startDate).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">预期完成</span>
                  <span className="preview-value">
                    {expectedEndDate ? new Date(expectedEndDate).toLocaleDateString('zh-CN') : '-'}
                  </span>
                </div>
              </div>

              <div className="preview-timeline">
                <div className="timeline-item">
                  <div className="timeline-icon start">
                    <Calendar size={16} />
                  </div>
                  <div className="timeline-content">
                    <h4>开始学习</h4>
                    <p>{new Date(startDate).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>

                <div className="timeline-line"></div>

                <div className="timeline-item">
                  <div className="timeline-icon end">
                    <Target size={16} />
                  </div>
                  <div className="timeline-content">
                    <h4>完成学习</h4>
                    <p>{expectedEndDate ? new Date(expectedEndDate).toLocaleDateString('zh-CN') : '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="creator-actions">
        <button className="btn btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleCreatePlan}
          disabled={!selectedWordBook}
        >
          <Target size={20} />
          创建学习计划
        </button>
      </div>
    </div>
  );
};

export default StudyPlanCreator;
