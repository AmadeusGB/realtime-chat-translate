export interface WebRTCService {
  connect(): Promise<void>;
  onTrack(callback: (stream: MediaStream) => void): void;
  onTranscription(callback: (text: string) => void): void;
  disconnect(): void;
}

class WebRTCServiceImpl implements WebRTCService {
  private peerConnection!: RTCPeerConnection;
  private dataChannel!: RTCDataChannel;
  private stream?: MediaStream;
  private transcriptionCallback?: (text: string) => void;

  constructor() {
    if (typeof window === 'undefined') {
      throw new Error('WebRTC service can only be used in browser environment');
    }
    this.initializeConnection();
  }

  private initializeConnection() {
    console.log('Initializing new connection...');
    this.peerConnection = new RTCPeerConnection();
    
    this.peerConnection.ondatachannel = (event) => {
      console.log('Received remote data channel');
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };

    this.dataChannel = this.peerConnection.createDataChannel('response', {
      ordered: true
    });
    this.setupDataChannel();
  }

  private setupDataChannel() {
    if (!this.dataChannel) {
      console.error('Data channel is null in setupDataChannel');
      return;
    }

    console.log('Setting up data channel, current state:', this.dataChannel.readyState);
    console.log('Has transcription callback:', !!this.transcriptionCallback);

    this.dataChannel.removeEventListener('open', this.handleDataChannelOpen);
    this.dataChannel.removeEventListener('message', this.handleDataChannelMessage);
    this.dataChannel.removeEventListener('close', this.handleDataChannelClose);
    this.dataChannel.removeEventListener('error', this.handleDataChannelError);
    
    this.dataChannel.addEventListener('open', this.handleDataChannelOpen);
    this.dataChannel.addEventListener('message', this.handleDataChannelMessage);
    this.dataChannel.addEventListener('close', this.handleDataChannelClose);
    this.dataChannel.addEventListener('error', this.handleDataChannelError);

    console.log('Data channel setup complete, state:', this.dataChannel.readyState);
  }

  private handleDataChannelOpen = () => {
    console.log('Data channel opened, sending session update...');
    console.log('Transcription callback status:', !!this.transcriptionCallback);
    this.configureData();
  };

  private handleDataChannelMessage = async (event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      console.log('Received message:', msg);
      
      if (msg.type === 'response.audio_transcript.delta' && msg.text) {
        console.log('Processing transcription:', msg.text, 'Callback exists:', !!this.transcriptionCallback);
        if (this.transcriptionCallback) {
          this.transcriptionCallback(msg.text);
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  private handleDataChannelClose = () => {
    console.log('Data channel closed, transcription callback status:', !!this.transcriptionCallback);
  };

  private handleDataChannelError = (error: Event) => {
    console.error('Data channel error:', error);
  };

  private configureData() {
    console.log('Configuring data channel, state:', this.dataChannel.readyState);
    const event = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        tools: [
          {
            type: 'function',
            name: 'transcribeAudio',
            description: 'Transcribes audio to text',
            parameters: {
              type: 'object',
              properties: {
                language: { type: 'string', description: 'The language of the audio' },
              },
            },
          },
        ],
      },
    };
    
    if (this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(event));
      console.log('Session update sent');
    } else {
      console.warn('Data channel not open, state:', this.dataChannel.readyState);
    }
  }

  async connect(): Promise<void> {
    try {
      console.log('Starting new connection...', 'Has transcription callback:', !!this.transcriptionCallback);
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped old track');
        });
      }
      
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Got new media stream');
      
      this.stream.getTracks().forEach((track) => {
        if (this.peerConnection.signalingState !== 'closed') {
          this.peerConnection.addTransceiver(track, { direction: 'sendrecv' });
          console.log('Added audio track to connection');
        }
      });

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log('Set local description');

      const response = await fetch('/api/rtc-connect', {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Content-Type': 'application/sdp',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to connect to server');
      }

      const answer = await response.text();
      await this.peerConnection.setRemoteDescription({
        sdp: answer,
        type: 'answer',
      });
      console.log('Set remote description');

    } catch (error) {
      console.error('Error connecting WebRTC:', error);
      throw error;
    }
  }

  disconnect() {
    console.log('Starting disconnect process...', 'Has transcription callback:', !!this.transcriptionCallback);
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped audio track');
      });
      this.stream = undefined;
    }
    
    if (this.dataChannel) {
      this.dataChannel.close();
      console.log('Closed data channel');
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      console.log('Closed peer connection');
    }
    
    this.initializeConnection();
    console.log('Initialized new connection, transcription callback status:', !!this.transcriptionCallback);
  }

  onTrack(callback: (stream: MediaStream) => void) {
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote track');
      callback(event.streams[0]);
    };
  }

  onTranscription(callback: (text: string) => void) {
    console.log('Setting transcription callback');
    this.transcriptionCallback = callback;
  }
}

let webRTCServiceInstance: WebRTCService | null = null;

export const getWebRTCService = (): WebRTCService => {
  if (typeof window === 'undefined') {
    return {
      connect: async () => {},
      onTrack: () => {},
      onTranscription: () => {},
      disconnect: () => {},
    };
  }

  if (!webRTCServiceInstance) {
    webRTCServiceInstance = new WebRTCServiceImpl();
  }

  return webRTCServiceInstance;
};
