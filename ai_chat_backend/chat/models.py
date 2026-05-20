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