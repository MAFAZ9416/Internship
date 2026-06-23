from django.contrib import admin
from django.db.models import Sum, Avg
from django.contrib import messages
from .models import AIModel, Conversation, Message, UploadedFile

class AIModelAdmin(admin.ModelAdmin):
    list_display = ("model_name", "display_name", "max_tokens", "is_active", "created_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("model_name", "display_name")

class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "model", "is_archived", "is_pinned", "created_at")
    list_filter = ("is_archived", "is_pinned", "model", "created_at")
    search_fields = ("title", "user__email", "user__profile__full_name")

class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "role", "token_count", "response_time", "created_at")
    list_filter = ("role", "created_at")
    search_fields = ("content", "conversation__title", "conversation__user__email")

    def changelist_view(self, request, extra_context=None):
        total_messages = Message.objects.count()
        if total_messages > 0:
            stats = Message.objects.aggregate(
                total_tokens=Sum('token_count'),
                avg_response_time=Avg('response_time')
            )
            total_tokens = stats.get('total_tokens') or 0
            avg_time = stats.get('avg_response_time') or 0.0
            
            msg = f"📊 System Stats: Total Messages: {total_messages} | Total Tokens Used: {total_tokens} | Average Response Time: {avg_time:.3f}s"
            # Add message to inform user on changelist page load
            # Make sure we only add it once per request
            if not any(m.message.startswith("📊 System Stats") for m in messages.get_messages(request)):
                self.message_user(request, msg, level=messages.INFO)
                
        return super().changelist_view(request, extra_context=extra_context)

class UploadedFileAdmin(admin.ModelAdmin):
    list_display = ("id", "file_name", "file_type", "file_size", "message")
    list_filter = ("file_type",)
    search_fields = ("file_name", "file_type")

admin.site.register(AIModel, AIModelAdmin)
admin.site.register(Conversation, ConversationAdmin)
admin.site.register(Message, MessageAdmin)
admin.site.register(UploadedFile, UploadedFileAdmin)