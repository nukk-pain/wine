import fs from 'fs/promises';
import path from 'path';

/**
 * 임시 디렉토리 경로 반환
 */
export function getTempDir(): string {
  return process.env.NODE_ENV === 'production' 
    ? '/volume2/web/wine/temp'
    : path.join(process.cwd(), 'temp');
}

/**
 * 임시 디렉토리 생성
 */
export async function ensureTempDir(): Promise<void> {
  const tempDir = getTempDir();
  
  try {
    await fs.access(tempDir);
  } catch {
    await fs.mkdir(tempDir, { recursive: true });
  }
}

/**
 * 임시 파일 정리 (24시간 이상 된 파일들)
 */
export async function cleanupTempFiles(): Promise<void> {
  const tempDir = getTempDir();
  const maxAge = 24 * 60 * 60 * 1000; // 24시간
  
  try {
    const files = await fs.readdir(tempDir);
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      // 24시간 이상 된 파일 삭제
      if (Date.now() - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
        console.log(`Cleaned up old temp file: ${file}`);
      }
    }
  } catch (error) {
    console.warn('Failed to cleanup temp files:', error);
  }
}