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

  const getButtonClassName = (type: ImageType) => {
    const baseClass = 'type-option-button';
    const selectedClass = selected === type ? 'bg-blue-500' : '';
    return `${baseClass} ${selectedClass}`.trim();
  };

  const getTypeDisplayName = (type: 'wine_label' | 'receipt') => {
    return type === 'wine_label' ? '와인 라벨' : '영수증';
  };

  return (
    <div className={`image-type-selector ${className}`.trim()}>
      <div className="type-options" role="radiogroup" aria-label="이미지 타입 선택">
        <button
          className={getButtonClassName('wine_label')}
          onClick={() => handleSelect('wine_label')}
          role="radio"
          aria-checked={selected === 'wine_label'}
          type="button"
        >
          와인 라벨
        </button>
        <button
          className={getButtonClassName('receipt')}
          onClick={() => handleSelect('receipt')}
          role="radio"
          aria-checked={selected === 'receipt'}
          type="button"
        >
          영수증
        </button>
        <button
          className={getButtonClassName('auto')}
          onClick={() => handleSelect('auto')}
          role="radio"
          aria-checked={selected === 'auto'}
          type="button"
        >
          자동 감지
        </button>
      </div>
      
      {autoDetected && (
        <div className="auto-detection-info" aria-live="polite">
          <div className="detected-type">
            감지된 타입: {getTypeDisplayName(autoDetected.type)}
          </div>
          <div className="confidence" role="status">
            신뢰도: {Math.round(autoDetected.confidence * 100)}%
          </div>
          <button 
            onClick={() => handleSelect(autoDetected.type)}
            type="button"
            className="use-detected-button"
          >
            감지된 타입 사용
          </button>
          {autoDetected.confidence < 0.5 && (
            <div className="warning" role="alert">
              신뢰도가 낮습니다. 수동으로 선택해주세요.
            </div>
          )}
        </div>
      )}
    </div>
  );
}