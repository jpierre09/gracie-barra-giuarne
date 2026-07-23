#!/bin/sh
set -e

echo "[INIT] Detectando nuevos cambios en los modelos..."
python manage.py makemigrations core --noinput || true

echo "[INIT] Aplicando migraciones de base de datos en PostgreSQL..."
python manage.py migrate --noinput || true

echo "[INIT] Iniciando servidor Gunicorn..."
exec "$@"
