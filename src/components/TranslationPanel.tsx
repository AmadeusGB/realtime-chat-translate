import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat';

interface TranslationPanelProps {
  messages: ChatMessage[];
  isTranslating: boolean;
}

export default function TranslationPanel({ messages, isTranslating }: TranslationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full">
      <div className="translation-record" ref={scrollRef}>
        {messages.map((message, index) => (
          <div key={message.id}>
            <div className="message">
              {/* 英文消息 */}
              <div className="flex gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                  en
                </div>
                <div className="flex-1 min-h-[2rem] flex items-center">
                  {message.originalText}
                </div>
              </div>
              
              {/* 中文翻译 */}
              {message.translatedText && (
                <div className="flex gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
                    zh
                  </div>
                  <div className="flex-1 min-h-[2rem] flex items-center">
                    {message.translatedText}
                  </div>
                </div>
              )}
            </div>
            
            {/* 添加分隔线，但不在最后一条消息后添加 */}
            {index < messages.length - 1 && (
              <div className="my-4 border-b border-gray-200 dark:border-gray-700 opacity-50" />
            )}
          </div>
        ))}
      </div>
      {isTranslating && (
        <div className="mt-4 text-sm text-gray-500">
          翻译中...
        </div>
      )}
    </div>
  );
}