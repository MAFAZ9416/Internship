from rest_framework import serializers
from .models import *


class ChatSerializer(serializers.Serializer):

    message = serializers.CharField()

    conversation_id = serializers.UUIDField(
        required=False,
        allow_null=True
    )


class UploadedFileSerializer(serializers.ModelSerializer):

    file_size_display = serializers.SerializerMethodField()

    class Meta:

        model = UploadedFile

        fields = [

            "id",
            "file",
            "file_name",
            "file_type",
            "file_size",
            "file_size_display",
            "uploaded_at"

        ]

        read_only_fields = fields


    def get_file_size_display(self,obj):

        size=obj.file_size

        for unit in [

            "B",
            "KB",
            "MB",
            "GB"

        ]:

            if size<1024:

                return f"{size:.2f} {unit}"

            size/=1024

        return f"{size:.2f} TB"


class MessageSerializer(serializers.ModelSerializer):

    class Meta:

        model = Message

        fields = [
            'id',
            'role',
            'content',
            'token_count',
            'response_time',
            'created_at',
            'edited_at',
            'original_content'
        ]

class ConversationSerializer(serializers.ModelSerializer):

    messages=MessageSerializer(

        source="message_set",

        many=True,

        read_only=True

    )

    uploaded_files = serializers.SerializerMethodField()

    class Meta:

        model=Conversation

        fields=[

            "id",
            "title",
            "model",
            "system_prompt",
            "created_at",
            "updated_at",
            "is_archived",
            "archived_at",
            "is_pinned",
            "pinned_at",
            "messages",
            "uploaded_files"

        ]

    def get_uploaded_files(self, obj):
        return UploadedFileSerializer(
            UploadedFile.objects.filter(message__conversation=obj),
            many=True
        ).data




class AIModelSerializer(serializers.ModelSerializer):

    class Meta:

        model=AIModel

        fields=[

            "id",
            "model_name",
            "display_name",
            "max_tokens",
            "is_active"

        ]