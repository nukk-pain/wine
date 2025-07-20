import React, { useState, useRef, ChangeEvent } from 'react';

interface ImageUploadProps {
  onUpload: (file: File) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageUpload({ onUpload }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processFile(file);
  };

  const processFile = (file: File) => {
    setError(null);

    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('이미지 파일만 업로드 가능합니다');
      return;
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      setError('파일 크기는 10MB 이하여야 합니다');
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 부모 컴포넌트에 파일 전달
    onUpload(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-blue-400 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-6xl mb-4">📷</div>
        <h3 className="text-xl font-bold mb-3 text-gray-800">사진 촬영하기</h3>
        <p className="text-gray-600 mb-6">와인 라벨이나 영수증을 촬영해주세요</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          aria-label="이미지 파일 선택"
          className="hidden"
        />
        <button
          type="button"
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-bold rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          📱 카메라 열기
        </button>
        <p className="text-sm text-gray-500 mt-3">또는 갤러리에서 선택</p>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl" role="alert">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}
      
      {previewUrl && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3 text-gray-800">📸 촬영된 이미지</h3>
          <div className="relative">
            <img 
              src={previewUrl} 
              alt="촬영된 이미지" 
              className="w-full rounded-xl shadow-lg border-2 border-gray-200"
            />
            <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              ✅ 업로드 완료
            </div>
          </div>
        </div>
      )}
    </div>
  );
}