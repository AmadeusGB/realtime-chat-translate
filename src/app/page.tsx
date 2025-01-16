'use client';

import { useEffect, useCallback } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import AudioControls from '@/components/AudioControls';

export default function Home() {
  const { isConnected, audioStream, error, connect, disconnect } = useWebRTC();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !e.repeat && !isConnected) {
      e.preventDefault();
      connect();
    }
  }, [connect, isConnected]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && isConnected) {
      e.preventDefault();
      disconnect();
    }
  }, [disconnect, isConnected]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    if (audioStream) {
      const audioElement = document.createElement('audio');
      audioElement.srcObject = audioStream;
      audioElement.autoplay = true;
      audioElement.setAttribute('playsinline', '');
      audioElement.muted = false;
      audioElement.volume = 1.0;
      
      document.body.appendChild(audioElement);

      return () => {
        audioElement.srcObject = null;
        document.body.removeChild(audioElement);
      };
    }
  }, [audioStream]);

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-12 text-center">实时语音翻译</h1>
        
        <AudioControls 
          isConnected={isConnected}
          error={error}
        />
      </div>
    </main>
  );
}
