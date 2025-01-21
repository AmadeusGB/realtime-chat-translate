import { useCallback } from 'react';

// 首先定义 Language 类型
export type Language = 'en' | 'zh' | string;

interface LanguageSelectorProps {
  sourceLanguage: string;
  targetLanguage: Language;
  onSourceLanguageChange: (lang: string) => void;
  onTargetLanguageChange: (lang: Language) => void;
  disabled?: boolean;
}

export default function LanguageSelector({
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  disabled
}: LanguageSelectorProps) {
  const handleSourceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSource = e.target.value;
    onSourceLanguageChange(newSource);
    // 自动切换目标语言
    if (newSource === targetLanguage) {
      onTargetLanguageChange(newSource === 'zh' ? 'en' : 'zh');
    }
  }, [targetLanguage, onSourceLanguageChange, onTargetLanguageChange]);

  const handleTargetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTarget = e.target.value;
    onTargetLanguageChange(newTarget as Language);
    // 自动切换源语言
    if (newTarget === sourceLanguage) {
      onSourceLanguageChange(newTarget === 'zh' ? 'en' : 'zh');
    }
  }, [sourceLanguage, onSourceLanguageChange, onTargetLanguageChange]);

  return (
    <div className="flex items-center gap-4 mb-6">
      <select
        value={sourceLanguage}
        onChange={handleSourceChange}
        disabled={disabled}
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2"
      >
        <option value="zh">中文</option>
        <option value="en">English</option>
      </select>
      
      <div className="text-gray-500">→</div>
      
      <select
        value={targetLanguage}
        onChange={handleTargetChange}
        disabled={disabled}
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2"
      >
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>
    </div>
  );
}
