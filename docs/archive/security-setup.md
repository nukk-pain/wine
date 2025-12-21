# DSM 비밀번호 암호화 가이드

## 1. 비밀번호 암호화 방법

### 로컬 환경에서 암호화
```bash
cd /mnt/d/my_programs/wine
node scripts/encrypt-password.js
```

1. "encrypt" 선택
2. DSM 비밀번호 입력
3. 생성된 암호화된 비밀번호를 복사

### NAS에서 암호화
```bash
cd /volume2/web/wine/wine-tracker
node scripts/encrypt-password.js
```

## 2. 환경 변수 설정

`.env.local` 파일에 추가:
```env
# 암호화된 비밀번호 사용
DSM_PASSWORD_ENCRYPTED=생성된_암호화_문자열

# 추가 보안을 위한 시크릿 (선택사항)
ENCRYPTION_SECRET=고유한_시크릿_문자열
```

## 3. 보안 고려사항

### 암호화 키 구성 요소
- 시스템 호스트명
- 운영체제 플랫폼
- CPU 아키텍처
- 사용자 정의 시크릿

### 권한 설정
```bash
# .env.local 파일 권한 제한
chmod 600 /volume2/web/wine/wine-tracker/.env.local
```

### 추가 보안 옵션

1. **파일 기반 키 관리** (더 높은 보안):
   - 별도 키 파일을 생성하여 관리
   - 키 파일은 .gitignore에 추가
   - 백업 시 별도 관리

2. **환경별 다른 시크릿**:
   - 개발: `ENCRYPTION_SECRET=dev-secret`
   - 운영: `ENCRYPTION_SECRET=prod-secret`

## 4. 문제 해결

### 복호화 실패 시
1. 시스템 환경이 동일한지 확인
2. ENCRYPTION_SECRET이 일치하는지 확인
3. 암호화된 문자열이 완전한지 확인

### 비밀번호 변경 시
1. 새 비밀번호로 다시 암호화
2. .env.local 파일 업데이트
3. PM2 재시작: `pm2 restart wine-tracker`