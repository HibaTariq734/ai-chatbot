"""Environment-based settings; secrets belong in .env, never in source control."""
import os
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')
DEBUG = os.getenv('DEBUG', 'False').strip().lower() in ('true', '1', 'yes')
SECRET_KEY = os.getenv('SECRET_KEY', '').strip()
if not SECRET_KEY:
    if DEBUG:
        # Local development only. Production must provide a stable private key.
        SECRET_KEY = 'django-insecure-grove-local-development-only-do-not-use-in-production'
    else:
        raise ImproperlyConfigured('Set the SECRET_KEY environment variable when DEBUG is False.')


def env_list(name, default):
    """Trim dashboard-entered comma-separated values and ignore empty entries."""
    return [value.strip() for value in os.getenv(name, default).split(',') if value.strip()]


ALLOWED_HOSTS = env_list('ALLOWED_HOSTS', 'localhost,127.0.0.1')
INSTALLED_APPS = ['django.contrib.contenttypes', 'django.contrib.auth', 'rest_framework', 'corsheaders', 'chat']
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': BASE_DIR / 'db.sqlite3'}}
# Browsers treat localhost and 127.0.0.1 as different origins, even on this PC.
CORS_ALLOWED_ORIGINS = env_list(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173',
)
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_PARSER_CLASSES': ['rest_framework.parsers.JSONParser'],
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'UNAUTHENTICATED_USER': None,
}
DATA_UPLOAD_MAX_MEMORY_SIZE = 512_000
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
