from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-(fcfvlb=zi*heq91m^yt)g-vj*+-rpq$obzxfvn3x#wo7cqjo4'

DEBUG = False

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    ".onrender.com",
]


INSTALLED_APPS = [

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'accounts',
    'chat',
    'analytics',

    'rest_framework',
    'rest_framework_simplejwt',
    'drf_spectacular',
    'corsheaders',

]


MIDDLEWARE = [

    'django.middleware.security.SecurityMiddleware',

    'corsheaders.middleware.CorsMiddleware',

    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

]


ROOT_URLCONF='ai_chat_backend.urls'

TEMPLATES=[

{
'BACKEND':'django.template.backends.django.DjangoTemplates',
'DIRS':[],
'APP_DIRS':True,
'OPTIONS':{
'context_processors':[

'django.template.context_processors.request',
'django.contrib.auth.context_processors.auth',
'django.contrib.messages.context_processors.messages',

],
},
},

]

WSGI_APPLICATION='ai_chat_backend.wsgi.application'


DATABASES={

'default':{

'ENGINE':'django.db.backends.sqlite3',
'NAME':BASE_DIR / 'db.sqlite3',

}

}


AUTH_PASSWORD_VALIDATORS=[

{
'NAME':'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
},

{
'NAME':'django.contrib.auth.password_validation.MinimumLengthValidator',
},

{
'NAME':'django.contrib.auth.password_validation.CommonPasswordValidator',
},

{
'NAME':'django.contrib.auth.password_validation.NumericPasswordValidator',
},

]


LANGUAGE_CODE='en-us'

TIME_ZONE='UTC'

USE_I18N=True

USE_TZ=True


STATIC_URL='static/'

MEDIA_URL='/media/'
MEDIA_ROOT=BASE_DIR / 'media'


AUTH_USER_MODEL='accounts.User'


REST_FRAMEWORK={

'DEFAULT_AUTHENTICATION_CLASSES':(

'rest_framework_simplejwt.authentication.JWTAuthentication',

),

'DEFAULT_PERMISSION_CLASSES':(

'rest_framework.permissions.IsAuthenticated',

),

'DEFAULT_SCHEMA_CLASS':
'drf_spectacular.openapi.AutoSchema',

}


SIMPLE_JWT={

"ACCESS_TOKEN_LIFETIME":
timedelta(hours=1),

"REFRESH_TOKEN_LIFETIME":
timedelta(days=7),

"ROTATE_REFRESH_TOKENS":
True,

"BLACKLIST_AFTER_ROTATION":
True,

}


load_dotenv()

GEMINI_API_KEY=os.getenv(
"GEMINI_API_KEY"
)

CORS_ALLOWED_ORIGINS=[

    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",

    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",

    "https://novaai-lac.vercel.app",

]

CORS_ALLOW_CREDENTIALS=True