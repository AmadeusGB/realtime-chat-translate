import { useState, useEffect, useCallback, useRef } from 'react';
import { getWebRTCService } from '@/services/webrtc';

export function useWebRTC() {
  const [isConnected, setIsConnected] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // 使用 ref 来存储当前的 WebRTC 服务实例
  const webRTCServiceRef = useRef(getWebRTCService());

  // 重置所有状态和连接
  const resetConnection = useCallback(() => {
    console.log('Resetting WebRTC connection...');
    
    // 清理现有的音频流
    if (audioStream) {
      console.log('Stopping existing audio tracks...');
      audioStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Track ${track.id} stopped`);
      });
    }

    // 重新初始化 WebRTC 服务
    console.log('Reinitializing WebRTC service...');
    webRTCServiceRef.current = getWebRTCService();
    
    // 重置状态
    setAudioStream(null);
    setIsConnected(false);
    setError(null);
  }, [audioStream]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('Setting up WebRTC service...');
    const webRTCService = webRTCServiceRef.current;
    
    webRTCService.onTrack((stream) => {
      console.log('New audio track received:', stream.id);
      setAudioStream(stream);
    });

    return () => {
      console.log('Cleaning up WebRTC service...');
      disconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      console.log('Attempting to connect...');
      
      // 在新连接前重置所有状态
      resetConnection();
      
      const webRTCService = webRTCServiceRef.current;
      await webRTCService.connect();
      
      console.log('Connection established successfully');
      setIsConnected(true);
    } catch (err) {
      console.error('Connection failed:', err);
      setError(err instanceof Error ? err : new Error('Failed to connect'));
      setIsConnected(false);
      resetConnection();
    }
  }, [resetConnection]);

  const disconnect = useCallback(() => {
    try {
      console.log('Disconnecting...');
      const webRTCService = webRTCServiceRef.current;
      
      // 停止所有音频轨道
      if (audioStream) {
        console.log('Stopping audio tracks...');
        audioStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Track ${track.id} stopped`);
        });
      }
      
      // 断开 WebRTC 连接
      webRTCService.disconnect();
      
      // 重置所有状态
      resetConnection();
      
      console.log('Disconnected successfully');
    } catch (err) {
      console.error('Disconnect failed:', err);
      setError(err instanceof Error ? err : new Error('Failed to disconnect'));
    }
  }, [audioStream, resetConnection]);

  return {
    isConnected,
    audioStream,
    error,
    connect,
    disconnect,
  };
}
