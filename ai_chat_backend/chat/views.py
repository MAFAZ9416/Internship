import requests
import time

from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
    DestroyAPIView
)

from .models import *
from .serializers import *

from analytics.models import APIUsage

class ChatAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = ChatSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user_message = serializer.validated_data.get(
            "message"
        )

        conversation_id = serializer.validated_data.get(
            "conversation_id"
        )

        try:

            if conversation_id:

                conversation = Conversation.objects.get(
                    id=conversation_id,
                    user=request.user
                )

            else:

                selected_model = AIModel.objects.get(
                    model_name='gemini-2.5-flash',
                    is_active=True
                )

                conversation = Conversation.objects.create(
                    user=request.user,
                    title=user_message[:20],
                    model=selected_model
                )


            Message.objects.create(
                conversation=conversation,
                role='user',
                content=user_message
            )


            url = (
                f"https://generativelanguage.googleapis.com/"
                f"v1/models/"
                f"{conversation.model.model_name}"
                f":generateContent"
                f"?key={settings.GEMINI_API_KEY}"
            )


            data = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": user_message
                            }
                        ]
                    }
                ]
            }


            start_time = time.time()


            max_retries = 3

            for attempt in range(max_retries):

                response = requests.post(
                    url,
                    json=data
                )

                result = response.json()

                print(result)

                if "error" in result:

                    error_code = result["error"].get(
                        "code"
                    )

                    if error_code == 503:

                        time.sleep(3)

                        if attempt < max_retries - 1:
                            continue

                break


            end_time = time.time()


            if "error" in result:

                return Response(
                    {
                        "error":
                        result["error"].get(
                            "message"
                        )
                    },
                    status=result["error"].get(
                        "code",
                        400
                    )
                )


            if "candidates" not in result:

                return Response(
                    {
                        "error":
                        "No response from AI"
                    },
                    status=400
                )


            ai_response = result[
                "candidates"
            ][0][
                "content"
            ][
                "parts"
            ][0][
                "text"
            ]


            usage = result.get(
                "usageMetadata",
                {}
            )


            Message.objects.create(
                conversation=conversation,
                role='assistant',
                content=ai_response,
                token_count=usage.get(
                    "totalTokenCount",
                    0
                ),
                response_time=round(
                    end_time-start_time,
                    2
                )
            )


            APIUsage.objects.create(
                user=request.user,
                conversation=conversation,
                model=conversation.model.model_name,
                prompt_tokens=usage.get(
                    "promptTokenCount",
                    0
                ),
                completion_tokens=usage.get(
                    "candidatesTokenCount",
                    0
                ),
                total_tokens=usage.get(
                    "totalTokenCount",
                    0
                )
            )


            return Response({

                "conversation_id":
                str(
                    conversation.id
                ),

                "title":
                conversation.title,

                "response":
                ai_response,

                "token_usage": {

                    "prompt_tokens":
                    usage.get(
                        "promptTokenCount",
                        0
                    ),

                    "completion_tokens":
                    usage.get(
                        "candidatesTokenCount",
                        0
                    ),

                    "total_tokens":
                    usage.get(
                        "totalTokenCount",
                        0
                    )

                }

            })


        except Conversation.DoesNotExist:

            return Response(
                {
                    "error":
                    "Conversation not found"
                },
                status=404
            )


        except AIModel.DoesNotExist:

            return Response(
                {
                    "error":
                    "AI model not found"
                },
                status=404
            )


        except Exception as e:

            return Response(
                {
                    "error":
                    str(e)
                },
                status=500
            )

class ConversationListView(ListAPIView):

    permission_classes = [IsAuthenticated]

    serializer_class = ConversationSerializer


    def get_queryset(self):

        return Conversation.objects.filter(
            user=self.request.user
        ).order_by('-created_at')




class ConversationHistoryView(RetrieveAPIView):

    permission_classes = [IsAuthenticated]

    serializer_class = ConversationSerializer

    lookup_field = 'id'


    def get_queryset(self):

        return Conversation.objects.filter(
            user=self.request.user
        )




class DeleteConversationView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, id):

        try:

            conversation = Conversation.objects.get(
                id=id,
                user=request.user
            )

            conversation.delete()

            return Response(
                {
                    "message": "Conversation deleted successfully"
                },
                status=200
            )

        except Conversation.DoesNotExist:

            return Response(
                {
                    "error": "Conversation not found"
                },
                status=404
            )
        
class AIModelListView(ListAPIView):

    permission_classes = [IsAuthenticated]

    serializer_class = AIModelSerializer

    queryset = AIModel.objects.filter(
        is_active=True
    )