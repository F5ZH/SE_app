import React, { useState, useRef } from 'react';
import { WordBook, Word } from '../types';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

interface WordBookImporterProps {
  onImport: (wordBook: WordBook) => void;
  onClose: () => void;
}

/**
 * 词书导入组件
 * 支持从文件导入词书数据
 */
const WordBookImporter: React.FC<WordBookImporterProps> = ({ onImport, onClose }) => {
  const [importMethod, setImportMethod] = useState<'file' | 'manual'>('file');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    wordBook?: WordBook;
  } | null>(null);
  
  // 手动输入状态
  const [manualData, setManualData] = useState({
    name: '',
    description: '',
    words: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 生成唯一ID
   */
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  /**
   * 解析单词数据
   */
  const parseWords = (text: string): Word[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const words: Word[] = [];

    for (const line of lines) {
      const parts = line.split('\t').map(part => part.trim());
      
      if (parts.length >= 2) {
        const word: Word = {
          id: generateId(),
          word: parts[0],
          translation: parts[1],
          pronunciation: parts[2] || undefined,
          example: parts[3] || undefined,
          difficulty: parts[4] ? parseInt(parts[4]) : 3,
          createdAt: Date.now()
        };
        words.push(word);
      }
    }

    return words;
  };

  /**
   * 处理文件导入
   */
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const words = parseWords(text);

      if (words.length === 0) {
        throw new Error('文件中没有找到有效的单词数据');
      }

      const wordBook: WordBook = {
        id: generateId(),
        name: file.name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
        description: `从文件 ${file.name} 导入的词书`,
        words,
        totalWords: words.length,
        isPreset: false,
        createdAt: Date.now()
      };

      setImportResult({
        success: true,
        message: `成功导入 ${words.length} 个单词`,
        wordBook
      });

    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : '导入失败'
      });
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * 处理手动导入
   */
  const handleManualImport = () => {
    if (!manualData.name.trim() || !manualData.words.trim()) {
      setImportResult({
        success: false,
        message: '请填写词书名称和单词数据'
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const words = parseWords(manualData.words);

      if (words.length === 0) {
        throw new Error('没有找到有效的单词数据');
      }

      const wordBook: WordBook = {
        id: generateId(),
        name: manualData.name.trim(),
        description: manualData.description.trim() || undefined,
        words,
        totalWords: words.length,
        isPreset: false,
        createdAt: Date.now()
      };

      setImportResult({
        success: true,
        message: `成功创建词书，包含 ${words.length} 个单词`,
        wordBook
      });

    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : '创建失败'
      });
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * 确认导入
   */
  const handleConfirmImport = () => {
    if (importResult?.wordBook) {
      onImport(importResult.wordBook);
      onClose();
    }
  };

  /**
   * 重置表单
   */
  const handleReset = () => {
    setImportResult(null);
    setManualData({ name: '', description: '', words: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="importer-overlay">
      <div className="importer-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            <Upload size={20} />
            导入词书
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {/* 导入方式选择 */}
          <div className="import-methods">
            <button
              className={`method-button ${importMethod === 'file' ? 'active' : ''}`}
              onClick={() => setImportMethod('file')}
            >
              <FileText size={16} />
              文件导入
            </button>
            <button
              className={`method-button ${importMethod === 'manual' ? 'active' : ''}`}
              onClick={() => setImportMethod('manual')}
            >
              <FileText size={16} />
              手动输入
            </button>
          </div>

          {/* 文件导入 */}
          {importMethod === 'file' && (
            <div className="file-import">
              <div className="file-upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileImport}
                  className="file-input"
                  id="file-input"
                />
                <label htmlFor="file-input" className="file-label">
                  <Upload size={24} />
                  <span>点击选择文件或拖拽文件到此处</span>
                  <small>支持 .txt 和 .csv 格式</small>
                </label>
              </div>
              
              <div className="file-format-help">
                <h4>文件格式说明：</h4>
                <p>每行一个单词，使用制表符分隔各字段：</p>
                <code>
                  单词	翻译	音标	例句	难度等级
                </code>
                <p>示例：</p>
                <code>
                  abandon	v. 放弃，抛弃	/əˈbændən/	He had to abandon his car.	3
                </code>
              </div>
            </div>
          )}

          {/* 手动输入 */}
          {importMethod === 'manual' && (
            <div className="manual-import">
              <div className="form-group">
                <label className="label">词书名称 *</label>
                <input
                  type="text"
                  className="input"
                  value={manualData.name}
                  onChange={(e) => setManualData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入词书名称"
                />
              </div>

              <div className="form-group">
                <label className="label">词书描述</label>
                <input
                  type="text"
                  className="input"
                  value={manualData.description}
                  onChange={(e) => setManualData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入词书描述（可选）"
                />
              </div>

              <div className="form-group">
                <label className="label">单词数据 *</label>
                <textarea
                  className="input"
                  rows={10}
                  value={manualData.words}
                  onChange={(e) => setManualData(prev => ({ ...prev, words: e.target.value }))}
                  placeholder="请输入单词数据，每行一个单词，格式：单词	翻译	音标	例句	难度等级"
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleManualImport}
                disabled={isImporting}
              >
                {isImporting ? '处理中...' : '创建词书'}
              </button>
            </div>
          )}

          {/* 导入结果 */}
          {importResult && (
            <div className={`import-result ${importResult.success ? 'success' : 'error'}`}>
              <div className="result-icon">
                {importResult.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              </div>
              <div className="result-content">
                <p className="result-message">{importResult.message}</p>
                {importResult.success && importResult.wordBook && (
                  <div className="result-preview">
                    <p>词书预览：</p>
                    <div className="preview-words">
                      {importResult.wordBook.words.slice(0, 3).map(word => (
                        <span key={word.id} className="preview-word">
                          {word.word} - {word.translation}
                        </span>
                      ))}
                      {importResult.wordBook.words.length > 3 && (
                        <span className="preview-more">
                          还有 {importResult.wordBook.words.length - 3} 个单词...
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={handleReset}>
            重置
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          {importResult?.success && (
            <button className="btn btn-primary" onClick={handleConfirmImport}>
              确认导入
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordBookImporter;
