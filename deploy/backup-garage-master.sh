#!/usr/bin/env bash
set -euo pipefail

# ============================================
# Database backup script for AUTO_RENEW
# Backs up the current garage_master database
# ============================================

BACKUP_DIR="/root/garage_backups/auto-renew"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/garage_master_${TIMESTAMP}.sql"
CONTAINER_NAME="garage_postgres"
DB_NAME="garage_master"
DB_USER="garage_admin"

mkdir -p "${BACKUP_DIR}"

echo "Starting backup at $(date)"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "ERROR: Database container ${CONTAINER_NAME} is not running!"
    exit 1
fi

# Create backup via docker exec
docker exec -i "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" > "${BACKUP_FILE}"

if [ -s "${BACKUP_FILE}" ]; then
    gzip "${BACKUP_FILE}"
    echo "Backup completed successfully: ${BACKUP_FILE}.gz"
    echo "Backup size: $(du -h "${BACKUP_FILE}.gz" | cut -f1)"
else
    echo "ERROR: Backup file is empty!"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Remove old backups (older than RETENTION_DAYS)
echo "Removing backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "garage_master_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup process completed at $(date)"
