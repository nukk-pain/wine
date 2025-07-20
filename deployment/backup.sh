#!/bin/bash

BACKUP_DIR="/volume2/web/wine/backups/wine-tracker"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "💾 Creating backup..."

# 백업 디렉토리 생성
mkdir -p ${BACKUP_DIR}

# 앱 파일 백업
tar -czf ${BACKUP_DIR}/wine-tracker_${TIMESTAMP}.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=logs \
  /volume2/web/wine/wine-tracker/

# 이미지 파일 백업 (증분)
rsync -av /volume2/web/wine/wine-photos/ ${BACKUP_DIR}/photos/

# 7일 이상 된 백업 파일 삭제
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed: ${BACKUP_DIR}/wine-tracker_${TIMESTAMP}.tar.gz"