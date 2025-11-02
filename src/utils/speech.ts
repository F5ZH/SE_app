/**
 * 语音朗读工具函数
 * 使用浏览器Web Speech API实现文本转语音
 */

/**
 * 朗读单词
 * @param text 要朗读的文本
 * @param lang 语言代码，默认为'en-US'
 */
export function speakWord(text: string, lang: string = 'en-US'): void {
  // 检查浏览器是否支持Web Speech API
  if (!('speechSynthesis' in window)) {
    console.warn('您的浏览器不支持语音合成功能');
    return;
  }

  // 停止当前正在进行的朗读
  window.speechSynthesis.cancel();

  // 创建语音合成实例
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9; // 语速（0.1-10，默认1）
  utterance.pitch = 1; // 音调（0-2，默认1）
  utterance.volume = 1; // 音量（0-1，默认1）

  // 开始朗读
  window.speechSynthesis.speak(utterance);
}

/**
 * 停止当前朗读
 */
export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * 检查是否支持语音合成
 */
export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window;
}
