import { useState, useEffect, useCallback, useRef } from 'react';
import { getWebRTCService } from '@/services/webrtc';

interface UseWebRTCReturn {
  isConnected: boolean;
  error: Error | null;
  audioStream: MediaStream | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  onSpeechResult?: (text: string) => Promise<void>;
}

export function useWebRTC(onSpeechResult?: (text: string) => Promise<void>): UseWebRTCReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // 使用 ref 来存储当前的 WebRTC 服务实例
  const webRTCServiceRef = useRef(getWebRTCService());

  // 添加音频元素ref
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // 在文件顶部添加 disconnectRef
  const disconnectRef = useRef<(() => void) | null>(null);

  // 重置所有状态和连接
  const resetConnection = useCallback(() => {
    if (!webRTCServiceRef.current) return;
    
    // 清理现有的音频流
    if (audioStream) {
      audioStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Track ${track.id} stopped`);
      });
    }

    // 重新初始化 WebRTC 服务
    webRTCServiceRef.current = getWebRTCService();
    
    // 重置状态
    setAudioStream(null);
    setIsConnected(false);
    setError(null);
  }, [audioStream]);

  const disconnect = useCallback(() => {
    if (!webRTCServiceRef.current) return;

    try {
      const webRTCService = webRTCServiceRef.current;
      
      // 停止所有音频轨道
      if (audioStream) {
        audioStream.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      // 断开 WebRTC 连接
      webRTCService.disconnect();
      
      // 重置所有状态
      resetConnection();
      
    } catch (err) {
      console.error('Disconnect failed:', err);
      setError(err instanceof Error ? err : new Error('Failed to disconnect'));
    }
  }, [audioStream, resetConnection]);

  // 移到 disconnect 定义之后
  useEffect(() => {
    disconnectRef.current = disconnect;
  }, [disconnect]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const webRTCService = webRTCServiceRef.current;
    if (!webRTCService) {
      console.log('WebRTC service not available');
      return;
    }
    
    // 添加连接状态变化监听
    webRTCService.onConnectionStateChange((state) => {
      console.log('WebRTC connection state changed:', state);
    });
    
    webRTCService.onTrack((stream) => {
      console.log('New audio track received:', stream.id);
      console.log('Audio tracks:', stream.getAudioTracks().length);
      
      // 创建或更新音频元素
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio();
        audioElementRef.current.autoplay = true;
        console.log('Created new audio element');
      }
      
      audioElementRef.current.srcObject = stream;
      console.log('Set audio stream to element');
      
      // 监听音频播放状态
      audioElementRef.current.onplay = () => console.log('Audio started playing');
      audioElementRef.current.onerror = (e) => console.error('Audio error:', e);
      
      setAudioStream(stream);
    });

    return () => {
      console.log('Cleaning up WebRTC service...');
      if (audioElementRef.current) {
        audioElementRef.current.srcObject = null;
        audioElementRef.current = null;
        console.log('Cleaned up audio element');
      }
      // 使用 disconnectRef.current 替代直接调用 disconnect
      disconnectRef.current?.();
    };
  }, []);

  // 添加语音识别结果处理
  useEffect(() => {
    if (!webRTCServiceRef.current) return;

    console.log('[useWebRTC] Setting up speech result callback');
    webRTCServiceRef.current.onSpeechResult((text: string) => {
      console.log('[useWebRTC] Speech result callback triggered:', text);
      if (onSpeechResult) {
        onSpeechResult(text).catch(err => {
          console.error('[useWebRTC] Error handling speech result:', err);
        });
      }
    });
  }, [onSpeechResult]);

  const connect = useCallback(async () => {
    console.log('Attempting to connect...');
    if (!webRTCServiceRef.current) {
      console.error('WebRTC service not available');
      setError(new Error('WebRTC service not available'));
      return;
    }

    try {
      resetConnection();
      
      const webRTCService = webRTCServiceRef.current;
      console.log('Initializing WebRTC connection...');
      await webRTCService.connect();
      console.log('WebRTC connection established');
      
      setIsConnected(true);
    } catch (err) {
      console.error('Connection failed:', err);
      setError(err instanceof Error ? err : new Error('Failed to connect'));
      setIsConnected(false);
      resetConnection();
    }
  }, [resetConnection]);

  const startRecording = useCallback(() => {
    if (webRTCServiceRef.current) {
      webRTCServiceRef.current.enableAudio();
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (webRTCServiceRef.current) {
      webRTCServiceRef.current.disableAudio();
    }
  }, []);

  return {
    isConnected,
    error,
    audioStream,
    connect,
    disconnect,
    startRecording,
    stopRecording,
  };
}

// 确保默认导出
export default useWebRTC;
