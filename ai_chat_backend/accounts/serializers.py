from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile
from PIL import Image

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'full_name',
            'email',
            'password'
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value

    def create(self, validated_data):
        email = validated_data.get('email')
        password = validated_data.get('password')
        full_name = validated_data.get('full_name')

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password
        )

        UserProfile.objects.update_or_create(
            user=user,
            defaults={'full_name': full_name}
        )

        return user

class CustomAvatarField(serializers.FileField):
    def to_representation(self, value):
        if not value:
            return None
        
        if isinstance(value, str):
            return value

        try:
            url = value.url
        except AttributeError:
            return None

        request = self.context.get('request')
        if request is not None:
            return request.build_absolute_uri(url)
        return url

class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)
    is_staff = serializers.BooleanField(source='user.is_staff', read_only=True)
    is_superuser = serializers.BooleanField(source='user.is_superuser', read_only=True)
    avatar = CustomAvatarField(required=False, allow_null=True)

    class Meta:
        model = UserProfile
        fields = [
            'full_name',
            'email',
            'avatar',
            'bio',
            'date_joined',
            'is_staff',
            'is_superuser'
        ]

    def validate_email(self, value):
        user = self.instance.user if self.instance else None
        queryset = User.objects.filter(email__iexact=value)
        if user:
            queryset = queryset.exclude(id=user.id)
        if queryset.exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value

    def validate_avatar(self, value):
        if not value:
            return value

        # Check file size (max 5MB)
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("File size exceeds the maximum limit of 5MB.")

        # Check content type
        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ]
        content_type = getattr(value, 'content_type', '')
        if content_type not in allowed_types:
            raise serializers.ValidationError("Only JPG, PNG and WEBP files are allowed.")

        # Check actual image integrity and format using Pillow
        try:
            img = Image.open(value)
            img.verify()
            if img.format not in ['JPEG', 'PNG', 'WEBP']:
                raise serializers.ValidationError("Only JPG, PNG and WEBP files are allowed.")
        except Exception:
            raise serializers.ValidationError("Only JPG, PNG and WEBP files are allowed.")
        finally:
            if hasattr(value, 'seek'):
                value.seek(0)

        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        new_email = user_data.get('email')

        if new_email:
            user = instance.user
            user.email = new_email
            user.username = new_email  # Always keep username and email synchronized!
            user.save()

        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.avatar = validated_data.get('avatar', instance.avatar)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.save()

        return instance