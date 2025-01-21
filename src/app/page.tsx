'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '@/types/chat';
import AudioControls from '@/components/AudioControls';
import TranslationPanel from '@/components/TranslationPanel';
import useWebRTC from '@/hooks/useWebRTC';
import debounce from 'lodash/debounce';
import { saveAs } from 'file-saver';  // 需要先安装: npm install file-saver @types/file-saver

// 定义缓冲区接口
interface SpeechBuffer {
  text: string;
  timestamp: number;
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]); // 初始为空数组
  
  // 添加客户端初始化 effect
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('translationHistory');
    if (saved) {
      try {
        const parsedMessages = JSON.parse(saved);
        setMessages(parsedMessages);
      } catch (e) {
        console.error('Failed to parse saved messages:', e);
      }
    }
  }, []);

  const [isTranslating, setIsTranslating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const bufferRef = useRef<string>('');
  const messageBuffer = useRef<{[key: string]: ChatMessage}>({});

  // 创建一个防抖的翻译函数
  const debouncedTranslate = useCallback(
    debounce(async (text: string) => {
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            text,
            from: 'en',
            to: 'zh'
          })
        });
        
        if (!response.ok) {
          throw new Error('Translation failed');
        }

        const data = await response.json();
        
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (!lastMsg || lastMsg.role !== 'user') {
            return [...prev, {
              id: uuidv4(),
              role: 'user',
              content: text,
              originalText: text,
              translatedText: data.translation,
              timestamp: Date.now(),
              isPending: false
            }];
          }
          
          return prev.map(msg =>
            msg.id === lastMsg.id
              ? {
                  ...msg,
                  content: text,
                  originalText: text,
                  translatedText: data.translation,
                  isPending: false
                }
              : msg
          );
        });
      } catch (error) {
        console.error('[Page] Translation error:', error);
      }
    }, 1000),
    []
  );

  const handleSpeechResult = useCallback(async (text: string) => {
    // 忽略单个标点符号
    if (text.trim().length <= 1) return;
    
    // 如果是增量更新（包含单词或短语），更新最后一条消息
    if (!text.endsWith('.') && !text.endsWith('?') && !text.endsWith('!')) {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.isPending) {
          return prev.map(msg => 
            msg.id === lastMsg.id 
              ? {...msg, originalText: text}
              : msg
          );
        }
        return prev;
      });
      return;
    }

    // 生成新消息 ID
    const messageId = Date.now().toString();
    
    // 创建新消息
    const message: ChatMessage = {
      id: messageId,
      role: 'user',
      content: text,
      originalText: text,
      translatedText: undefined,
      timestamp: Date.now(),
      isPending: true
    };
    
    setMessages(prev => [...prev, message]);
    
    // 调用翻译 API
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          from: 'en',
          to: 'zh'
        })
      });
      
      if (!response.ok) throw new Error('Translation failed');
      
      const { translation } = await response.json();
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? {...msg, translatedText: translation, isPending: false}
          : msg
      ));
    } catch (error) {
      console.error('Translation error:', error);
    }
  }, []);

  const { 
    isConnected, 
    error, 
    connect, 
    disconnect, 
    startRecording: webRTCStartRecording,
    stopRecording: webRTCStopRecording
  } = useWebRTC(handleSpeechResult);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && isConnected && !isRecording) {
        setIsRecording(true);
        webRTCStartRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isConnected && isRecording) {
        setIsRecording(false);
        webRTCStopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isConnected, isRecording, webRTCStartRecording, webRTCStopRecording]);

  const handleStart = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('Failed to start:', err);
    }
  };

  const handleStop = () => {
    setIsRecording(false);
    disconnect();
  };

  // 清理缓冲区
  useEffect(() => {
    return () => {
      bufferRef.current = '';
    };
  }, []);

  // 添加自动滚动效果
  useEffect(() => {
    const element = document.querySelector('.translation-record');
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]); // 当消息列表更新时触发

  // 添加导出功能
  const handleExport = () => {
    // 准备导出数据
    const exportData = messages.map(msg => ({
      timestamp: new Date(msg.timestamp).toLocaleString(),
      original: msg.originalText,
      translation: msg.translatedText,
    }));

    // 创建 CSV 内容
    const csvContent = [
      'Timestamp,Original Text,Translation',  // CSV 头部
      ...exportData.map(row => 
        `"${row.timestamp}","${row.original}","${row.translation}"`
      )
    ].join('\n');

    // 创建 Blob 并下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `translation-history-${new Date().toISOString().slice(0,10)}.csv`);
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-animate">
      {/* 装饰性背景元素 */}
      <div className="circle-decoration w-[500px] h-[500px] -top-20 -left-20" />
      <div className="circle-decoration w-[300px] h-[300px] top-1/2 -right-20" />
      <div className="circle-decoration w-[400px] h-[400px] -bottom-20 left-1/3" />
      
      {/* 顶部导航栏 */}
      <nav className="fixed top-0 left-0 right-0 h-16 backdrop-blur-md bg-white/10 dark:bg-black/10 z-50
        border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-medium">实时翻译</span>
          </div>
          <div className="flex items-center space-x-4">
            {/* 可以添加设置、语言选择等功能按钮 */}
          </div>
        </div>
      </nav>

      {/* 主要内容区 */}
      <div className="pt-24 pb-8 px-4 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 左侧：控制面板 */}
          <div className="flex flex-col space-y-8">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 rounded-3xl p-8
              border border-white/20 shadow-2xl">
              <AudioControls 
                isConnected={isConnected}
                error={error}
                onStart={handleStart}
                onStop={handleStop}
                isRecording={isRecording}
                onSpeechResult={handleSpeechResult}
              />
            </div>
          </div>

          {/* 右侧：翻译结果展示 */}
          <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 rounded-3xl p-8
            border border-white/20 shadow-2xl min-h-[600px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">翻译记录</h2>
              {isClient && ( // 仅在客户端渲染导出按钮
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                    transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                  导出记录
                </button>
              )}
            </div>
            <TranslationPanel 
              messages={messages}
              isTranslating={isTranslating}
              isClient={isClient}
            />
            {isClient && (
              <div className="mt-4 text-xs text-gray-400">
                Messages count: {messages.length}
              </div>
            )}
          </div>
        </div>

        {/* 底部信息 */}
        <footer className="mt-12 text-center text-sm text-gray-400">
          <p>按住空格键开始说话 · 松开结束</p>
        </footer>
      </div>
    </main>
  );
}
