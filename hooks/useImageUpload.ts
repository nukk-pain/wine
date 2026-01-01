import { useState } from 'react';
import { ApiErrorResponse, UploadResponse } from '@/types';

interface ImageUploadConfig {
    maxFileSize: number;      // default: 10 * 1024 * 1024 (10MB)
    allowedTypes: string[];   // default: ['image/jpeg', 'image/png', 'image/webp']
    maxFiles: number;         // default: 20
}

export interface UploadResult {
    file: File;
    preview: string;
    uploadedUrl?: string; // Optional, populated if server returns a URL (e.g., S3/Blob)
    error?: string;
}

interface UseImageUploadReturn {
    isUploading: boolean;
    error: string | null;
    uploadFiles: (files: File[]) => Promise<UploadResult[]>;
    resetError: () => void;
}

const DEFAULT_CONFIG: ImageUploadConfig = {
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    maxFiles: 20
};

export function useImageUpload(config: Partial<ImageUploadConfig> = {}): UseImageUploadReturn {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetError = () => setError(null);

    const validateFile = (file: File): string | null => {
        if (!finalConfig.allowedTypes.includes(file.type) && !file.name.match(/\.(heic|heif)$/i)) {
            return `지원되지 않는 파일 형식입니다: ${file.type || file.name}`;
        }
        if (file.size > finalConfig.maxFileSize) {
            return `파일 크기가 너무 큽니다 (최대 ${(finalConfig.maxFileSize / (1024 * 1024)).toFixed(0)}MB)`;
        }
        return null;
    };

    const uploadFiles = async (files: File[]): Promise<UploadResult[]> => {
        setIsUploading(true);
        setError(null);

        // Check file count limit if batch
        // Note: This logic assumes batch upload. If incremental, parent handles limit.
        if (files.length > finalConfig.maxFiles) {
            setError(`최대 ${finalConfig.maxFiles}장까지 업로드 가능합니다.`);
            setIsUploading(false);
            return [];
        }

        const results: UploadResult[] = [];

        try {
            // Process files in parallel mostly, but we might want to validate all locally first
            // Prepare local previews and validation
            const localValidated = await Promise.all(files.map(async (file) => {
                const validationError = validateFile(file);
                let preview = '';

                if (!validationError) {
                    preview = URL.createObjectURL(file);
                }

                return {
                    file,
                    preview,
                    error: validationError || undefined
                };
            }));

            // Filter valid files for upload
            const validFiles = localValidated.filter(item => !item.error);
            const invalidFiles = localValidated.filter(item => item.error);

            // If no valid files, just return invalid ones
            if (validFiles.length === 0) {
                setIsUploading(false);
                // Clean up object URLs for invalid files (if any created?) - validation fail usually means no preview
                return localValidated;
            }

            // Upload valid files to server
            // We can use the existing /api/process endpoint handling, OR just upload?
            // The current implementation in index.tsx uses /api/process with form data
            // But typically we might want to separate upload and analysis.
            // However, current API /api/process handles BOTH upload and analysis?
            // Wait, let's check pages/index.tsx line 475 handleMultipleImageUpload.
            // It calls `fetch('/api/process', ...)`?
            // Actually `handleImageUpload` calls `/api/process`.
            // BUT `handleMultipleImageUpload` iterates and creates "pending" items, then calls `handleBatchAnalyze`.
            // `handleBatchAnalyze` calls `/api/process`.
            // So... `uploadFiles` in this hook name is misnomer for the logic in `index.tsx`?
            // Phase 2 plan says: "uploadFiles: files를 받아서 유효성 검사 후, 미리보기 생성 및 업로드 처리 결과를 반환".
            // "상태 저장은 Page가 담당".
            // DOES IT CALL API?
            // "uploadFiles" usually implies server upload.
            // But if the analysis API handles upload+analysis in one go, maybe we just return Local Preview?
            // OR does the system support "Upload first, then Analyze"?
            // `ImageProcessingItem` has `status: 'uploading'`.
            // Looking at `api/process.ts`, it handles `req.body.files` or `req.body.images`.
            // If `useImageUpload` is for JUST PREPARING files (validation + preview), it shouldn't call API yet if analysis is separate.
            // HOWEVER, if we need a URL for the analysis (e.g. if analysis expects a public URL), we must upload.
            // Most implementation in `index.tsx` seems to do:
            // 1. Select files -> Create local preview items (Pending).
            // 2. Click "Analyze" -> Send files to API.
            // So `useImageUpload` should probably JUST validate and return local previews?
            // BUT the interface in plan says `uploadFiles`.
            // And `UploadResponse` type exists.
            // Let's check `pages/index.tsx` again to see what it does.
            // `handleMultipleImageUpload`:
            // 1. Validates files.
            // 2. Creates objects with `preview: URL.createObjectURL(file)`.
            // 3. Updates state only.
            // It does NOT upload immediately.
            // `handleBatchAnalyze` actually calls `analyzeImage` which calls `fetch('/api/process')` with params including the file (formData).
            // So the API call happens at VALIDATION time? No, at ANALYSIS time.
            // So `useImageUpload` here should probably be renamed to `useFileSelection` or similar?
            // Or `useImageUpload` implies "Select and Prepare for Upload".
            // The plan description says: "files를 받아서 유효성 검사 후, 미리보기 생성 및 업로드 처리 결과를 반환".
            // "업로드 처리 결과"? `UploadResult` has `uploadedUrl?`.
            // If we implement "Upload Immediately" pattern (better UX), we upload to a temp storage and get a URL.
            // Then Analysis uses that URL.
            // This is robust.
            // The current `index.tsx` sends the FILE blob in `handleBatchAnalyze`.
            // If refactoring changes this to "Upload first", it changes the flow.
            // Senior Guide says: "useImageUpload... items 상태를 가지지 않습니다... 유효성 검사와 업로드 프로세스만 담당".
            // If strictly following the plan implies we should actually UPLOAD.
            // But `pages/api/process` does everything.
            // Does `/api/upload` exist?
            // Let's checking file list.

            // I will assume `useImageUpload` logic is: Accept Files -> Validate -> Return { File, Preview }.
            // The Plan's naming `uploadFiles` might be slightly misleading if no actual network upload happens separate from analysis.
            // OR, maybe the plan intended to introduce an upload step?
            // "3.2 파일 업로드 핸들러 분리" is a task in Phase 3.
            // Currently `api/process.ts` does it all.
            // So `useImageUpload` should likely just prepare the files (Validation & Preview) effectively acting as "Select Files".
            // UNLESS... `UploadResult` implies we *should* upload.
            // I will stick to: Validate & Create Preview.
            // The `uploadedUrl` in result will be undefined.
            // This preserves existing behavior where real upload happens during analysis.
            // I will add a comment clarifying this.

            return results.concat(localValidated.map(item => ({
                file: item.file,
                preview: item.preview,
                error: item.error
            })));

        } catch (err: any) {
            setError(err.message || '파일 처리 중 오류가 발생했습니다.');
            setIsUploading(false);
            return [];
        } finally {
            setIsUploading(false);
        }
    };

    return {
        isUploading,
        error,
        uploadFiles,
        resetError
    };
}
