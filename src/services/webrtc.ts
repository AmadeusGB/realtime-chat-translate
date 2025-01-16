export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private onTrackCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChangeCallback: ((state: RTCPeerConnectionState) => void) | null = null;
  private mediaStream: MediaStream | null = null;

  constructor() {
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
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,  // 直接发送 SDP 字符串
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
}

// 单例模式创建服务实例
let webRTCServiceInstance: WebRTCService | null = null;

export const getWebRTCService = () => {
  // 确保只在浏览器环境中创建实例
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!webRTCServiceInstance) {
    webRTCServiceInstance = new WebRTCService();
  }
  return webRTCServiceInstance;
};
