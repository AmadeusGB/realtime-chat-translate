export type MessageRole = 'user' | 'assistant';
export type Language = 'zh' | 'en';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  originalText: string;
  translatedText?: string;
  timestamp: number;
  isPending: boolean;
  isChineseInput?: boolean;
  sourceLanguage: Language;
  targetLanguage: Language;
}

export interface ChatState {
  messages: ChatMessage[];
  isTranslating: boolean;
} 