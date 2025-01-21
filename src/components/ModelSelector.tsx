interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export default function ModelSelector({ currentModel, onModelChange, disabled }: ModelSelectorProps) {
  return (
    <div className="flex items-center space-x-4 mb-4">
      <span className="text-sm text-gray-500">Model:</span>
      <div className="flex rounded-lg overflow-hidden">
        <button
          className={`px-4 py-2 text-sm transition-colors ${
            currentModel === 'gpt-4o-realtime-preview'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => onModelChange('gpt-4o-realtime-preview')}
          disabled={disabled}
        >
          GPT-4 Realtime
        </button>
        <button
          className={`px-4 py-2 text-sm transition-colors ${
            currentModel === 'gpt-4o-mini-realtime-preview'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => onModelChange('gpt-4o-mini-realtime-preview')}
          disabled={disabled}
        >
          GPT-4 Mini Realtime
        </button>
      </div>
    </div>
  );
}
