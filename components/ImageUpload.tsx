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
      {/* Drag overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-wine-gold/20 rounded-2xl border-2 border-wine-gold flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 text-wine-gold mx-auto mb-2">
              {/* Upload icon placeholder - will be replaced in Phase 3 */}
              <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            </div>
            <p className="font-body text-wine-gold text-lg font-medium">
              Drop to Upload
            </p>
          </div>
        </div>
      )}

      {/* Main upload area */}
      <div
        className={`relative backdrop-blur-xl bg-wine-glass border-2 border-dashed ${isDragOver ? 'border-wine-gold' : 'border-wine-glassBorder'
          } rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 hover:bg-wine-glassHover hover:border-wine-gold/50 active:scale-[0.98]`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Wine bottle icon placeholder - will be replaced in Phase 3 */}
        <div className="mb-6">
          <svg className="w-20 h-20 text-wine-gold/60 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 2h8M12 15v5m-4 2h8M7 2l1 6c0 3 2 5 4 5s4-2 4-5l1-6" />
          </svg>
        </div>

        {/* Title */}
        <h3 className="font-playfair text-2xl text-wine-cream mb-3 font-light">
          Add Bottles
        </h3>

        {/* Description */}
        <p className="font-body text-wine-creamDim text-sm mb-6 leading-relaxed">
          Capture wine labels<br />
          to automatically track your collection
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

        {/* Upload button */}
        <button
          type="button"
          className="w-full py-4 px-6 min-h-[56px] bg-gradient-to-r from-wine-gold to-wine-goldDark text-wine-dark text-base font-body font-semibold rounded-xl shadow-wine hover:shadow-wine-lg hover:from-wine-goldDark hover:to-wine-gold transition-all duration-300 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <svg className="inline w-5 h-5 mr-2 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
          </svg>
          Upload Wine Label
        </button>

        {/* Auxiliary text */}
        <p className="font-body text-wine-creamDark text-xs mt-4">
          or drag and drop images
        </p>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-wine-red/10 border border-wine-red/40 text-wine-red rounded-xl" role="alert">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-body font-medium text-sm">{error}</span>
          </div>
        </div>
      )}

      {previewUrls.length > 0 && (
        <div className="mt-6">
          <h3 className="font-body text-base font-medium mb-3 text-wine-cream">
            Selected {multiple && `(${previewUrls.length})`}
          </h3>
          {multiple ? (
            <div className="grid grid-cols-2 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`선택된 이미지 ${index + 1}`}
                    className="w-full h-32 object-cover rounded-xl shadow-wine border border-wine-glassBorder"
                  />
                  <div className="absolute top-2 right-2 bg-wine-gold text-wine-dark px-2 py-1 rounded-full text-xs font-body font-semibold shadow-wine">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <img
                src={previewUrls[0]}
                alt="선택된 이미지"
                className="w-full rounded-xl shadow-wine border border-wine-glassBorder"
              />
              <div className="absolute top-2 right-2 bg-wine-gold text-wine-dark px-3 py-1.5 rounded-full text-sm font-body font-semibold shadow-wine">
                Ready
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { ImageUpload as default };