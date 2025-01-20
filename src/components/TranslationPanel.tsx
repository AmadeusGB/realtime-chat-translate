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
    <div className="flex flex-col h-full">
      {/* 面板标题 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">翻译记录</h3>
        <div className="flex items-center space-x-2">
          {isTranslating && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm text-gray-400">正在翻译...</span>
            </div>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p>等待开始翻译...</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`
                flex flex-col space-y-2 p-4 rounded-2xl
                ${message.role === 'user' 
                  ? 'bg-blue-500/10 ml-8' 
                  : 'bg-gray-500/10 mr-8'
                }
              `}
            >
              {/* 原文 */}
              <div className="flex items-start space-x-2">
                <span className={`
                  text-xs px-2 py-1 rounded-full
                  ${message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-500 text-white'
                  }
                `}>
                  {message.role === 'user' ? '你' : 'AI'}
                </span>
                <p className="flex-1 text-sm">
                  {message.originalText || message.content}
                </p>
              </div>

              {/* 译文 */}
              {message.translatedText && (
                <div className="flex items-start space-x-2 pl-8">
                  <p className="flex-1 text-sm text-gray-500">
                    {message.translatedText}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(message.translatedText!)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" 
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* 加载状态 */}
              {message.isPending && (
                <div className="flex items-center space-x-1 pl-8">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" 
                    style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: '0.4s' }} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}