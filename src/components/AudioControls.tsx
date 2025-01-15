interface AudioControlsProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  error: Error | null;
}

export default function AudioControls({ isConnected, onConnect, onDisconnect, error }: AudioControlsProps) {
  return (
    <div className="mb-8">
      <button
        onClick={isConnected ? onDisconnect : onConnect}
        className={`px-4 py-2 rounded-md ${
          isConnected
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isConnected ? '断开连接' : '开始录音'}
      </button>
      
      {error && (
        <p className="text-red-500 mt-2">
          错误: {error.message}
        </p>
      )}
      
      <div className="mt-2">
        <span className={`inline-block px-2 py-1 rounded-full text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          状态: {isConnected ? '已连接' : '未连接'}
        </span>
      </div>
    </div>
  );
}
