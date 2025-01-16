'use client';

import { useEffect } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import AudioControls from '@/components/AudioControls';

export default function Home() {
  const { isConnected, audioStream, error, connect, disconnect } = useWebRTC();

  useEffect(() => {
    if (audioStream) {
      const audioElement = document.createElement('audio');
      
      // 优化音频元素的配置
      audioElement.srcObject = audioStream;
      audioElement.autoplay = true;
      
      // 设置其他重要属性
      audioElement.setAttribute('playsinline', ''); // 支持iOS内联播放
      audioElement.muted = false;
      
      // 音频优化设置
      audioElement.volume = 1.0;
      
      // 添加事件监听以便调试
      audioElement.onplay = () => console.log('Audio started playing');
      audioElement.onpause = () => console.log('Audio paused');
      audioElement.onerror = (e) => console.error('Audio error:', e);
      
      // 将音频元素添加到DOM
      document.body.appendChild(audioElement);

      return () => {
        audioElement.srcObject = null;
        document.body.removeChild(audioElement);
      };
    }
  }, [audioStream]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">实时语音翻译</h1>
        
        <AudioControls 
          isConnected={isConnected}
          onConnect={connect}
          onDisconnect={disconnect}
          error={error}
        />
      </div>
    </main>
  );
}
