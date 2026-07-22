# ==========================================
# Etapa 1: Compilación del Frontend (Node.js)
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copiar archivos de dependencias de Node
COPY package*.json ./

# Instalar dependencias del cliente
RUN npm install

# Copiar el resto del proyecto y compilar el paquete React/Vite
COPY . .
RUN npm run build

# ==========================================
# Etapa 2: Backend Django y Runtime (Python 3.11)
# ==========================================
FROM python:3.11-slim

# Configuración de entorno de Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=3000

WORKDIR /app

# Instalar dependencias del sistema operativo (C-compilers, libpq, Pillow C-libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python (Pillow, requests, pyjwt, cryptography, etc.)
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del proyecto Django
COPY . /app/

# Copiar los artefactos estáticos compilados de React/Vite desde la Etapa 1
COPY --from=frontend-builder /app/dist /app/dist

# Crear directorios obligatorios para archivos estáticos y multimedia
RUN mkdir -p /app/media /app/staticfiles

# Declarar volumen persistente para los comprobantes
VOLUME ["/app/media"]

# Recolectar estáticos para Whitenoise/Django
RUN python manage.py collectstatic --noinput || true

# Exponer el puerto configurado en docker-compose.yml
EXPOSE 3000

# Comando de arranque para Gunicorn en producción
CMD ["gunicorn", "--bind", "0.0.0.0:3000", "--workers", "3", "graciebarra.wsgi:application"]
