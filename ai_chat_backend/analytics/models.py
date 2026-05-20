from django.db import models
from accounts.models import User
from chat.models import Conversation

# Create your models here.

class APIUsage(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE
    )

    model = models.CharField(
        max_length=100
    )

    prompt_tokens = models.IntegerField()
    completion_tokens = models.IntegerField()
    total_tokens = models.IntegerField()

    request_time = models.DateTimeField(
        auto_now_add=True
    )

    cost_estimate = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        default=0
    )