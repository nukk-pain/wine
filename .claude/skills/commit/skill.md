---
name: commit
description: 현재까지의 작업을 논리적 단위별로 나눠서 커밋하는 스킬. git status/diff로 변경사항을 파악하고, 관련된 변경사항끼리 그룹화하여 순차적으로 커밋합니다. 커밋 컨벤션(type(scope): description)을 준수합니다.
last_updated: 2025-12-25
auto_generated: false
---

# Commit Skill

현재까지 작업한 내용을 논리적 단위별로 나눠서 커밋하는 스킬입니다.

## 트리거 문구

- "커밋해줘", "commit"
- "변경사항 커밋", "작업 저장"
- "논리적 단위로 커밋", "단계별 커밋"
- "/commit"

## 수행 단계

### 1. 현재 변경사항 확인

```bash
# Staged/unstaged 변경사항 확인
git status

# 각 파일의 변경 내용 파악
git diff
git diff --staged
```

### 2. 작업을 논리적 단위로 분류

관련된 변경사항끼리 그룹화하여 각 그룹이 하나의 완성된 기능/수정 단위가 되도록 구성합니다.

**분류 기준**:
- **기능 추가** (feat): 새로운 기능
- **버그 수정** (fix): 버그 수정
- **리팩토링** (refactor): 코드 개선 (기능 변경 없음)
- **문서** (docs): 문서 추가/수정
- **스타일** (style): 코드 포맷팅
- **테스트** (test): 테스트 추가/수정
- **빌드** (chore): 빌드/설정 변경

**그룹화 예시**:
```
그룹 1 (feat): 새로운 스킬 추가
  - .claude/skills/commit/skill.md
  - docs/skills/commit-usage.md

그룹 2 (docs): 커밋 가이드라인 문서
  - docs/commit.md
  
그룹 3 (refactor): DB 쿼리 유틸 개선
  - packages/ai-server/scripts/common/db_query_utils.py
```

### 3. 각 단위별로 순차 커밋

가장 핵심적인 변경부터 시작하여 각 작업 단위별로:

```bash
# 관련 파일들 스테이징
git add [관련 파일들]

# 컨벤션에 맞는 커밋
git commit -m "type(scope): description"

# 예시:
# git commit -m "feat(skills): Add commit skill for logical unit commits"
# git commit -m "docs(commit): Add commit convention guidelines"
# git commit -m "refactor(db-utils): Improve query utility functions"
```

### 4. 커밋 완료 확인

```bash
# 커밋 이력 확인
git log --oneline -10

# 남은 변경사항 확인
git status
```

## 커밋 메시지 컨벤션

### 형식

```
type(scope): subject

[optional body]

[optional footer]
```

### Type 종류

| Type | 설명 | 예시 |
|------|------|------|
| `feat` | 새로운 기능 추가 | `feat(auth): Add JWT refresh token` |
| `fix` | 버그 수정 | `fix(stt): Fix Whisper hallucination issue` |
| `refactor` | 코드 리팩토링 | `refactor(services): Apply singleton pattern` |
| `docs` | 문서 추가/수정 | `docs(api): Add API reference guide` |
| `style` | 코드 포맷팅 | `style(frontend): Fix ESLint warnings` |
| `test` | 테스트 추가/수정 | `test(api): Add visit creation tests` |
| `chore` | 빌드/설정 변경 | `chore(docker): Update Docker compose config` |
| `perf` | 성능 개선 | `perf(pipeline): Optimize STT processing` |
| `ci` | CI/CD 변경 | `ci(github): Add automated testing workflow` |
| `revert` | 커밋 되돌리기 | `revert: Revert "feat(auth): Add OAuth"` |

### Scope 예시

| Scope | 설명 |
|-------|------|
| `auth` | 인증/보안 |
| `api` | API 엔드포인트 |
| `frontend` | 프론트엔드 |
| `backend` | 백엔드 |
| `db` | 데이터베이스 |
| `stt` | 음성→텍스트 |
| `pipeline` | AI 파이프라인 |
| `skills` | Claude 스킬 |
| `docs` | 문서 |
| `docker` | Docker 설정 |

### Subject 작성 원칙

1. **명령형 현재형** 사용: "Add" (O), "Added" (X), "Adding" (X)
2. **첫 글자 대문자**: "Add feature" (O), "add feature" (X)
3. **마침표 없음**: "Add feature" (O), "Add feature." (X)
4. **50자 이내**: 간결하게
5. **"why" 보다 "what"**: 무엇을 했는지 명확히

### 좋은 예시

```bash
feat(skills): Add commit skill for logical unit commits
fix(stt): Prevent Whisper hallucination with VAD preprocessing
refactor(db): Extract query utilities to common module
docs(roadmap): Update Phase 0 gate conditions
chore(docker): Enable PWA in production mode
```

### 나쁜 예시

```bash
# Too vague
fix: fixed bug

# Past tense
feat: added new feature

# Not clear what changed
update: some changes

# Too long
feat(api): Add new endpoint for retrieving visit information with patient details and structured notes
```

## 주의사항

### 필수 체크

- ✅ 각 커밋은 독립적으로 의미가 있어야 함
- ✅ 관련 없는 변경사항은 별도 커밋으로 분리
- ✅ 민감한 파일은 커밋하지 않음 (.env, credentials.json 등)
- ✅ 테스트가 깨지지 않는 상태로 커밋
- ✅ 커밋 메시지는 명확하고 간결하게

### 커밋하지 말아야 할 것들

- `.env`, `.env.local` (환경 변수)
- `credentials.json`, `service-account.json` (인증 정보)
- `node_modules/`, `__pycache__/`, `.pytest_cache/` (빌드 산출물)
- `.DS_Store`, `Thumbs.db` (OS 임시 파일)
- 개인 설정 파일 (`.vscode/settings.json`, `.idea/`)

### Git 설정 권장사항

```bash
# .gitignore에 민감한 파일 추가
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo "credentials*.json" >> .gitignore

# 커밋 전 체크
git diff --check  # 공백 오류 체크
git status        # 변경사항 재확인
```

## 사용 예시

### 예시 1: 새 기능 추가

```bash
# 현재 상태 확인
git status
# modified: packages/ai-server/api/routes/visits.py
# modified: packages/web-app/app/(interview)/visits/page.tsx
# modified: docs/api-reference.md

# 그룹화
# 그룹 1: API 변경
# 그룹 2: Frontend 변경
# 그룹 3: 문서 변경

# 순차 커밋
git add packages/ai-server/api/routes/visits.py
git commit -m "feat(api): Add bulk consent endpoint"

git add packages/web-app/app/(interview)/visits/page.tsx
git commit -m "feat(frontend): Add consent confirmation UI"

git add docs/api-reference.md
git commit -m "docs(api): Document bulk consent endpoint"

# 확인
git log --oneline -3
```

### 예시 2: 버그 수정

```bash
git status
# modified: packages/ai-server/services/whisper_stt_service.py
# modified: tests/test_whisper.py

# 관련 파일 함께 커밋
git add packages/ai-server/services/whisper_stt_service.py tests/test_whisper.py
git commit -m "fix(stt): Fix Whisper VAD threshold for silence detection"

git log --oneline -1
```

### 예시 3: 여러 도메인 변경

```bash
git status
# modified: .claude/skills/_common/db_helper.py
# modified: .claude/skills/query-db/skill.md
# new file: docs/skills/common-utilities.md

# 그룹 1: 공통 유틸 추가
git add .claude/skills/_common/db_helper.py
git commit -m "feat(skills): Add shared DB utilities for skills"

# 그룹 2: query-db 스킬 업데이트
git add .claude/skills/query-db/skill.md
git commit -m "docs(skills): Update query-db skill documentation"

# 그룹 3: 문서 추가
git add docs/skills/common-utilities.md
git commit -m "docs(skills): Add common utilities guide"
```

## 문제 해결

### 잘못 스테이징한 경우

```bash
# 특정 파일 unstage
git reset HEAD <file>

# 전체 unstage
git reset HEAD
```

### 마지막 커밋 메시지 수정

```bash
# 아직 push 안 했다면
git commit --amend -m "새로운 커밋 메시지"

# 주의: push 후에는 --amend 사용 금지 (force push 필요)
```

### 커밋 취소

```bash
# 마지막 커밋 취소 (변경사항 유지)
git reset --soft HEAD~1

# 마지막 커밋 취소 (변경사항도 제거)
git reset --hard HEAD~1  # 주의: 복구 불가!
```

## 관련 문서

- [docs/commit.md](../../../docs/commit.md) - 커밋 가이드라인 원본
- [Git Commit Convention](https://www.conventionalcommits.org/) - Conventional Commits 스펙
- [CLAUDE.md](../../../CLAUDE.md) - 프로젝트 컨벤션

## 참고사항

이 스킬은 **자동 커밋을 수행하지 않습니다**. 대신:

1. 변경사항 분석
2. 논리적 그룹화 제안
3. 커밋 메시지 초안 제공
4. 사용자 확인 후 커밋 실행

이를 통해 의도하지 않은 커밋을 방지하고, 사용자가 커밋 내용을 완전히 이해할 수 있도록 합니다.
