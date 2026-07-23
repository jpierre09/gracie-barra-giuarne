#!/bin/sh
set -e

echo "[INIT] Ejecutando migraciones de base de datos..."
python manage.py migrate --noinput || true

echo "[INIT] Iniciando servidor..."
exec "$@"
