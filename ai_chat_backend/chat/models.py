from django.db import models

# Create your models here.

import uuid
from django.db import models
from accounts.models import User


class AIModel(models.Model):
    model_name = models.CharField(max_length=100)
    display_name = models.CharField(max_length=100)
    max_tokens = models.IntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Conversation(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    title = models.CharField(
        max_length=255
    )

    model = models.ForeignKey(
        AIModel,
        on_delete=models.SET_NULL,
        null=True
    )

    system_prompt = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    is_archived = models.BooleanField(
        default=False
    )

    archived_at = models.DateTimeField(
        null=True,
        blank=True
    )

    is_pinned = models.BooleanField(
        default=False
    )

    pinned_at = models.DateTimeField(
        null=True,
        blank=True
    )


class Message(models.Model):

    ROLE_CHOICES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System')
    )

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES
    )

    content = models.TextField()

    token_count = models.IntegerField(
        default=0
    )

    response_time = models.FloatField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    edited_at = models.DateTimeField(
        null=True,
        blank=True
    )

    original_content = models.TextField(
        null=True,
        blank=True
    )


class UploadedFile(models.Model):

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="uploaded_files"
    )

    file = models.FileField(
        upload_to="chat_uploads/"
    )

    file_name = models.CharField(
        max_length=255
    )

    file_type = models.CharField(
        max_length=50
    )

    file_size = models.IntegerField()

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.file_name