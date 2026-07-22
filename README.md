# Gracie Barra Guarne - Plataforma PWA de Gestión y Cobro de Mensualidades

Sistema PWA full-stack para la academia de Jiu-Jitsu **Gracie Barra Guarne**, desarrollado con React, TypeScript, Tailwind CSS, Vite y Django.

---

## 🧹 Limpieza de Caché y Despliegue Local con Docker Compose

Para resolver cualquier problema de caché previa, librerías faltantes o desincronización de imágenes en tu máquina local o servidor Ubuntu:

```bash
# 1. Detener todos los contenedores y eliminar volúmenes huerfanos/cachés antiguas
docker-compose down -v --remove-orphans

# 2. Limpiar imágenes y compilaciones obsoletas de Docker en la máquina
docker system prune -f --volumes

# 3. Compilar e Iniciar los servicios con la versión actualizada
docker-compose up -d --build

# 4. Ejecutar migraciones de Django (creará las tablas con soporte para Pillow e imágenes)
docker-compose exec web python manage.py migrate

# 5. Crear superusuario administrador (Profesor)
docker-compose exec web python manage.py createsuperuser

# 6. Tu plataforma PWA estará disponible en:
# http://localhost:3000
```

---

## 📂 Organización de Archivos Multimedia (Comprobantes)

Los comprobantes de pago subidos por los alumnos se guardan organizados automáticamente con la siguiente ruta dinámica:

```text
/app/media/
└── comprobantes/
    └── {año}/
        └── {mes}/
            └── {nombre_estudiante_sanitizado}/
                └── {comprobante_sanitizado}.jpg
```

---

## 📦 Dependencias Backend Incluidas (`requirements.txt`)
- `Django>=5.0,<6.0`
- `gunicorn>=21.2.0`
- `psycopg2-binary>=2.9.9`
- `Pillow>=10.0.0` (Gestión y procesamiento de comprobantes en ImageField)
- `requests>=2.31.0`, `pyjwt>=2.8.0`, `cryptography>=42.0.0` (Validación de tokens Google Auth / django-allauth)
- `django-allauth>=0.61.0`
- `whitenoise>=6.6.0` & `dj-database-url>=2.1.0`

---

## 💾 Configuración de Volumen Persistente en Railway (Producción)

Para conservar las imágenes y comprobantes de pago subidos por los alumnos tras cada despliegue:

1. Ve a tu proyecto en **Railway**.
2. Selecciona el servicio web de Django.
3. Agrega un **Volume** y configura la ruta de montaje (Mount Path) en `/app/media`.
