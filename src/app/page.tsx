'use client';

import { useEffect, useState } from 'react';
import AudioControls from '@/components/AudioControls';
import { useWebRTC } from '@/hooks/useWebRTC';

export default function Home() {
  const { isConnected, error, connect, disconnect } = useWebRTC();
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && isConnected) {
        setIsRecording(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isConnected]);

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
    <main className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-12 text-center">实时语音翻译</h1>
        
        <AudioControls 
          isConnected={isConnected}
          error={error}
          onStart={handleStart}
          onStop={handleStop}
          isRecording={isRecording}
        />
      </div>
    </main>
  );
}
