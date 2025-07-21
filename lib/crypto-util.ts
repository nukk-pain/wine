import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const ITERATIONS = 100000;

export class CryptoUtil {
  /**
   * 비밀번호로부터 암호화 키 생성
   */
  private static deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  }

  /**
   * 텍스트 암호화
   */
  static encrypt(text: string, password: string): string {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = this.deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    // 결과: salt + iv + tag + encrypted
    const combined = Buffer.concat([salt, iv, tag, encrypted]);
    
    return combined.toString('base64');
  }

  /**
   * 텍스트 복호화
   */
  static decrypt(encryptedData: string, password: string): string {
    const combined = Buffer.from(encryptedData, 'base64');
    
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    const key = this.deriveKey(password, salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  }

  /**
   * 환경 변수용 암호화 키 생성 (시스템 정보 기반)
   */
  static async getSystemKey(): Promise<string> {
    // 여러 시스템 정보를 조합하여 고유 키 생성
    const hostname = process.env.HOSTNAME || 'default';
    const platform = process.platform;
    const arch = process.arch;
    
    // 추가적인 엔트로피를 위해 고정된 시크릿 추가
    const fixedSecret = process.env.ENCRYPTION_SECRET || 'wine-tracker-default-secret';
    
    const combined = `${hostname}-${platform}-${arch}-${fixedSecret}`;
    
    // SHA-256 해시로 일관된 길이의 키 생성
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * 파일 기반 암호화 키 관리
   */
  static async getOrCreateFileKey(keyPath: string): Promise<string> {
    try {
      // 키 파일이 존재하면 읽기
      const key = await fs.readFile(keyPath, 'utf8');
      return key.trim();
    } catch (error) {
      // 키 파일이 없으면 생성
      const newKey = crypto.randomBytes(32).toString('hex');
      
      // 디렉토리 생성
      await fs.mkdir(path.dirname(keyPath), { recursive: true });
      
      // 키 파일 저장 (권한 제한)
      await fs.writeFile(keyPath, newKey, { mode: 0o600 });
      
      return newKey;
    }
  }
}

/**
 * CLI 도구: 비밀번호 암호화
 * 사용법: ts-node lib/crypto-util.ts encrypt <password>
 */
if (require.main === module) {
  const [command, value] = process.argv.slice(2);
  
  const run = async () => {
    const systemKey = await CryptoUtil.getSystemKey();
    
    if (command === 'encrypt' && value) {
      const encrypted = CryptoUtil.encrypt(value, systemKey);
      console.log('Encrypted password:');
      console.log(encrypted);
      console.log('\nAdd this to your .env file:');
      console.log(`DSM_PASSWORD_ENCRYPTED=${encrypted}`);
    } else if (command === 'decrypt' && value) {
      try {
        const decrypted = CryptoUtil.decrypt(value, systemKey);
        console.log('Decrypted:', decrypted);
      } catch (error) {
        console.error('Decryption failed:', error);
      }
    } else {
      console.log('Usage:');
      console.log('  Encrypt: ts-node lib/crypto-util.ts encrypt <password>');
      console.log('  Decrypt: ts-node lib/crypto-util.ts decrypt <encrypted>');
    }
  };
  
  run().catch(console.error);
}