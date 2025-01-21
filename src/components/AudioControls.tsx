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
  isRecording,
}: AudioControlsProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* 状态指示器 */}
      <div className="relative w-48 h-48">
        {/* 外圈装饰 */}
        <div className="absolute inset-0 rounded-full border-4 border-white/10 
          animate-[spin_10s_linear_infinite]" />
        
        {/* 主要按钮 */}
        <button
          className={`
            relative w-full h-full rounded-full flex items-center justify-center
            transition-all duration-500 ease-out
            ${isRecording 
              ? 'bg-gradient-to-br from-red-500 to-red-600 scale-110' 
              : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:scale-105'
            }
            shadow-2xl hover:shadow-blue-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          disabled={!isConnected}
        >
          {/* 波纹动画 */}
          {isRecording && (
            <>
              <div className="ripple" style={{ animationDelay: '0s' }} />
              <div className="ripple" style={{ animationDelay: '0.5s' }} />
              <div className="ripple" style={{ animationDelay: '1s' }} />
            </>
          )}
          
          {/* 图标和文字 */}
          <div className="relative z-10 text-white text-center">
            <div className="text-3xl mb-2">
              {isRecording ? '⬤' : '●'}
            </div>
            <p className="text-sm font-medium">
              {isConnected 
                ? (isRecording ? '正在说话...' : '按住空格键说话') 
                : '请先连接'}
            </p>
          </div>
        </button>
      </div>

      {/* 控制按钮 */}
      <div className="flex gap-4">
        <button
          onClick={onStart}
          disabled={isConnected}
          className={`
            px-6 py-2.5 rounded-full font-medium text-sm
            transition-all duration-300
            ${isConnected 
              ? 'bg-gray-200 dark:bg-gray-800' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
            shadow-lg hover:shadow-xl active:scale-95
          `}
        >
          连接
        </button>
        
        <button
          onClick={onStop}
          disabled={!isConnected}
          className={`
            px-6 py-2.5 rounded-full font-medium text-sm
            transition-all duration-300
            ${!isConnected
              ? 'bg-gray-200 dark:bg-gray-800'
              : 'bg-red-500 hover:bg-red-600 text-white'
            }
            shadow-lg hover:shadow-xl active:scale-95
          `}
        >
          断开
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 w-full">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-red-500">
            {error.message}
          </div>
        </div>
      )}
    </div>
  );
}
