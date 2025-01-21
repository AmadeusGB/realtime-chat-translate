export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private onTrackCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChangeCallback: ((state: RTCPeerConnectionState) => void) | null = null;
  private mediaStream: MediaStream | null = null;
  private speechCallbacks: ((text: string) => void)[] = [];
  private lastChineseTranscript: string = '';
  private lastEnglishTranscript: string = '';
  private currentModel: string;

  constructor(model: string = 'gpt-4o-mini-realtime-preview') {
    this.currentModel = model;
    // 确保只在浏览器环境中初始化
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    // 确保在浏览器环境中执行
    if (typeof window === 'undefined') return;

    // 确保清理旧的连接
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // 添加连接状态监听
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('Connection state:', state);
      // 只在state存在时调用回调
      if (state) {
        this.onConnectionStateChangeCallback?.(state);
      }
    };

    // 添加ICE连接状态监听
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection?.iceConnectionState);
    };

    // 添加协商状态监听
    this.peerConnection.onsignalingstatechange = () => {
      console.log('Signaling state:', this.peerConnection?.signalingState);
    };

    // 重新绑定 ontrack 事件
    if (this.onTrackCallback) {
      this.peerConnection.ontrack = (event) => {
        this.onTrackCallback?.(event.streams[0]);
      };
    }

    // 创建和配置数据通道
    this.dataChannel = this.peerConnection.createDataChannel('messages');
    console.log('[WebRTCService] Data channel created');

    this.dataChannel.onopen = () => {
      console.log('[WebRTCService] Data channel opened');
    };

    this.dataChannel.onclose = () => {
      console.log('[WebRTCService] Data channel closed');
    };

    this.dataChannel.onmessage = this.handleDataChannelMessage.bind(this);

    // 监听远程数据通道
    this.peerConnection.ondatachannel = (event) => {
      console.log('[WebRTCService] Received remote data channel');
      this.dataChannel = event.channel;
      this.dataChannel.onmessage = this.handleDataChannelMessage.bind(this);
    };
  }

  public async connect() {
    this.initialize();

    try {
      // 获取麦克风权限
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 先将所有音轨设置为禁用状态
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = false;
        // 重要：将音轨添加到PeerConnection
        this.peerConnection?.addTrack(track, this.mediaStream!);
      });

      // 创建offer并建立连接
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      // 发送 SDP offer
      const response = await fetch('/api/rtc-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sdp: offer.sdp,
          model: this.currentModel
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // 获取并设置远程描述
      const answerSdp = await response.text();
      const answer = new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      await this.peerConnection!.setRemoteDescription(answer);
    } catch (error) {
      console.error('Connection failed:', error);
      this.disconnect();
      throw error;
    }
  }

  public disconnect() {
    // 停止所有轨道
    if (this.peerConnection) {
      this.peerConnection.getSenders().forEach(sender => {
        if (sender.track) {
          sender.track.stop();
        }
      });
    }

    // 关闭数据通道
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // 关闭连接
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // 重新初始化服务
    this.initialize();
  }

  public onTrack(callback: (stream: MediaStream) => void) {
    this.onTrackCallback = callback;
    
    // 如果已经有连接，立即设置回调
    if (this.peerConnection) {
      this.peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event.streams[0].id);
        callback(event.streams[0]);
      };
    }
  }

  public onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateChangeCallback = callback;
  }

  public enableAudio() {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
    }
  }

  public disableAudio() {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
    }
  }

  public onSpeechResult(callback: (text: string) => void) {
    this.speechCallbacks.push(callback);
  }

  // 在收到语音识别结果时调用
  private handleSpeechResult(text: string) {
    // 忽略包含 -> 的中间状态消息
    if (text.includes('->')) {
      return;
    }

    // 检查是否是完整句子(以标点符号结尾)
    const isCompleteSentence = /[。！？.!?]$/.test(text);
    
    if (isCompleteSentence) {
      // 只在收到完整句子时调用回调
      this.speechCallbacks.forEach(callback => {
        console.log('[WebRTCService] Calling speech callback with complete sentence');
        callback(text);
      });
    } else {
      // 存储未完成的句子部分
      if (/[\u4e00-\u9fa5]/.test(text)) {
        this.lastChineseTranscript = text;
      } else {
        this.lastEnglishTranscript = text;
      }
    }
  }

  // Updated type for audioData parameter
  private async processAudio(audioData: string | ArrayBuffer) {
    console.log('[WebRTCService] Processing audio data:', typeof audioData);
    if (typeof audioData === 'string') {
      console.log('[WebRTCService] Received text from server:', audioData);
      this.handleSpeechResult(audioData);
    }
  }

  // Updated error handling
  private handleDataChannelMessage = (event: MessageEvent) => {
    console.log('[WebRTCService] Received data channel message:', event.data);
    try {
      const data = JSON.parse(event.data);
      
      // 处理语音识别结果
      if (data.type === 'response.audio_transcript.done' && data.transcript) {
        console.log('[WebRTCService] Processing transcript:', data.transcript);
        this.handleSpeechResult(data.transcript);
      }
      // 处理增量语音识别结果
      else if (data.type === 'response.audio_transcript.delta' && data.delta) {
        console.log('[WebRTCService] Processing transcript delta:', data.delta);
        this.handleSpeechResult(data.delta);
      }
      // 保持原有的处理逻辑
      else if (data.type === 'speech_result' && data.text) {
        console.log('[WebRTCService] Processing speech result:', data.text);
        this.handleSpeechResult(data.text);
      }
    } catch {  // Removed unused parameter
      // If not JSON, directly process as audio data
      this.processAudio(event.data);
    }
  }

  public setModel(model: string) {
    this.currentModel = model;
  }
}

// 单例模式创建服务实例
let webRTCServiceInstance: WebRTCService | null = null;

export const getWebRTCService = (model?: string) => {
  // 确保只在浏览器环境中创建实例
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!webRTCServiceInstance) {
    webRTCServiceInstance = new WebRTCService(model);
  } else if (model) {
    webRTCServiceInstance.setModel(model);
  }
  return webRTCServiceInstance;
};
