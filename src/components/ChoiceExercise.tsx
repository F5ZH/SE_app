import React, { useState, useEffect } from 'react';
import { Word } from '../types';
import { Check, X, RotateCcw } from 'lucide-react';
import { speakWord } from '../utils/speech';

interface ChoiceExerciseProps {
  word: Word;
  choices: string[];
  correctAnswer: string;
  onComplete: (isCorrect: boolean) => void;
  onRestart: () => void;
  showPronunciation: boolean;
  showExample: boolean;
}

/**
 * 选择题练习组件
 * 看英语选择汉语释义（四选一）
 */
const ChoiceExercise: React.FC<ChoiceExerciseProps> = ({
  word,
  choices,
  correctAnswer,
  onComplete,
  onRestart,
  showPronunciation,
  showExample
}) => {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [shuffledChoices, setShuffledChoices] = useState<string[]>([]);

  useEffect(() => {
    // 重新打乱选项顺序
    const shuffled = [...choices].sort(() => Math.random() - 0.5);
    setShuffledChoices(shuffled);
    setSelectedChoice(null);
    setShowResult(false);
    setIsCorrect(false);
  }, [word, choices]);

  /**
   * 选择答案
   */
  const handleChoiceSelect = (choice: string) => {
    if (showResult) return;
    
    setSelectedChoice(choice);
    const correct = choice === correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    // 回答后自动朗读
    speakWord(word.word);
    
    // 延迟调用完成回调
    setTimeout(() => {
      onComplete(correct);
    }, 2000);
  };

  /**
   * 获取选项样式类名
   */
  const getChoiceClassName = (choice: string) => {
    if (!showResult) {
      return `choice-option ${selectedChoice === choice ? 'selected' : ''}`;
    }
    
    if (choice === correctAnswer) {
      return 'choice-option correct';
    }
    
    if (choice === selectedChoice && choice !== correctAnswer) {
      return 'choice-option incorrect';
    }
    
    return 'choice-option disabled';
  };

  return (
    <div className="choice-exercise">
      <div className="exercise-header">
        <h2 className="exercise-title">选择题练习</h2>
        <div className="exercise-progress">
          <span className="progress-text">选择正确的汉语释义</span>
        </div>
      </div>

      <div className="exercise-content">
        {/* 英语单词 */}
        <div className="word-display">
          <h3 className="word-text">{word.word}</h3>
        </div>

        {/* 例句显示 - 作为提示信息 */}
        {word.example && (
          <div className="example-display">
            <h4 className="example-title">例句：</h4>
            <p className="example-text">{word.example}</p>
          </div>
        )}

        {/* 选项区域 */}
        <div className="choices-area">
          <h4 className="choices-title">请选择正确的汉语释义：</h4>
          <div className="choices-grid">
            {shuffledChoices.map((choice, index) => (
              <button
                key={index}
                className={getChoiceClassName(choice)}
                onClick={() => handleChoiceSelect(choice)}
                disabled={showResult}
              >
                <span className="choice-letter">{String.fromCharCode(65 + index)}</span>
                <span className="choice-text">{choice}</span>
                {showResult && choice === correctAnswer && (
                  <Check size={16} className="choice-icon correct-icon" />
                )}
                {showResult && choice === selectedChoice && choice !== correctAnswer && (
                  <X size={16} className="choice-icon incorrect-icon" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 结果显示 */}
        {showResult && (
          <div className={`result-display ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="result-icon">
              {isCorrect ? <Check size={24} /> : <X size={24} />}
            </div>
            <div className="result-content">
              <h4 className="result-title">
                {isCorrect ? '回答正确！' : '回答错误'}
              </h4>
              <p className="result-answer">正确答案：{correctAnswer}</p>
              {!isCorrect && selectedChoice && (
                <p className="user-answer">您的答案：{selectedChoice}</p>
              )}
            </div>
          </div>
        )}

        {/* 回答后显示音标 */}
        {showResult && word.pronunciation && (
          <div className="pronunciation-result">
            <p className="pronunciation-result-text">
              音标：{word.pronunciation}
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="exercise-actions">
          <button className="btn btn-secondary" onClick={onRestart}>
            <RotateCcw size={16} />
            重新练习
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChoiceExercise;
