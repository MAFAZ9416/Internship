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

DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")

ALLOWED_HOSTS = [
    "novaai-60e1.onrender.com",
    "localhost",
    "127.0.0.1",
]

# ==========================
# APPLICATIONS
# ==========================

INSTALLED_APPS = [
    # Django Apps
    "jazzmin",
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

db_path = Path(os.getenv("DATABASE_PATH", str(BASE_DIR / "db.sqlite3")))
db_dir = db_path.parent
if not db_dir.exists():
    try:
        db_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        print(f"Could not create database directory {db_dir}: {e}")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": db_path,
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
MEDIA_ROOT = Path(os.getenv("MEDIA_ROOT", str(BASE_DIR / "media")))
if not MEDIA_ROOT.exists():
    try:
        MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        print(f"Could not create media root directory {MEDIA_ROOT}: {e}")

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
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://novaai-lake.vercel.app",
]

env_cors = os.getenv("CORS_ALLOWED_ORIGINS", "")
if env_cors:
    CORS_ALLOWED_ORIGINS.extend([
        origin.strip() for origin in env_cors.split(",") if origin.strip()
    ])

CORS_ALLOW_ALL_ORIGINS = DEBUG

CORS_ALLOW_CREDENTIALS = True

# ==========================
# CSRF SETTINGS
# ==========================

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://novaai-lake.vercel.app",
    "https://novaai-60e1.onrender.com",
]

env_csrf = os.getenv("CSRF_TRUSTED_ORIGINS", "")
if env_csrf:
    CSRF_TRUSTED_ORIGINS.extend([
        origin.strip() for origin in env_csrf.split(",") if origin.strip()
    ])
# ==========================
# RENDER SSL SUPPORT
# ==========================

SECURE_PROXY_SSL_HEADER = (
    "HTTP_X_FORWARDED_PROTO",
    "https",
)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ==========================
# JAZZMIN CONFIGURATION
# ==========================

JAZZMIN_SETTINGS = {
    "site_title": "Nova AI Admin",
    "site_header": "Nova AI",
    "site_brand": "Nova AI Console",
    "welcome_sign": "Welcome to the Nova AI Admin Dashboard",
    "copyright": "Nova AI Ltd",
    "search_model": ["accounts.User"],
    "user_avatar": "avatar_url",  # User model property
    "topmenu_links": [
        {"name": "Home",  "url": "admin:index", "permissions": ["auth.view_user"]},
        {"model": "accounts.User"},
    ],
    "show_sidebar": True,
    "navigation_expanded": True,
    "hide_apps": [],
    "hide_models": [],
    "icons": {
        "accounts.User": "fas fa-user-shield",
        "accounts.UserProfile": "fas fa-id-card",
        "chat.AIModel": "fas fa-robot",
        "chat.Conversation": "fas fa-comments",
        "chat.Message": "fas fa-comment-alt",
        "chat.UploadedFile": "fas fa-file-upload",
    },
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",
    "related_modal_active": True,
    "custom_css": None,
    "custom_js": None,
    "show_ui_builder": False,
    "changeform_format": "horizontal_tabs",
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_color": "navbar-dark",
    "accent": "accent-primary",
    "navbar": "navbar-dark navbar-primary",
    "no_navbar_border": False,
    "navbar_link_size": "navbar-small",
    "sidebar_link_size": "sidebar-small",
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "flatly",
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-outline-primary",
        "secondary": "btn-outline-secondary",
        "info": "btn-outline-info",
        "warning": "btn-outline-warning",
        "danger": "btn-outline-danger",
        "success": "btn-outline-success"
    }
}