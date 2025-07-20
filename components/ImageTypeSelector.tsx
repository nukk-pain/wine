export type ImageType = 'wine_label' | 'receipt' | 'auto';

interface AutoDetectedType {
  type: 'wine_label' | 'receipt';
  confidence: number;
}

interface ImageTypeSelectorProps {
  onSelect: (type: ImageType) => void;
  autoDetected?: AutoDetectedType;
  selected?: ImageType | null;
  className?: string;
}

export function ImageTypeSelector({ 
  onSelect, 
  autoDetected, 
  selected, 
  className = '' 
}: ImageTypeSelectorProps) {
  const handleSelect = (type: ImageType) => {
    onSelect(type);
  };

  const getButtonClassName = (type: ImageType, emoji: string) => {
    const baseClass = `w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 border-2 transform active:scale-95`;
    const selectedClass = selected === type 
      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg' 
      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50';
    return `${baseClass} ${selectedClass}`;
  };

  const getTypeDisplayName = (type: 'wine_label' | 'receipt') => {
    return type === 'wine_label' ? '와인 라벨' : '영수증';
  };

  return (
    <div className={className}>
      <div className="space-y-3" role="radiogroup" aria-label="이미지 타입 선택">
        <button
          className={getButtonClassName('wine_label', '🍷')}
          onClick={() => handleSelect('wine_label')}
          role="radio"
          aria-checked={selected === 'wine_label'}
          type="button"
        >
          <div className="flex items-center justify-center space-x-3">
            <span className="text-2xl">🍷</span>
            <span>와인 라벨</span>
          </div>
        </button>
        
        <button
          className={getButtonClassName('receipt', '🧾')}
          onClick={() => handleSelect('receipt')}
          role="radio"
          aria-checked={selected === 'receipt'}
          type="button"
        >
          <div className="flex items-center justify-center space-x-3">
            <span className="text-2xl">🧾</span>
            <span>영수증</span>
          </div>
        </button>
        
        <button
          className={getButtonClassName('auto', '🤖')}
          onClick={() => handleSelect('auto')}
          role="radio"
          aria-checked={selected === 'auto'}
          type="button"
        >
          <div className="flex items-center justify-center space-x-3">
            <span className="text-2xl">🤖</span>
            <span>AI 자동 감지</span>
          </div>
        </button>
      </div>
      
      {autoDetected && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl" aria-live="polite">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-green-600 text-xl">✅</span>
            <span className="font-bold text-green-800">
              감지 완료: {getTypeDisplayName(autoDetected.type)}
            </span>
          </div>
          <div className="text-green-700 mb-3" role="status">
            신뢰도: {Math.round(autoDetected.confidence * 100)}%
          </div>
          <button 
            onClick={() => handleSelect(autoDetected.type)}
            type="button"
            className="w-full py-3 px-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors"
          >
            감지된 타입 사용하기
          </button>
          {autoDetected.confidence < 0.5 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg" role="alert">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-yellow-800 font-medium">
                  신뢰도가 낮습니다. 수동으로 선택하는 것을 권장합니다.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}