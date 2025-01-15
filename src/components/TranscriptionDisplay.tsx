interface TranscriptionDisplayProps {
  transcription: string[];
}

export default function TranscriptionDisplay({ transcription }: TranscriptionDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">实时转写</h2>
      <div className="h-[400px] overflow-y-auto bg-gray-50 p-4 rounded-md">
        {transcription.map((text, index) => (
          <p key={index} className="mb-2">
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}
