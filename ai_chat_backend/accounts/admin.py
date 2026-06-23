from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, UserProfile

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'

class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    
    list_display = (
        "avatar_preview",
        "full_name",
        "email",
        "date_joined"
    )
    
    search_fields = (
        "profile__full_name",
        "email"
    )
    
    list_filter = (
        "date_joined",
    )

    def avatar_preview(self, obj):
        try:
            profile = obj.profile
            if profile.avatar:
                return format_html(
                    '<img src="{}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />',
                    profile.avatar.url
                )
        except Exception:
            pass
        return "-"
    avatar_preview.short_description = "Avatar"

    def full_name(self, obj):
        try:
            return obj.profile.full_name
        except Exception:
            return ""
    full_name.short_description = "Full Name"
    full_name.admin_order_field = "profile__full_name"

admin.site.register(User, UserAdmin)

class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "avatar_preview",
        "full_name",
        "user_email",
        "user_date_joined"
    )
    
    search_fields = (
        "full_name",
        "user__email"
    )
    
    list_filter = (
        "user__date_joined",
    )

    def avatar_preview(self, obj):
        if obj.avatar:
            return format_html(
                '<img src="{}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />',
                obj.avatar.url
            )
        return "-"
    avatar_preview.short_description = "Avatar"

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "Email"
    user_email.admin_order_field = "user__email"

    def user_date_joined(self, obj):
        return obj.user.date_joined
    user_date_joined.short_description = "Joined Date"
    user_date_joined.admin_order_field = "user__date_joined"

admin.site.register(UserProfile, UserProfileAdmin)
