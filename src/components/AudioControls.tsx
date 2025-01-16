interface AudioControlsProps {
  isConnected: boolean;
  error: Error | null;
}

export default function AudioControls({ isConnected, error }: AudioControlsProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div
        className={`
          w-48 h-48 rounded-full flex items-center justify-center
          transition-all duration-300 ease-in-out
          ${isConnected 
            ? 'bg-red-500 scale-110 animate-pulse' 
            : 'bg-blue-500 scale-100'
          }
        `}
      >
        <div className="text-white text-center">
          <p className="text-lg font-medium mb-2">
            {isConnected ? '正在录音...' : '按住空格键说话'}
          </p>
          <p className="text-sm opacity-75">
            {isConnected ? '松开空格键结束' : 'Press Space'}
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
