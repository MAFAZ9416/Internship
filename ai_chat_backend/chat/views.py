from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
import mimetypes
import os

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


            if conversation_id:

                conversation=Conversation.objects.get(
                    id=conversation_id,
                    user=request.user
                )

            else:

                conversation=Conversation.objects.create(
                    user=request.user,
                    title=user_message[:30]
                )


            # IMPORTANT
            user_msg=Message.objects.create(

                conversation=conversation,
                role="user",
                content=user_message

            )


            try:

                model=genai.GenerativeModel(
                    "gemini-2.5-flash"
                )

                response=model.generate_content(
                    user_message
                )

                ai_text=response.text


            except Exception as e:

                print(e)

                ai_text=f"""
AI Service Error:

{str(e)}
"""


            Message.objects.create(

                conversation=conversation,
                role="assistant",
                content=ai_text

            )


            return Response({

                "message_id":
                str(user_msg.id),

                "response":
                ai_text,

                "conversation_id":
                str(conversation.id)

            })


        except Exception as e:

            print(
                "CHAT ERROR:",
                e
            )

            return Response({

                "error":
                "Something went wrong"

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
            ).order_by(
                "created_at"
            )


            data=[]


            for msg in messages:

                data.append({

                    "id":
                    str(msg.id),

                    "role":
                    msg.role,

                    "content":
                    msg.content,

                    "timestamp":
                    msg.created_at,

                    "edited_at":
                    msg.edited_at,

                    "original_content":
                    msg.original_content

                })


            return Response({

                "id":
                str(conversation.id),

                "title":
                conversation.title,

                "messages":
                data

            })


        except Conversation.DoesNotExist:

            return Response({

                "error":
                "Conversation not found"

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
# ARCHIVE CHAT
# ==========================

class ArchiveConversationView(APIView):

    permission_classes=[IsAuthenticated]


    def post(self,request,id):

        try:

            conversation=Conversation.objects.get(
                id=id,
                user=request.user
            )


            conversation.is_archived=True
            conversation.archived_at=timezone.now()
            conversation.save()


            return Response({

                "message":"Archived"

            })


        except Conversation.DoesNotExist:

            return Response({

                "error":"Conversation not found"

            },status=404)



# ==========================
# RESTORE CHAT
# ==========================

class RestoreConversationView(APIView):

    permission_classes=[IsAuthenticated]


    def post(self,request,id):

        try:

            conversation=Conversation.objects.get(
                id=id,
                user=request.user
            )


            conversation.is_archived=False
            conversation.archived_at=None
            conversation.save()


            return Response({

                "message":"Restored"

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



# ==========================
# FILE UPLOAD
# ==========================

class FileUploadView(APIView):

    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    SUPPORTED_FILE_TYPES = {
        'application/pdf': 'pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'text/plain': 'txt',
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/webp': 'webp',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'video/mp4': 'mp4',
        'video/quicktime': 'mov',
    }

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

    def post(self, request):
        """
        Handle multiple file uploads
        Expects: files (MultiFile), conversation_id (UUID)
        """

        try:

            conversation_id = request.data.get('conversation_id')

            if not conversation_id:
                return Response({
                    "error": "conversation_id required"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate conversation exists and belongs to user
            try:
                conversation = Conversation.objects.get(
                    id=conversation_id,
                    user=request.user
                )
            except Conversation.DoesNotExist:
                return Response({
                    "error": "Conversation not found"
                }, status=status.HTTP_404_NOT_FOUND)

            # Get files from request
            files = request.FILES.getlist('files')

            if not files:
                return Response({
                    "error": "No files provided"
                }, status=status.HTTP_400_BAD_REQUEST)

            if len(files) > 10:
                return Response({
                    "error": "Maximum 10 files per request"
                }, status=status.HTTP_400_BAD_REQUEST)

            uploaded_files_data = []
            errors = []

            for file in files:

                # Validate file size
                if file.size > self.MAX_FILE_SIZE:
                    errors.append({
                        "file": file.name,
                        "error": f"File size exceeds 10MB limit"
                    })
                    continue

                # Get file mime type
                mime_type, _ = mimetypes.guess_type(file.name)

                if not mime_type:
                    # Fallback: check by extension
                    ext = os.path.splitext(file.name)[1].lower()
                    ext_mime_map = {
                        '.pdf': 'application/pdf',
                        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        '.txt': 'text/plain',
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg',
                        '.webp': 'image/webp',
                        '.mp3': 'audio/mpeg',
                        '.wav': 'audio/wav',
                        '.mp4': 'video/mp4',
                        '.mov': 'video/quicktime',
                    }
                    mime_type = ext_mime_map.get(ext)

                # Validate file type
                if mime_type not in self.SUPPORTED_FILE_TYPES:
                    errors.append({
                        "file": file.name,
                        "error": "File type not supported"
                    })
                    continue

                # Get file extension
                file_ext = self.SUPPORTED_FILE_TYPES.get(mime_type)

                # Create UploadedFile record
                try:
                    uploaded_file = UploadedFile.objects.create(
                        conversation=conversation,
                        file=file,
                        file_name=file.name,
                        file_type=file_ext,
                        file_size=file.size
                    )

                    serializer = UploadedFileSerializer(uploaded_file)
                    uploaded_files_data.append(serializer.data)

                except Exception as e:
                    errors.append({
                        "file": file.name,
                        "error": str(e)
                    })
                    continue

            # Return response
            response_data = {
                "uploaded": uploaded_files_data,
                "conversation_id": str(conversation_id),
            }

            if errors:
                response_data["errors"] = errors

            if not uploaded_files_data:
                return Response(
                    response_data,
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                response_data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            print(f"Upload Error: {e}")
            return Response({
                "error": "Upload failed"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# ==========================
# EDIT MESSAGE & REGENERATE
# ==========================

class EditMessageView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, id):
        """
        Edit user message and regenerate AI response
        Expects: message_id (uuid), new_content (str)
        """

        try:

            new_content = request.data.get('content')

            if not new_content or not new_content.strip():
                return Response({
                    "error": "Content required"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get the user message
            try:
                user_message = Message.objects.get(
                    id=id,
                    role='user'
                )
            except Message.DoesNotExist:
                return Response({
                    "error": "Message not found or not a user message"
                }, status=status.HTTP_404_NOT_FOUND)

            # Verify conversation belongs to user
            if user_message.conversation.user != request.user:
                return Response({
                    "error": "Unauthorized"
                }, status=status.HTTP_403_FORBIDDEN)

            # Store original content if not already stored
            if not user_message.original_content:
                user_message.original_content = user_message.content

            # Update message
            user_message.content = new_content.strip()
            user_message.edited_at = timezone.now()
            user_message.save()

            conversation = user_message.conversation

            # Find and delete the next AI response message
            ai_response = Message.objects.filter(
                conversation=conversation,
                role='assistant'
            ).order_by('created_at').first()

            if ai_response:
                # Get the AI message ID before deleting
                ai_message_id = ai_response.id
                ai_response.delete()

            # Generate new AI response
            try:

                model = genai.GenerativeModel(
                    "gemini-2.5-flash"
                )

                response = model.generate_content(
                    new_content
                )

                ai_text = response.text

            except Exception as e:

                print(f"Gemini Error: {e}")

                ai_text = f"""
AI Service Error:

{str(e)}
"""

            # Create new AI response message
            new_ai_message = Message.objects.create(
                conversation=conversation,
                role="assistant",
                content=ai_text
            )

            return Response({
                "message": "Message edited and regenerated",
                "user_message": {
                    "id": str(user_message.id),
                    "content": user_message.content,
                    "edited_at": user_message.edited_at,
                    "original_content": user_message.original_content
                },
                "ai_response": {
                    "id": str(new_ai_message.id),
                    "content": new_ai_message.content,
                    "created_at": new_ai_message.created_at
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:

            print(f"Edit Error: {e}")

            return Response({
                "error": "Failed to edit message"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)