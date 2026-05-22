from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView
from rest_framework import status

from .models import *
from .serializers import *

import google.generativeai as genai
from django.conf import settings


# Configure Gemini
genai.configure(
    api_key=settings.GEMINI_API_KEY
)


# ==========================
# CHAT API
# ==========================

class ChatAPIView(APIView):

    permission_classes=[IsAuthenticated]

    def post(self,request):

        try:

            user_message=request.data.get(
                "message"
            )

            if not user_message:

                return Response(
                    {
                        "error":"Message required"
                    },
                    status=400
                )


            conversation_id=request.data.get(
                "conversation_id"
            )


            # Existing conversation
            if conversation_id:

                conversation=Conversation.objects.get(
                    id=conversation_id,
                    user=request.user
                )

            else:

                # New conversation
                conversation=Conversation.objects.create(
                    user=request.user,
                    title=user_message[:30]
                )


            # Save user message

            Message.objects.create(

                conversation=conversation,
                role="user",
                content=user_message

            )


            try:

                # Gemini model
                model=genai.GenerativeModel(
                    "gemini-2.5-flash"
                )

                print("========== MODEL ==========")
                print("Using model: gemini-2.5-flash")
                print("===========================")

                response=model.generate_content(
                    user_message
                )


                ai_text=response.text


            except Exception as e:

                print(
                    "========= GEMINI ERROR ========="
                )

                print(e)
                print(type(e))

                print(
                    "================================"
                )


                ai_text=f"""
AI Service Error:

{str(e)}
"""


            # Save AI response

            Message.objects.create(

                conversation=conversation,
                role="assistant",
                content=ai_text

            )


            return Response({

                "response":ai_text,
                "conversation_id":conversation.id

            })


        except Exception as e:

            print("CHAT ERROR:",e)

            return Response({

                "error":"Something went wrong"

            },status=500)



# ==========================
# HISTORY SIDEBAR
# ==========================

class ConversationListView(ListAPIView):

    permission_classes=[IsAuthenticated]

    serializer_class=ConversationSerializer


    def get_queryset(self):

        return Conversation.objects.filter(
            user=self.request.user
        ).order_by(
            "-created_at"
        )



# ==========================
# OPEN CHAT
# ==========================

class ConversationHistoryView(APIView):

    permission_classes=[IsAuthenticated]


    def get(self,request,id):

        try:

            conversation=Conversation.objects.get(
                id=id,
                user=request.user
            )


            messages=Message.objects.filter(
                conversation=conversation
            )


            data=[]


            for msg in messages:

                data.append({

                    "role":msg.role,
                    "content":msg.content,
                    "timestamp":msg.created_at

                })


            return Response({

                "id":str(conversation.id),
                "title":conversation.title,
                "messages":data

            })


        except Conversation.DoesNotExist:

            return Response({

                "error":"Conversation not found"

            },status=404)



# ==========================
# DELETE CHAT
# ==========================

class DeleteConversationView(APIView):

    permission_classes=[IsAuthenticated]


    def delete(self,request,id):

        try:

            conversation=Conversation.objects.get(
                id=id,
                user=request.user
            )

            conversation.delete()

            return Response({

                "message":"Deleted"

            })


        except Conversation.DoesNotExist:

            return Response({

                "error":"Conversation not found"

            },status=404)



# ==========================
# RENAME CHAT
# ==========================

class RenameConversationView(APIView):

    permission_classes=[IsAuthenticated]


    def patch(self,request,id):

        try:

            conversation=Conversation.objects.get(
                id=id,
                user=request.user
            )


            title=request.data.get(
                "title"
            )


            if not title:

                return Response({

                    "error":"Title required"

                },status=400)


            conversation.title=title
            conversation.save()


            return Response({

                "message":"Renamed"

            })


        except Conversation.DoesNotExist:

            return Response({

                "error":"Conversation not found"

            },status=404)



# ==========================
# AI MODEL LIST
# ==========================

class AIModelListView(ListAPIView):

    permission_classes=[IsAuthenticated]

    serializer_class=AIModelSerializer

    queryset=AIModel.objects.filter(
        is_active=True
    )