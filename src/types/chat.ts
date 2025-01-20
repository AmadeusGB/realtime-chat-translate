export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  originalText?: string; // 原始文本
  translatedText?: string; // 翻译后的文本
  isPending?: boolean; // 是否正在处理中
}

export interface ChatState {
  messages: ChatMessage[];
  isTranslating: boolean;
} 