from rest_framework.generics import CreateAPIView
from .serializers import RegisterSerializer, UserProfileSerializer
from .models import UserProfile
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class CustomLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            email = request.data.get("email", "").strip()
            password = request.data.get("password", "")

            if not email or not password:
                return Response({"error": "Please fill all fields."}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.filter(email=email).first()

            if not user:
                return Response({"error": "No account found."}, status=status.HTTP_404_NOT_FOUND)

            authenticated_user = authenticate(
                username=user.username,
                password=password
            )

            if not authenticated_user:
                return Response({"error": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

            refresh = RefreshToken.for_user(authenticated_user)
            profile, _ = UserProfile.objects.get_or_create(user=authenticated_user)

            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": authenticated_user.id,
                    "full_name": profile.full_name,
                    "email": authenticated_user.email,
                    "avatar": profile.avatar.url if profile.avatar else None,
                    "bio": profile.bio,
                    "date_joined": authenticated_user.date_joined.isoformat(),
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print("Login error:", e)
            return Response({"error": "Something went wrong. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile