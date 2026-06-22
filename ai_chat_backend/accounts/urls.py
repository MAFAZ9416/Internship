from django.urls import path
from .views import RegisterView, CustomLoginView, UserProfileView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)

urlpatterns = [

    path(
        'register/',
        RegisterView.as_view()
    ),

    path(
        'login/',
        CustomLoginView.as_view()
    ),

    path(
        'profile/',
        UserProfileView.as_view()
    ),

    path(
        'token/refresh/',
        TokenRefreshView.as_view()
    )

]