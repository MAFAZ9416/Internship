from django.contrib import admin
import os
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView
)
from accounts.admin_views import (
    AdminStatsView,
    AdminUsersView,
    AdminConversationsView,
    AdminMessagesView,
    AdminUploadsView
)

urlpatterns = [

    path(
        'admin/',
        admin.site.urls
    ),

    path(
        'api/auth/',
        include('accounts.urls')
    ),

    path(
        'api/admin/',
        include(([
            path('stats/', AdminStatsView.as_view(), name='admin-stats'),
            path('users/', AdminUsersView.as_view(), name='admin-users'),
            path('users/<uuid:pk>/', AdminUsersView.as_view(), name='admin-users-detail'),
            path('conversations/', AdminConversationsView.as_view(), name='admin-conversations'),
            path('conversations/<uuid:pk>/', AdminConversationsView.as_view(), name='admin-conversations-detail'),
            path('messages/', AdminMessagesView.as_view(), name='admin-messages'),
            path('messages/<int:pk>/', AdminMessagesView.as_view(), name='admin-messages-detail'),
            path('uploads/', AdminUploadsView.as_view(), name='admin-uploads'),
            path('uploads/<int:pk>/', AdminUploadsView.as_view(), name='admin-uploads-detail'),
        ], 'admin_api'))
    ),

    path(
        'api/',
        include('chat.urls')
    ),

    path(
        'api/schema/',
        SpectacularAPIView.as_view(),
        name='schema'
    ),

    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(
            url_name='schema'
        ),
        name='swagger-ui'
    ),

]

from django.conf.urls.static import static

# Serve media files in development or when explicitly enabled in production
if settings.DEBUG or os.getenv("SERVE_MEDIA_FROM_DJANGO", "False").lower() in ("1", "true", "yes"):
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {
            'document_root': settings.MEDIA_ROOT,
        }),
    ]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )