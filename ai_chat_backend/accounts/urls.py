from django.urls import path
from .views import RegisterView, CustomLoginView
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
        'token/refresh/',
        TokenRefreshView.as_view()
    )

]