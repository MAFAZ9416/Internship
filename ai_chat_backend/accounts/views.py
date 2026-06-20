from rest_framework.generics import CreateAPIView
from .serializers import RegisterSerializer
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class CustomLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            username_or_email = request.data.get("username", "").strip()
            password = request.data.get("password", "")

            if not username_or_email or not password:
                return Response({"error": "Please fill all fields."}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.filter(
                Q(username=username_or_email) | Q(email=username_or_email)
            ).first()

            if not user:
                return Response({"error": "No account found."}, status=status.HTTP_404_NOT_FOUND)

            if not user.check_password(password):
                return Response({"error": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)

            refresh = RefreshToken.for_user(user)

            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print("Login error:", e)
            return Response({"error": "Something went wrong. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)