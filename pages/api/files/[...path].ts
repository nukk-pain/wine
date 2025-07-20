import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/volume2/web/wine/wine-photos';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path: filePath } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    const fullPath = path.join(UPLOAD_DIR, ...Array.isArray(filePath) ? filePath : [filePath]);

    // 보안: 상위 디렉토리 접근 방지
    if (!fullPath.startsWith(UPLOAD_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 파일 존재 확인
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // MIME 타입 설정
    const mimeType = mime.lookup(fullPath) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1년 캐시

    // 파일 스트림 전송
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);

  } catch (error: any) {
    console.error('File serving error:', error);
    res.status(500).json({ error: 'File serving failed' });
  }
}