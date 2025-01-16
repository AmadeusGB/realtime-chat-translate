'use client';

import { useEffect } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import AudioControls from '@/components/AudioControls';

export default function Home() {
  const { isConnected, audioStream, error, connect, disconnect } = useWebRTC();

  useEffect(() => {
    if (audioStream) {
      const audioElement = document.createElement('audio');
      audioElement.srcObject = audioStream;
      audioElement.autoplay = true;
      document.body.appendChild(audioElement);

      return () => {
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
