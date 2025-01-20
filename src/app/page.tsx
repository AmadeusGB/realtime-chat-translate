'use client';

import { useEffect, useState } from 'react';
import AudioControls from '@/components/AudioControls';
import { useWebRTC } from '@/hooks/useWebRTC';

export default function Home() {
  const { isConnected, error, connect, disconnect, startRecording, stopRecording } = useWebRTC();
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && isConnected && !isRecording) {
        setIsRecording(true);
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isConnected && isRecording) {
        setIsRecording(false);
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isConnected, isRecording, startRecording, stopRecording]);

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
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
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
              />
            </div>
          </div>

          {/* 右侧：翻译结果展示（预留） */}
          <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 rounded-3xl p-8
            border border-white/20 shadow-2xl min-h-[400px] hidden md:block">
            <div className="h-full flex items-center justify-center text-gray-400">
              <p>翻译结果将在这里显示</p>
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
