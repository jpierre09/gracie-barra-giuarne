import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file automatically
load_dotenv(BASE_DIR / '.env')
load_dotenv()

# 1. Django Security & Debug
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', os.getenv('SECRET_KEY', 'django-insecure-graciebarra-guarne-secret-key-2026'))
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

# 2. RBAC Admin Email Configuration
# Si un usuario que inicia sesión con Google coincide con esta variable, recibe rol 'ADMIN'
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', os.getenv('VITE_ADMIN_EMAIL', 'profesor@graciebarra.com')).strip().lower()

ALLOWED_HOSTS = [host.strip() for host in os.getenv('ALLOWED_HOSTS', '*').split(',') if host.strip()]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    
    # Third-party
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    
    # Local Apps
    'apps.core',
]

SITE_ID = 1

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'graciebarra.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'dist', BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'graciebarra.wsgi.application'

# 3. Database Configuration (DATABASE_URL / PostgreSQL)
db_url = os.getenv('DATABASE_URL')
if not db_url and os.getenv('POSTGRES_DB'):
    db_user = os.getenv('POSTGRES_USER', 'postgres')
    db_password = os.getenv('POSTGRES_PASSWORD', 'postgres')
    db_host = os.getenv('POSTGRES_HOST', 'localhost')
    db_port = os.getenv('POSTGRES_PORT', '5432')
    db_name = os.getenv('POSTGRES_DB', 'graciebarra_db')
    db_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

DATABASES = {
    'default': dj_database_url.config(
        default=db_url or f'sqlite:///{BASE_DIR}/db.sqlite3',
        conn_max_age=600,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
# Only Django/admin/allauth's own static files go through STATIC_URL + collectstatic.
# The Vite build is served separately below via WHITENOISE_ROOT, since Vite writes
# root-relative paths ("/assets/...", "/manifest.json") that don't live under /static/.
STATICFILES_DIRS = [d for d in [BASE_DIR / 'static'] if d.exists()]

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# --- PWA / Vite build serving (WhiteNoise) ---
# `npm run build` emits dist/index.html referencing root-relative paths like
# "/assets/index-HASH.js" and "/manifest.json" (see dist/index.html), NOT paths under
# STATIC_URL. WHITENOISE_ROOT makes WhiteNoiseMiddleware also serve every file under
# dist/ directly at the URL root. Because WhiteNoiseMiddleware intercepts matching
# requests before Django's URLconf resolves them, this ensures /assets/*, /manifest.json,
# /service-worker.js and the PWA icons are answered with their real file (and correct
# on-disk mimetype: application/javascript, text/css, application/json, ...) instead of
# falling through to the SPA catch-all in apps/core/urls.py, which was returning
# dist/index.html (text/html) for those requests and triggering the browser's strict
# MIME-type checks for module scripts, stylesheets and the manifest.
WHITENOISE_ROOT = BASE_DIR / 'dist'

# Vite's bundle filenames are content-hashed ("index-Dg0857Gz.js") and dist/assets/ is
# fully regenerated on every build, so everything under /assets/ can be cached forever.
# WhiteNoise's built-in immutable-file detection only recognizes hashed names living
# under STATIC_URL, so it must be told explicitly about the root-served /assets/ path.
# Root-level PWA files (manifest.json, service-worker.js, icons) are NOT hashed and
# intentionally fall back to the default WHITENOISE_MAX_AGE (60s) below, so a new
# Service Worker is picked up quickly instead of being cached for a year.
WHITENOISE_IMMUTABLE_FILE_TEST = r'^/assets/'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/login/'

# 4. Google OAuth 2.0 Provider Configuration
GOOGLE_OAUTH_CLIENT_ID = os.getenv('GOOGLE_OAUTH_CLIENT_ID', os.getenv('GOOGLE_CLIENT_ID', ''))
GOOGLE_OAUTH_CLIENT_SECRET = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET', os.getenv('GOOGLE_CLIENT_SECRET', ''))

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': GOOGLE_OAUTH_CLIENT_ID,
            'secret': GOOGLE_OAUTH_CLIENT_SECRET,
            'key': ''
        },
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
    }
}

# 5. Email SMTP Configuration for Automated Payment Alerts
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER or 'pagos@graciebarraguarne.com')

