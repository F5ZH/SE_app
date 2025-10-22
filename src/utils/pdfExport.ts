import jsPDF from 'jspdf';
import { Word, TodayTask } from '../types';

/**
 * PDF导出工具
 * 用于导出今日学习单词表
 */

/**
 * 导出今日单词表为PDF
 * @param todayTask 今日学习任务
 * @param wordBookName 词书名称
 * @param date 日期
 */
export function exportTodayWordsToPDF(
  todayTask: TodayTask,
  wordBookName: string,
  date: Date = new Date()
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  
  let yPosition = margin;
  
  // 设置字体
  doc.setFont('helvetica', 'normal');
  
  // 标题
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('今日学习单词表', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  
  // 词书名称和日期
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`词书：${wordBookName}`, margin, yPosition);
  yPosition += 8;
  doc.text(`日期：${date.toLocaleDateString('zh-CN')}`, margin, yPosition);
  yPosition += 15;
  
  // 新词学习部分
  if (todayTask.newWords.length > 0) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('新词学习', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    todayTask.newWords.forEach((word, index) => {
      // 检查是否需要换页
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }
      
      // 单词编号和单词
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${word.word}`, margin, yPosition);
      
      // 音标
      if (word.pronunciation) {
        doc.setFont('helvetica', 'italic');
        doc.text(`   ${word.pronunciation}`, margin + 10, yPosition + 5);
      }
      
      // 翻译
      doc.setFont('helvetica', 'normal');
      doc.text(`   翻译：${word.translation}`, margin + 10, yPosition + 10);
      
      // 例句
      if (word.example) {
        doc.text(`   例句：${word.example}`, margin + 10, yPosition + 15);
        yPosition += 25;
      } else {
        yPosition += 20;
      }
      
      // 分隔线
      if (index < todayTask.newWords.length - 1) {
        doc.setLineWidth(0.1);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;
      }
    });
    
    yPosition += 10;
  }
  
  // 复习单词部分
  if (todayTask.reviewWords.length > 0) {
    // 检查是否需要换页
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('复习巩固', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    todayTask.reviewWords.forEach((word, index) => {
      // 检查是否需要换页
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }
      
      // 单词编号和单词
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${word.word}`, margin, yPosition);
      
      // 音标
      if (word.pronunciation) {
        doc.setFont('helvetica', 'italic');
        doc.text(`   ${word.pronunciation}`, margin + 10, yPosition + 5);
      }
      
      // 翻译
      doc.setFont('helvetica', 'normal');
      doc.text(`   翻译：${word.translation}`, margin + 10, yPosition + 10);
      
      // 例句
      if (word.example) {
        doc.text(`   例句：${word.example}`, margin + 10, yPosition + 15);
        yPosition += 25;
      } else {
        yPosition += 20;
      }
      
      // 分隔线
      if (index < todayTask.reviewWords.length - 1) {
        doc.setLineWidth(0.1);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;
      }
    });
  }
  
  // 学习提示
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = margin;
  }
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('学习提示', margin, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const tips = [
    '1. 建议先学习新词，再复习旧词',
    '2. 根据艾宾浩斯遗忘曲线安排复习时间',
    '3. 诚实评价掌握程度，有助于优化学习计划',
    '4. 坚持每日学习，保持学习节奏'
  ];
  
  tips.forEach(tip => {
    doc.text(tip, margin, yPosition);
    yPosition += 6;
  });
  
  // 保存PDF
  const fileName = `今日单词表_${wordBookName}_${date.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * 导出单词列表为PDF（简化版）
 * @param words 单词列表
 * @param title 标题
 * @param fileName 文件名
 */
export function exportWordsToPDF(
  words: Word[],
  title: string,
  fileName: string
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  
  let yPosition = margin;
  
  // 标题
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  
  // 单词列表
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  words.forEach((word, index) => {
    // 检查是否需要换页
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }
    
    // 单词
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${word.word}`, margin, yPosition);
    
    // 音标和翻译
    doc.setFont('helvetica', 'normal');
    const info = word.pronunciation ? 
      `${word.pronunciation} - ${word.translation}` : 
      word.translation;
    doc.text(`   ${info}`, margin + 10, yPosition + 5);
    
    // 例句
    if (word.example) {
      doc.text(`   例句：${word.example}`, margin + 10, yPosition + 10);
      yPosition += 20;
    } else {
      yPosition += 15;
    }
  });
  
  // 保存PDF
  doc.save(fileName);
}
