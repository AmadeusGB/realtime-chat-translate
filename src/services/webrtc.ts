export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private onTrackCallback: ((stream: MediaStream) => void) | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    console.log('Initializing WebRTC service...');
    // 确保清理旧的连接
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // 重新绑定 ontrack 事件
    if (this.onTrackCallback) {
      this.peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event.streams[0].id);
        this.onTrackCallback?.(event.streams[0]);
      };
    }
  }

  public async connect() {
    console.log('Starting new WebRTC connection...');
    this.initialize();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Got local media stream');

      stream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, stream);
          console.log('Added local track to connection');
        }
      });

      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      console.log('Set local description');

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
      console.log('Set remote description');
    } catch (error) {
      console.error('Connection failed:', error);
      this.disconnect();
      throw error;
    }
  }

  public disconnect() {
    console.log('Disconnecting WebRTC...');
    
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
    console.log('Setting up onTrack callback');
    this.onTrackCallback = callback;
    
    // 如果已经有连接，立即设置回调
    if (this.peerConnection) {
      this.peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event.streams[0].id);
        callback(event.streams[0]);
      };
    }
  }
}

// 单例模式
let webRTCService: WebRTCService | null = null;

export function getWebRTCService(): WebRTCService {
  if (!webRTCService) {
    webRTCService = new WebRTCService();
  }
  return webRTCService;
}
