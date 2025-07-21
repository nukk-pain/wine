#!/usr/bin/env node

const crypto = require('crypto');
const readline = require('readline');
const { promisify } = require('util');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const ITERATIONS = 100000;

// 비밀번호로부터 암호화 키 생성
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

// 시스템 키 생성
function getSystemKey() {
  const hostname = process.env.HOSTNAME || 'default';
  const platform = process.platform;
  const arch = process.arch;
  const fixedSecret = process.env.ENCRYPTION_SECRET || 'wine-tracker-default-secret';
  
  const combined = `${hostname}-${platform}-${arch}-${fixedSecret}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

// 텍스트 암호화
function encrypt(text, password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([salt, iv, tag, encrypted]);
  
  return combined.toString('base64');
}

// 텍스트 복호화
function decrypt(encryptedData, password) {
  const combined = Buffer.from(encryptedData, 'base64');
  
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = deriveKey(password, salt);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted.toString('utf8');
}

// CLI 인터페이스
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = promisify(rl.question).bind(rl);
  
  console.log('🔐 DSM Password Encryption Tool\n');
  
  try {
    const action = await question('Select action (encrypt/decrypt): ');
    
    if (action === 'encrypt') {
      const password = await question('Enter DSM password to encrypt: ');
      const systemKey = getSystemKey();
      const encrypted = encrypt(password, systemKey);
      
      console.log('\n✅ Encrypted password:');
      console.log(encrypted);
      console.log('\n📝 Add this to your .env.local file:');
      console.log(`DSM_PASSWORD_ENCRYPTED=${encrypted}`);
      console.log('\n⚠️  Remove the plain DSM_PASSWORD variable if present');
      
    } else if (action === 'decrypt') {
      const encrypted = await question('Enter encrypted password: ');
      const systemKey = getSystemKey();
      
      try {
        const decrypted = decrypt(encrypted, systemKey);
        console.log('\n✅ Decrypted password:', decrypted);
      } catch (error) {
        console.error('\n❌ Decryption failed:', error.message);
      }
      
    } else {
      console.log('\n❌ Invalid action. Use "encrypt" or "decrypt"');
    }
    
  } finally {
    rl.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}