import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

// Next.js bodyParser 비활성화 (파일 업로드를 위해)
export const config = {
  api: {
    bodyParser: false,
  },
};

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/volume2/web/wine/wine-photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 업로드 디렉토리 확인 및 생성
    await ensureUploadDir();

    // 파일 파싱
    const { file, error } = await parseUploadedFile(req);
    if (error) {
      return res.status(400).json({ error });
    }

    // 파일 검증
    const validation = validateFile(file);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // 파일 저장 및 최적화
    const savedFile = await saveAndOptimizeFile(file);

    res.json({
      success: true,
      fileName: savedFile.fileName,
      filePath: savedFile.filePath,
      fileUrl: `/uploads/${savedFile.fileName}`,
      fileSize: savedFile.fileSize,
      optimized: savedFile.optimized
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'File upload failed',
      details: error.message 
    });
  }
}

async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

async function parseUploadedFile(req: NextApiRequest): Promise<{ file?: any; error?: string }> {
  return new Promise((resolve) => {
    const form = formidable({
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE,
      filter: ({ mimetype }) => {
        if (!mimetype) return false;
        return ALLOWED_TYPES.includes(mimetype);
      }
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        // 특정 에러 메시지 처리
        if (err.code === 'LIMIT_FILE_SIZE') {
          resolve({ error: 'File too large. Maximum 10MB allowed.' });
          return;
        }
        if (err.code === 'LIMIT_FILE_TYPE') {
          resolve({ error: 'Invalid file type. Only images allowed.' });
          return;
        }
        resolve({ error: err.message });
        return;
      }

      // 다양한 필드명 지원 (image, file, upload 등)
      const fileFields = ['image', 'file', 'upload'];
      let file = null;
      
      for (const fieldName of fileFields) {
        if (files[fieldName]) {
          file = Array.isArray(files[fieldName]) ? files[fieldName][0] : files[fieldName];
          break;
        }
      }

      if (!file) {
        resolve({ error: 'No file uploaded' });
        return;
      }

      resolve({ file });
    });
  });
}

function validateFile(file: any) {
  // 1. MIME 타입 검증
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return { valid: false, error: 'Invalid file type. Only images allowed.' };
  }

  // 2. 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum 10MB allowed.' };
  }

  // 3. 파일명 보안 검증 (경로 순회 공격 방지)
  if (file.originalFilename) {
    const originalName = file.originalFilename;
    if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
      return { valid: false, error: 'Invalid filename. Path traversal detected.' };
    }
    
    // 파일명 길이 제한
    if (originalName.length > 255) {
      return { valid: false, error: 'Filename too long. Maximum 255 characters allowed.' };
    }
    
    // 특수 문자 제한
    if (!/^[a-zA-Z0-9._\-\s()]+$/.test(originalName)) {
      return { valid: false, error: 'Invalid filename. Only alphanumeric characters, spaces, dots, dashes, underscores, and parentheses allowed.' };
    }
  }

  // 4. 빈 파일 검증
  if (file.size === 0) {
    return { valid: false, error: 'Empty file not allowed.' };
  }

  return { valid: true };
}

async function saveAndOptimizeFile(file: any) {
  const timestamp = Date.now();
  const originalExt = path.extname(file.originalFilename || 'image.jpg');
  
  // 안전한 파일명 생성 (타임스탬프 + 확장자만 사용)
  const safeFileName = `wine_${timestamp}${originalExt}`;
  
  // 절대 경로 확인 및 경로 순회 방지
  const filePath = path.resolve(UPLOAD_DIR, safeFileName);
  const uploadDirResolved = path.resolve(UPLOAD_DIR);
  
  // 업로드 디렉토리 밖으로 나가는지 확인
  if (!filePath.startsWith(uploadDirResolved)) {
    throw new Error('Invalid file path. Path traversal detected.');
  }

  try {
    // Sharp로 이미지 최적화 (웹용)
    await sharp(file.filepath)
      .resize(1200, 1200, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85 })
      .toFile(filePath);

    // 원본 임시 파일 삭제
    await fs.unlink(file.filepath);

    const stats = await fs.stat(filePath);

    return {
      fileName: safeFileName,
      filePath,
      fileSize: stats.size,
      optimized: true
    };

  } catch (error) {
    // 최적화 실패 시 원본 파일 그대로 저장
    await fs.copyFile(file.filepath, filePath);
    await fs.unlink(file.filepath);

    const stats = await fs.stat(filePath);

    return {
      fileName: safeFileName,
      filePath,
      fileSize: stats.size,
      optimized: false
    };
  }
}