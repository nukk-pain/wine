import React, { useState, useRef, ChangeEvent } from 'react';
import { UPLOAD_CONSTANTS } from '@/lib/constants';

interface ImageUploadProps {
  onUpload: (files: File[]) => void;
  multiple?: boolean;
}

const { ALLOWED_TYPES, MAX_FILE_SIZE, BATCH_SIZE } = UPLOAD_CONSTANTS;

export function ImageUpload({ onUpload, multiple = false }: ImageUploadProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    processFiles(fileArray);
  };

  const processFiles = (files: File[]) => {
    setError(null);
    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    for (const file of files) {
      // 파일 타입 검증
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`${file.name}: 이미지 파일만 업로드 가능합니다`);
        continue;
      }

      // 파일 크기 검증
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name}: 파일 크기는 10MB 이하여야 합니다`);
        continue;
      }

      validFiles.push(file);

      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        newPreviewUrls.push(result);
        
        // 모든 파일의 미리보기가 생성되면 상태 업데이트
        if (newPreviewUrls.length === validFiles.length) {
          setPreviewUrls(multiple ? [...previewUrls, ...newPreviewUrls] : newPreviewUrls);
        }
      };
      reader.readAsDataURL(file);
    }

    if (validFiles.length > 0) {
      // 부모 컴포넌트에 파일 전달
      onUpload(validFiles);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      processFiles(fileArray);
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
        <div className="text-6xl mb-4">🖼️</div>
        <h3 className="text-xl font-bold mb-3 text-gray-800">
          {multiple ? '이미지 다중 업로드' : '이미지 업로드'}
        </h3>
        <p className="text-gray-600 mb-6">
          {multiple ? '여러 와인 라벨 이미지를 한 번에 선택해주세요' : '와인 라벨이나 영수증 이미지를 선택해주세요'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileChange}
          aria-label={multiple ? "여러 이미지 파일 선택" : "이미지 파일 선택"}
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
          {multiple ? '📂 여러 이미지 선택' : '📂 갤러리에서 선택'}
        </button>
        <p className="text-sm text-gray-500 mt-3">
          {multiple ? '또는 여러 이미지를 드래그하여 업로드' : '또는 이미지를 드래그하여 업로드'}
        </p>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl" role="alert">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}
      
      {previewUrls.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3 text-gray-800">
            📸 선택된 이미지 {multiple && `(${previewUrls.length}개)`}
          </h3>
          {multiple ? (
            <div className="grid grid-cols-2 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img 
                    src={url} 
                    alt={`선택된 이미지 ${index + 1}`}
                    className="w-full h-32 object-cover rounded-xl shadow-lg border-2 border-gray-200"
                  />
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    ✅ {index + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <img 
                src={previewUrls[0]} 
                alt="선택된 이미지" 
                className="w-full rounded-xl shadow-lg border-2 border-gray-200"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                ✅ 업로드 완료
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { ImageUpload as default };