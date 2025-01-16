interface AudioControlsProps {
  isConnected: boolean;
  error: Error | null;
  onStart: () => void;
  onStop: () => void;
  isRecording: boolean;
}

export default function AudioControls({ 
  isConnected, 
  error, 
  onStart, 
  onStop,
  isRecording 
}: AudioControlsProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="flex gap-4 mb-4">
        <button
          onClick={onStart}
          disabled={isConnected}
          className={`px-4 py-2 rounded ${
            isConnected ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          开始
        </button>
        <button
          onClick={onStop}
          disabled={!isConnected}
          className={`px-4 py-2 rounded ${
            !isConnected ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
          } text-white`}
        >
          停止
        </button>
      </div>

      <div
        className={`
          w-48 h-48 rounded-full flex items-center justify-center
          transition-all duration-300 ease-in-out
          ${isRecording 
            ? 'bg-red-500 scale-110 animate-pulse' 
            : 'bg-blue-500 scale-100'
          }
        `}
      >
        <div className="text-white text-center">
          <p className="text-lg font-medium mb-2">
            {isConnected 
              ? (isRecording 
                ? '正在录音...' 
                : '按空格键开始/停止录音') 
              : '请点击开始'}
          </p>
          <p className="text-sm opacity-75">
            {isConnected 
              ? (isRecording 
                ? '再次按空格键停止' 
                : 'Press Space') 
              : '等待连接'}
          </p>
        </div>
      </div>
      
      {error && (
        <p className="text-red-500 mt-2">
          错误: {error.message}
        </p>
      )}
    </div>
  );
}
