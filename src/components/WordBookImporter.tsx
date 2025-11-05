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

  // 文件导入自定义名称
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');

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

    // 跳过第一行（如果是标题行）
    const startIndex = lines[0]?.includes('单词') || lines[0]?.includes('word') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];

      // 自动检测分隔符：优先使用逗号，如果没有逗号则使用Tab
      const delimiter = line.includes(',') ? ',' : '\t';
      const parts = line.split(delimiter).map(part => part.trim());

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

      // 使用自定义名称，如果没有则使用文件名
      const defaultName = file.name.replace(/\.[^/.]+$/, '');

      // 如果用户没有填写自定义名称，自动填充文件名
      if (!customName.trim()) {
        setCustomName(defaultName);
      }

      const wordBook: WordBook = {
        id: generateId(),
        name: customName.trim() || defaultName,
        description: customDescription.trim() || `从文件 ${file.name} 导入的词书`,
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
      // 使用最新的自定义名称和描述
      const finalWordBook = {
        ...importResult.wordBook,
        name: customName.trim() || importResult.wordBook.name,
        description: customDescription.trim() || importResult.wordBook.description
      };
      onImport(finalWordBook);
      onClose();
    }
  };

  /**
   * 重置表单
   */
  const handleReset = () => {
    setImportResult(null);
    setManualData({ name: '', description: '', words: '' });
    setCustomName('');
    setCustomDescription('');
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
              {/* 自定义词书信息 */}
              <div className="custom-info-section">
                <div className="form-group">
                  <label htmlFor="custom-name">词书名称（可选）</label>
                  <input
                    id="custom-name"
                    type="text"
                    className="form-input"
                    placeholder="留空则使用文件名"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="custom-desc">词书描述（可选）</label>
                  <input
                    id="custom-desc"
                    type="text"
                    className="form-input"
                    placeholder="留空则自动生成"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                  />
                </div>
              </div>

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
                  <>
                    {/* 显示并允许修改词书信息 */}
                    <div className="result-info-edit">
                      <div className="form-group">
                        <label htmlFor="preview-name">词书名称：</label>
                        <input
                          id="preview-name"
                          type="text"
                          className="form-input"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="请输入词书名称"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="preview-desc">词书描述：</label>
                        <input
                          id="preview-desc"
                          type="text"
                          className="form-input"
                          value={customDescription}
                          onChange={(e) => setCustomDescription(e.target.value)}
                          placeholder="请输入词书描述"
                        />
                      </div>
                    </div>

                    <div className="result-preview">
                      <p>词书预览（共 {importResult.wordBook.words.length} 个单词）：</p>
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
                  </>
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
