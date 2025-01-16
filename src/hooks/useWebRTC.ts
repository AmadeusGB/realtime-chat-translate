import { useState, useEffect, useCallback } from 'react';
import { getWebRTCService } from '@/services/webrtc';

export function useWebRTC() {
  const [isConnected, setIsConnected] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const webRTCService = getWebRTCService();
    
    webRTCService.onTrack((stream) => {
      setAudioStream(stream);
    });

    return () => {
      webRTCService.disconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      const webRTCService = getWebRTCService();
      await webRTCService.connect();
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect'));
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    try {
      const webRTCService = getWebRTCService();
      webRTCService.disconnect();
      setIsConnected(false);
      setAudioStream(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to disconnect'));
    }
  }, []);

  return {
    isConnected,
    audioStream,
    error,
    connect,
    disconnect,
  };
}
