import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../types';
import { Check, X, RotateCcw, Volume2 } from 'lucide-react';

interface SpellingExerciseProps {
  word: Word;
  onComplete: (isCorrect: boolean) => void;
  onRestart: () => void;
  showPronunciation: boolean;
  showExample: boolean;
}

/**
 * 拼写练习组件
 * 看汉语释义拼写英语单词
 */
const SpellingExercise: React.FC<SpellingExerciseProps> = ({
  word,
  onComplete,
  onRestart,
  showPronunciation,
  showExample
}) => {
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUserInput('');
    setShowResult(false);
    setIsCorrect(false);
    setShowHint(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [word]);

  /**
   * 检查拼写是否正确
   */
  const checkSpelling = () => {
    const correctWord = word.word.toLowerCase().trim();
    const userWord = userInput.toLowerCase().trim();
    
    // 允许一定的容错性
    const isExactMatch = correctWord === userWord;
    const isCloseMatch = Math.abs(correctWord.length - userWord.length) <= 1 && 
                        correctWord.includes(userWord) || userWord.includes(correctWord);
    
    const correct = isExactMatch || isCloseMatch;
    setIsCorrect(correct);
    setShowResult(true);
    
    // 延迟调用完成回调
    setTimeout(() => {
      onComplete(correct);
    }, 2000);
  };

  /**
   * 处理键盘事件
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userInput.trim()) {
      checkSpelling();
    }
  };

  /**
   * 播放单词发音（模拟）
   */
  const playPronunciation = () => {
    // 这里可以集成真实的TTS API
    console.log(`Playing pronunciation for: ${word.word}`);
  };

  /**
   * 显示提示
   */
  const showWordHint = () => {
    setShowHint(true);
  };

  return (
    <div className="spelling-exercise">
      <div className="exercise-header">
        <h2 className="exercise-title">拼写练习</h2>
        <div className="exercise-progress">
          <span className="progress-text">根据汉语释义拼写英语单词</span>
        </div>
      </div>

      <div className="exercise-content">
        {/* 汉语释义 */}
        <div className="translation-display">
          <h3 className="translation-title">汉语释义：</h3>
          <p className="translation-text">{word.translation}</p>
        </div>

        {/* 音标显示 */}
        {showPronunciation && word.pronunciation && (
          <div className="pronunciation-display">
            <button className="pronunciation-btn" onClick={playPronunciation}>
              <Volume2 size={16} />
              播放发音
            </button>
            <span className="pronunciation-text">{word.pronunciation}</span>
          </div>
        )}

        {/* 输入区域 */}
        <div className="input-area">
          <div className="input-group">
            <input
              ref={inputRef}
              type="text"
              className={`spelling-input ${showResult ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入英语单词"
              disabled={showResult}
              autoComplete="off"
              spellCheck="false"
            />
            {!showResult && (
              <button 
                className="btn btn-primary"
                onClick={checkSpelling}
                disabled={!userInput.trim()}
              >
                <Check size={16} />
                检查
              </button>
            )}
          </div>
        </div>

        {/* 提示按钮 */}
        {!showHint && !showResult && (
          <div className="hint-area">
            <button className="btn btn-secondary btn-sm" onClick={showWordHint}>
              显示提示
            </button>
          </div>
        )}

        {/* 提示显示 */}
        {showHint && !showResult && (
          <div className="hint-display">
            <p className="hint-text">
              单词长度：{word.word.length} 个字母
            </p>
            <p className="hint-text">
              首字母：{word.word[0].toUpperCase()}
            </p>
          </div>
        )}

        {/* 结果显示 */}
        {showResult && (
          <div className={`result-display ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="result-icon">
              {isCorrect ? <Check size={24} /> : <X size={24} />}
            </div>
            <div className="result-content">
              <h4 className="result-title">
                {isCorrect ? '拼写正确！' : '拼写错误'}
              </h4>
              <p className="result-word">正确答案：{word.word}</p>
              {!isCorrect && userInput && (
                <p className="user-answer">您的答案：{userInput}</p>
              )}
            </div>
          </div>
        )}

        {/* 例句显示 */}
        {showExample && word.example && (
          <div className="example-display">
            <h4 className="example-title">例句：</h4>
            <p className="example-text">{word.example}</p>
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

export default SpellingExercise;
