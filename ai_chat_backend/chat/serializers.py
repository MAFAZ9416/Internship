from rest_framework import serializers
from .models import *


class ChatSerializer(serializers.Serializer):

    conversation_id = serializers.UUIDField(
        required=False
    )

    message = serializers.CharField()


class MessageSerializer(serializers.ModelSerializer):

    class Meta:

        model = Message

        fields = [
            'id',
            'role',
            'content',
            'token_count',
            'response_time',
            'created_at'
        ]



class ConversationSerializer(serializers.ModelSerializer):

    messages = MessageSerializer(
        source='message_set',
        many=True,
        read_only=True
    )

    class Meta:

        model = Conversation

        fields = [
            'id',
            'title',
            'model',
            'system_prompt',
            'created_at',
            'updated_at',
            'messages'
        ]

class AIModelSerializer(serializers.ModelSerializer):

    class Meta:
        model = AIModel

        fields = [
            'id',
            'model_name',
            'display_name',
            'max_tokens',
            'is_active'
        ]