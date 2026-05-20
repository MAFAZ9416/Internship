import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    ROLE_CHOICES = (
        ('user', 'User'),
        ('admin', 'Admin')
    )

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='user'
    )