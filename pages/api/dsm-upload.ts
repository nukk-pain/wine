import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import { createDSMClient } from '../../lib/dsm-auth';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    // DSM File Station을 통한 업로드
    const uploadResult = await uploadToDSM(file);

    res.json({
      success: true,
      fileName: uploadResult.fileName,
      filePath: uploadResult.filePath,
      fileUrl: `/api/files/${uploadResult.fileName}`,
      fileSize: uploadResult.fileSize,
      uploadedViaDSM: true
    });

  } catch (error: any) {
    console.error('DSM Upload error:', error);
    res.status(500).json({ 
      error: 'File upload failed',
      details: error.message 
    });
  }
}

async function parseUploadedFile(req: NextApiRequest): Promise<{ file?: any; error?: string }> {
  return new Promise((resolve) => {
    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
      filter: ({ mimetype }) => {
        if (!mimetype) return false;
        return ALLOWED_TYPES.includes(mimetype);
      }
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
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
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return { valid: false, error: 'Invalid file type. Only images allowed.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum 10MB allowed.' };
  }

  if (file.originalFilename) {
    const originalName = file.originalFilename;
    if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
      return { valid: false, error: 'Invalid filename. Path traversal detected.' };
    }
    
    if (originalName.length > 255) {
      return { valid: false, error: 'Filename too long. Maximum 255 characters allowed.' };
    }
  }

  if (file.size === 0) {
    return { valid: false, error: 'Empty file not allowed.' };
  }

  return { valid: true };
}

async function uploadToDSM(file: any) {
  try {
    // DSM 클라이언트 생성
    const dsmClient = await createDSMClient();
    
    // 안전한 파일명 생성
    const timestamp = Date.now();
    const originalExt = file.originalFilename 
      ? file.originalFilename.split('.').pop() 
      : 'jpg';
    const safeFileName = `wine_${timestamp}.${originalExt}`;
    
    // 파일을 File 객체로 변환
    const fileBuffer = await fs.readFile(file.filepath);
    const blob = new Blob([fileBuffer], { type: file.mimetype });
    const uploadFile = new File([blob], safeFileName, { type: file.mimetype });
    
    // DSM 업로드 경로
    const uploadPath = process.env.DSM_UPLOAD_PATH || '/wine-photos';
    
    // DSM에 업로드
    const uploadResponse = await dsmClient.uploadFile(uploadFile, uploadPath);
    
    // 임시 파일 삭제
    await fs.unlink(file.filepath);
    
    // DSM 로그아웃
    await dsmClient.logout();
    
    return {
      fileName: safeFileName,
      filePath: `${uploadPath}/${safeFileName}`,
      fileSize: file.size,
      dsmResponse: uploadResponse
    };
    
  } catch (error) {
    // 임시 파일 정리
    try {
      await fs.unlink(file.filepath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError);
    }
    
    throw new Error(`DSM upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}