from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured
import os

# Load environment variables early
load_dotenv()

# ==========================
# BASE DIRECTORY
# ==========================

BASE_DIR = Path(__file__).resolve().parent.parent

# ==========================
# SECURITY
# ==========================

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ImproperlyConfigured("The SECRET_KEY environment variable must be set.")

DEBUG = False

ALLOWED_HOSTS = [
    "novaai-60e1.onrender.com",
    "localhost",
    "127.0.0.1:8000",
]

# ==========================
# APPLICATIONS
# ==========================

INSTALLED_APPS = [
    # Django Apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third Party Apps
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",

    # Local Apps
    "accounts",
    "chat",
    "analytics",
]

# ==========================
# MIDDLEWARE
# ==========================
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# ==========================
# URLS & WSGI
# ==========================

ROOT_URLCONF = "ai_chat_backend.urls"

WSGI_APPLICATION = "ai_chat_backend.wsgi.application"

# ==========================
# TEMPLATES
# ==========================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ==========================
# DATABASE
# ==========================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ==========================
# PASSWORD VALIDATION
# ==========================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# ==========================
# INTERNATIONALIZATION
# ==========================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

# ==========================
# STATIC & MEDIA FILES
# ==========================

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ==========================
# CUSTOM USER MODEL
# ==========================

AUTH_USER_MODEL = "accounts.User"

# ==========================
# DJANGO REST FRAMEWORK
# ==========================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_SCHEMA_CLASS":
        "drf_spectacular.openapi.AutoSchema",
}

# ==========================
# SIMPLE JWT
# ==========================

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

# ==========================
# ENVIRONMENT VARIABLES
# ==========================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# ==========================
# CORS SETTINGS
# ==========================

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        ""
    ).split(",")
    if origin.strip()
]

CORS_ALLOW_ALL_ORIGINS = DEBUG

CORS_ALLOW_CREDENTIALS = True

# ==========================
# CSRF SETTINGS
# ==========================

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CSRF_TRUSTED_ORIGINS",
        ""
    ).split(",")
    if origin.strip()
]
# ==========================
# RENDER SSL SUPPORT
# ==========================

SECURE_PROXY_SSL_HEADER = (
    "HTTP_X_FORWARDED_PROTO",
    "https",
)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"