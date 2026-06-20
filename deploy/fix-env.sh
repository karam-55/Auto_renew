#!/bin/bash
cd /opt/auto-renew/deploy
PG_PASS=$(cat /tmp/pg_pass | tr -d '\n')
EVO_PG_PASS=$(cat /tmp/evo_pg_pass | tr -d '\n')
REDIS_PASS=$(cat /tmp/redis_pass | tr -d '\n')
MINIO_PASS=$(cat /tmp/minio_pass | tr -d '\n')
JWT_SEC=$(cat /tmp/jwt_secret | tr -d '\n')
JWT_REF=$(cat /tmp/jwt_refresh | tr -d '\n')
EVO_KEY=$(cat /tmp/evo_api_key | tr -d '\n')

cat > .env << EOF
POSTGRES_USER=garage_admin
POSTGRES_PASSWORD=$PG_PASS
POSTGRES_DB=garage_master
EVO_POSTGRES_DB=evolution_db
EVO_POSTGRES_USER=postgres
EVO_POSTGRES_PASSWORD=$EVO_PG_PASS
REDIS_PASSWORD=$REDIS_PASS
MINIO_ROOT_USER=garage_minio
MINIO_ROOT_PASSWORD=$MINIO_PASS
MINIO_BUCKET=garage-files
JWT_SECRET=$JWT_SEC
JWT_REFRESH_SECRET=$JWT_REF
CORS_ORIGIN=*
CUSTOMER_CORS_ORIGIN=*
MECHANIC_CORS_ORIGIN=*
EVO_API_KEY=$EVO_KEY
EVO_INSTANCE_NAME=garage
DEFAULT_TENANT_ID=default
SERVER_IP=178.105.209.59
EOF

echo "ENV FIXED"
