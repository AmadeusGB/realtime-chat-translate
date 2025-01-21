'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, Language } from '@/types/chat';
import AudioControls from '@/components/AudioControls';
import useWebRTC from '@/hooks/useWebRTC';
import debounce from 'lodash/debounce';
import { saveAs } from 'file-saver';  // 需要先安装: npm install file-saver @types/file-saver
import ModelSelector from '@/components/ModelSelector';
import LanguageSelector from '@/components/LanguageSelector';
import { generateUniqueId } from '@/utils/messageUtils';

interface TranslationPanelProps {
  messages: ChatMessage[]
  isTranslating: boolean
  isClient: boolean
}

function MessagePanel({ messages, isTranslating }: TranslationPanelProps) {
  const [messageMap, setMessageMap] = useState<Map<string, ChatMessage>>(new Map());

  useEffect(() => {
    console.log('Processing message:', messages);
    
    messages.forEach(async (message) => {
      const text = message.originalText || '';
      
      // 只在收到完整消息时更新
      if (!text.includes('->')) {
        const isChineseInput = /[\u4e00-\u9fa5]/.test(text);
        
        // 添加调试日志
        console.log('Complete message received:', {
          text,
          isChineseInput
        });

        // 更新消息状态
        setMessageMap(prev => {
          const newMap = new Map(prev);
          newMap.set(message.id, {
            ...message,
            isChineseInput,
            translatedText: message.translatedText
          });
          return newMap;
        });
      }
    });
  }, [messages]);

  return (
    <div className="mt-4 space-y-4">
      {messages.map((message) => {
        const originalText = message.originalText || '';
        const isChineseInput = /[\u4e00-\u9fa5]/.test(originalText);
        const translatedText = messageMap.get(message.id)?.translatedText || message.translatedText;
        
        console.log('Rendering message:', {
          id: message.id,
          originalText,
          isChineseInput,
          translatedText
        });

        return (
          <div key={message.id} className="flex flex-col space-y-2">
            <div className="flex items-start space-x-2">
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                isChineseInput ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {isChineseInput ? 'zh' : 'en'}
              </span>
              <p className="text-gray-700">{originalText}</p>
            </div>
            
            {translatedText && (
              <div className="flex items-start space-x-2 pl-6">
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                  isChineseInput ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {isChineseInput ? 'en' : 'zh'}
                </span>
                <p className="text-gray-700">{translatedText}</p>
              </div>
            )}
          </div>
        );
      })}
      
      {isTranslating && (
        <div className="flex items-center space-x-2">
          <div className="animate-pulse">...</div>
          <p className="text-gray-500">翻译中...</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]); // 初始为空数组
  const [sourceLanguage, setSourceLanguage] = useState<Language>('zh');
  const [targetLanguage, setTargetLanguage] = useState<Language>('en');
  
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

  const [isRecording, setIsRecording] = useState(false);
  const bufferRef = useRef<string>('');
  const [currentModel, setCurrentModel] = useState('gpt-4o-mini-realtime-preview');

  // Move the translation logic into a separate callback
  const translateText = useCallback(async (text: string, isChineseInput: boolean) => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text,
          from: isChineseInput ? 'zh' : 'en',
          to: isChineseInput ? 'en' : 'zh'
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
            isPending: false,
            sourceLanguage: sourceLanguage,
            targetLanguage: targetLanguage
          }];
        }
        
        return prev.map(msg =>
          msg.id === lastMsg.id
            ? {
                ...msg,
                content: text,
                originalText: text,
                translatedText: data.translation,
                isPending: false,
                sourceLanguage: sourceLanguage,
                targetLanguage: targetLanguage
              }
            : msg
        );
      });
    } catch (error) {
      console.error('[Page] Translation error:', error);
    }
  }, [sourceLanguage, targetLanguage]);

  // Create debounced version of the translation function
  const debouncedTranslate = useMemo(
    () => debounce(translateText, 1000),
    [translateText]
  );

  // 修改 handleSpeechResult 中的调用
  const handleSpeechResult = useCallback(async (text: string) => {
    // 过滤掉只包含标点符号的消息
    if (/^[.,。、！？!?]+$/.test(text.trim())) {
      return;
    }

    const messageId = generateUniqueId();
    const isChineseInput = /[\u4e00-\u9fa5]/.test(text);
    
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.originalText === text) {
        return prev;
      }
      
      return [...prev, {
        id: messageId,
        role: 'user',
        content: text,
        originalText: text,
        timestamp: Date.now(),
        isChineseInput,
        isPending: false,
        sourceLanguage,
        targetLanguage
      }];
    });

    await debouncedTranslate(text, isChineseInput);  // 传入isChineseInput参数
  }, [sourceLanguage, targetLanguage, debouncedTranslate]);

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

  // Wrap handleStart in useCallback
  const handleStart = useCallback(async () => {
    try {
      await connect();
    } catch (err) {
      console.error('Failed to start:', err);
    }
  }, [connect]);

  // Wrap handleStop in useCallback
  const handleStop = useCallback(() => {
    setIsRecording(false);
    disconnect();
  }, [disconnect]);

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

  const clearMessages = useCallback(() => {
    if (window.confirm('确定要清空所有翻译记录吗？此操作不可恢复。')) {
      setMessages([]);
      localStorage.removeItem('translationHistory');
    }
  }, []);

  const handleModelChange = useCallback(async (model: string) => {
    if (isConnected) {
      // Disconnect current connection
      handleStop();
    }
    
    setCurrentModel(model);
    localStorage.setItem('selectedModel', model);
    
    // Reconnect with new model if was previously connected
    if (isConnected) {
      await handleStart();
    }
  }, [isConnected, handleStart, handleStop]);

  useEffect(() => {
    setIsClient(true);
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel) {
      setCurrentModel(savedModel);
    }
  }, []);

  // 添加处理函数
  const handleSourceLanguageChange = (lang: string) => setSourceLanguage(lang as Language);
  const handleTargetLanguageChange = (lang: string) => setTargetLanguage(lang as Language);

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
              <ModelSelector 
                currentModel={currentModel}
                onModelChange={handleModelChange}
                disabled={isRecording}
              />
              <LanguageSelector
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                onSourceLanguageChange={handleSourceLanguageChange}
                onTargetLanguageChange={handleTargetLanguageChange}
                disabled={false}
              />
              <AudioControls 
                isConnected={isConnected}
                error={error}
                onStart={handleStart}
                onStop={handleStop}
                isRecording={isRecording}
              />
            </div>
          </div>

          {/* 右侧：翻译结果展示 */}
          <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 rounded-3xl p-8 
            border border-white/20 shadow-2xl flex flex-col h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">翻译记录</h2>
              {isClient && (
                <div className="flex gap-2">
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
                  <button
                    onClick={clearMessages}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 
                      transition-colors text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    清空记录
                  </button>
                </div>
              )}
            </div>
            
            {/* 添加translation-record类名 */}
            <div className="translation-record flex-1">
              <MessagePanel 
                messages={messages}
                isTranslating={false}
                isClient={isClient}
              />
            </div>
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
