import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Word, TodayTask } from '../types';

/**
 * PDF导出工具
 * 用于导出今日学习单词表
 * 使用 HTML to Canvas 方案完美支持中文
 */

/**
 * 创建HTML内容用于PDF导出
 */
function createPDFContent(todayTask: TodayTask, wordBookName: string, date: Date): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    width: 800px;
    padding: 40px;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', 'SimHei', sans-serif;
  `;

  // 标题
  const title = document.createElement('h1');
  title.textContent = '今日学习单词表';
  title.style.cssText = `
    text-align: center;
    color: #2c3e50;
    margin-bottom: 20px;
    font-size: 32px;
    font-weight: bold;
  `;
  container.appendChild(title);

  // 信息栏
  const info = document.createElement('div');
  info.style.cssText = 'margin-bottom: 30px; color: #555; font-size: 14px; border-bottom: 2px solid #eee; padding-bottom: 15px;';
  info.innerHTML = `
    <div style="margin-bottom: 8px;"><strong>词书：</strong>${wordBookName}</div>
    <div><strong>日期：</strong>${date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  `;
  container.appendChild(info);

  // 新词学习部分
  if (todayTask.newWords.length > 0) {
    const newWordsSection = document.createElement('div');
    newWordsSection.style.cssText = 'margin-bottom: 40px; page-break-inside: avoid;';

    const newWordsTitle = document.createElement('h2');
    newWordsTitle.textContent = '📚 新词学习';
    newWordsTitle.style.cssText = `
      color: #428bca;
      font-size: 22px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 3px solid #428bca;
      font-weight: bold;
    `;
    newWordsSection.appendChild(newWordsTitle);

    const table = createWordTable(todayTask.newWords);
    newWordsSection.appendChild(table);
    container.appendChild(newWordsSection);
  }

  // 复习单词部分
  if (todayTask.reviewWords.length > 0) {
    const reviewSection = document.createElement('div');
    reviewSection.style.cssText = 'margin-bottom: 40px; page-break-inside: avoid;';

    const reviewTitle = document.createElement('h2');
    reviewTitle.textContent = '🔄 复习巩固';
    reviewTitle.style.cssText = `
      color: #5cb85c;
      font-size: 22px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 3px solid #5cb85c;
      font-weight: bold;
    `;
    reviewSection.appendChild(reviewTitle);

    const table = createWordTable(todayTask.reviewWords);
    reviewSection.appendChild(table);
    container.appendChild(reviewSection);
  }

  // 学习提示
  const tipsSection = document.createElement('div');
  tipsSection.style.cssText = 'margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #428bca;';

  const tipsTitle = document.createElement('h3');
  tipsTitle.textContent = '💡 学习提示';
  tipsTitle.style.cssText = 'color: #333; font-size: 18px; margin-bottom: 12px; font-weight: bold;';
  tipsSection.appendChild(tipsTitle);

  const tipsList = document.createElement('ul');
  tipsList.style.cssText = 'color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 25px;';
  const tips = [
    '建议先学习新词，再复习旧词',
    '根据艾宾浩斯遗忘曲线安排复习时间',
    '诚实评价掌握程度，有助于优化学习计划',
    '坚持每日学习，保持学习节奏'
  ];

  tips.forEach(tip => {
    const li = document.createElement('li');
    li.textContent = tip;
    li.style.marginBottom = '8px';
    tipsList.appendChild(li);
  });

  tipsSection.appendChild(tipsList);
  container.appendChild(tipsSection);

  return container;
}

/**
 * 创建单词表格
 */
function createWordTable(words: Word[]): HTMLElement {
  const table = document.createElement('table');
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
    font-size: 13px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;

  // 表头
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr style="background: linear-gradient(to bottom, #f8f9fa, #e9ecef);">
      <th style="border: 1px solid #dee2e6; padding: 12px; text-align: center; width: 50px; font-weight: bold; color: #495057;">序号</th>
      <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; width: 140px; font-weight: bold; color: #495057;">单词</th>
      <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; width: 140px; font-weight: bold; color: #495057;">音标</th>
      <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; width: 180px; font-weight: bold; color: #495057;">中文释义</th>
      <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: bold; color: #495057;">例句</th>
    </tr>
  `;
  table.appendChild(thead);

  // 表体
  const tbody = document.createElement('tbody');
  words.forEach((word, index) => {
    const tr = document.createElement('tr');
    tr.style.cssText = index % 2 === 0 ? 'background: #ffffff;' : 'background: #f8f9fa;';
    tr.innerHTML = `
      <td style="border: 1px solid #dee2e6; padding: 10px; text-align: center; color: #666;">${index + 1}</td>
      <td style="border: 1px solid #dee2e6; padding: 10px; font-weight: bold; color: #2c3e50; font-size: 14px;">${word.word}</td>
      <td style="border: 1px solid #dee2e6; padding: 10px; font-style: italic; color: #7f8c8d; font-size: 12px;">${word.pronunciation || '-'}</td>
      <td style="border: 1px solid #dee2e6; padding: 10px; color: #34495e; font-size: 13px;">${word.translation}</td>
      <td style="border: 1px solid #dee2e6; padding: 10px; color: #7f8c8d; font-size: 12px; line-height: 1.5;">${word.example || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  return table;
}

/**
 * 导出今日单词表为PDF
 * @param todayTask 今日学习任务
 * @param wordBookName 词书名称
 * @param date 日期
 */
export async function exportTodayWordsToPDF(
  todayTask: TodayTask,
  wordBookName: string,
  date: Date = new Date(),
  customFileName?: string
): Promise<void> {
  // 创建临时容器
  const container = createPDFContent(todayTask, wordBookName, date);
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  try {
    // 使用 html2canvas 将 HTML 转换为 canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 880,
    });

    // 计算 PDF 尺寸
    const imgWidth = 210; // A4 宽度（mm）
    const pageHeight = 297; // A4 高度（mm）
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    // 添加第一页
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // 如果内容超过一页，添加更多页
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // 保存PDF
    const fileName = customFileName || `今日单词表_${wordBookName}_${date.toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } finally {
    // 清理临时元素
    document.body.removeChild(container);
  }
}

/**
 * 导出单词列表为PDF（简化版）
 * @param words 单词列表
 * @param title 标题
 * @param fileName 文件名
 */
export async function exportWordsToPDF(
  words: Word[],
  title: string,
  fileName: string
): Promise<void> {
  // 创建临时容器
  const container = document.createElement('div');
  container.style.cssText = `
    width: 800px;
    padding: 40px;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', 'SimHei', sans-serif;
    position: absolute;
    left: -9999px;
    top: 0;
  `;

  // 标题
  const titleElement = document.createElement('h1');
  titleElement.textContent = title;
  titleElement.style.cssText = `
    text-align: center;
    color: #2c3e50;
    margin-bottom: 30px;
    font-size: 32px;
    font-weight: bold;
  `;
  container.appendChild(titleElement);

  // 单词表格
  const table = createWordTable(words);
  container.appendChild(table);

  document.body.appendChild(container);

  try {
    // 使用 html2canvas 将 HTML 转换为 canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 880,
    });

    // 计算 PDF 尺寸
    const imgWidth = 210; // A4 宽度（mm）
    const pageHeight = 297; // A4 高度（mm）
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    // 添加第一页
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // 如果内容超过一页，添加更多页
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // 保存PDF
    pdf.save(fileName);
  } finally {
    // 清理临时元素
    document.body.removeChild(container);
  }
}

