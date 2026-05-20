from django.contrib import admin
from .models import AIModel, Conversation, Message

admin.site.register(AIModel)
admin.site.register(Conversation)
admin.site.register(Message)