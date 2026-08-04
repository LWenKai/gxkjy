#!/usr/bin/env sh
set -eu

BACKUP_DIR=${BACKUP_DIR:-/backup}
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-14}
DATE_TAG=$(date +"%Y%m%d%H%M%S")
FILE_NAME="${MYSQL_DATABASE}_${DATE_TAG}.sql.gz"

mkdir -p "$BACKUP_DIR"

if [ -z "${MYSQL_DATABASE:-}" ] || [ -z "${MYSQL_USER:-}" ] || [ -z "${MYSQL_PASSWORD:-}" ]; then
  echo "MYSQL_DATABASE, MYSQL_USER and MYSQL_PASSWORD are required." >&2
  exit 1
fi

if command -v mysqldump >/dev/null 2>&1; then
  MYSQL_PWD="${MYSQL_PASSWORD}" mysqldump \
    -h "${MYSQL_HOST:-mysql}" \
    -P "${MYSQL_PORT:-3306}" \
    -u "${MYSQL_USER}" \
    --single-transaction \
    --no-tablespaces \
    --routines \
    --triggers \
    "${MYSQL_DATABASE}" | gzip > "${BACKUP_DIR}/${FILE_NAME}"
elif command -v docker >/dev/null 2>&1; then
  COMPOSE_FILE=${COMPOSE_FILE:-deploy/docker-compose.yml}
  docker compose -f "$COMPOSE_FILE" exec -T mysql sh -c \
    'MYSQL_PWD="$MYSQL_PASSWORD" mysqldump -u "$MYSQL_USER" --single-transaction --no-tablespaces --routines --triggers "$MYSQL_DATABASE"' \
    | gzip > "${BACKUP_DIR}/${FILE_NAME}"
else
  echo "mysqldump or docker is required." >&2
  exit 1
fi

find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "backup created: ${BACKUP_DIR}/${FILE_NAME}"
