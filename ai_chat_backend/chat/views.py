from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import Q
import mimetypes
import os
import tempfile

from .models import *
from .serializers import *

import google.generativeai as genai
from django.conf import settings


def _prepare_temp_file(uploaded_file):
    if hasattr(uploaded_file, "temporary_file_path"):
        return uploaded_file.temporary_file_path(), False

    suffix = os.path.splitext(uploaded_file.name)[1]
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    for chunk in uploaded_file.chunks():
        temp_file.write(chunk)
    temp_file.flush()
    temp_file.close()
    return temp_file.name, True


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

                return Response({

                    "error":
                    "Message required"

                },status=400)


            conversation_id=request.data.get(
                "conversation_id"
            )


            if conversation_id:
                try:
                    conversation=Conversation.objects.get(
                        id=conversation_id,
                        user=request.user
                    )
                except Conversation.DoesNotExist:
                    return Response({
                        "error": "Conversation not found"
                    }, status=404)
            else:
                conversation=Conversation.objects.create(
                    user=request.user,
                    title=user_message[:30]
                )


            # Create user message
            user_msg=Message.objects.create(

                conversation=conversation,

                role="user",

                content=user_message

            )


            # Get files correctly through Message relation
            uploaded_files=UploadedFile.objects.filter(

                message__conversation=conversation

            )


            file_context=""


            for file in uploaded_files:

                file_context += f"""

File:
{file.file_name}

Type:
{file.file_type}

"""


            prompt=f"""

Context:

{file_context}

User:

{user_message}

"""


            try:

                model=genai.GenerativeModel(
                    "gemini-2.5-flash"
                )

                response=model.generate_content(
                    prompt
                )

                ai_text=(

                    response.text

                    if hasattr(
                        response,
                        "text"
                    )

                    else

                    "No response"

                )


            except Exception as e:

                print(
                    "GEMINI ERROR:",
                    e
                )

                ai_text=f"AI Error: {str(e)}"



            # Save AI response
            ai_msg=Message.objects.create(

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
                str(conversation.id),

                "ai_message_id":
                str(ai_msg.id)

            })


        except Exception as e:

            print(
                "CHAT ERROR:",
                e
            )

            return Response({

                "error":
                str(e)

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

            data = []
            for msg in messages:
                data.append({
                    "id": str(msg.id),
                    "role": msg.role,
                    "content": msg.content,
                    "files": UploadedFileSerializer(
                        UploadedFile.objects.filter(message=msg),
                        many=True,
                        context={"request": request}
                    ).data
                })

            return Response({

                "id": str(conversation.id),

                "title": conversation.title,

                "messages": data,

                "uploaded_files": UploadedFileSerializer(
                    UploadedFile.objects.filter(message__conversation=conversation),
                    many=True,
                    context={"request": request}
                ).data

            })

        except Conversation.DoesNotExist:

            return Response(

                {
                    "error":
                    "Conversation not found"
                },

                status=404

            )

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
# DELETE MESSAGE
# ==========================

class DeleteMessageView(APIView):

    permission_classes=[IsAuthenticated]

    def delete(self, request, id):
        try:
            message = Message.objects.get(id=id)
            if message.conversation.user != request.user:
                return Response({
                    "error": "Unauthorized"
                }, status=403)

            message.delete()
            return Response({
                "message": "Message deleted"
            })
        except Message.DoesNotExist:
            return Response({
                "error": "Message not found"
            }, status=404)


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
                    last_msg = Message.objects.filter(
                        conversation=conversation,
                        role='user'
                    ).order_by('-created_at').first()

                    uploaded_file = UploadedFile.objects.create(
                        message=last_msg,
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
                role='assistant',
                created_at__gt=user_message.created_at
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



# ==========================
# PIN/UNPIN CONVERSATION
# ==========================

class PinConversationView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        """
        Pin a conversation
        """
        try:
            conversation = Conversation.objects.get(
                id=id,
                user=request.user
            )

            conversation.is_pinned = True
            conversation.pinned_at = timezone.now()
            conversation.save()

            return Response({
                "message": "Conversation pinned",
                "is_pinned": conversation.is_pinned,
                "pinned_at": conversation.pinned_at
            }, status=status.HTTP_200_OK)

        except Conversation.DoesNotExist:
            return Response({
                "error": "Conversation not found"
            }, status=status.HTTP_404_NOT_FOUND)


class UnpinConversationView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        """
        Unpin a conversation
        """
        try:
            conversation = Conversation.objects.get(
                id=id,
                user=request.user
            )

            conversation.is_pinned = False
            conversation.pinned_at = None
            conversation.save()

            return Response({
                "message": "Conversation unpinned",
                "is_pinned": conversation.is_pinned
            }, status=status.HTTP_200_OK)

        except Conversation.DoesNotExist:
            return Response({
                "error": "Conversation not found"
            }, status=status.HTTP_404_NOT_FOUND)



# ==========================
# SEARCH ARCHIVED CONVERSATIONS
# ==========================

class SearchArchivedConversationsView(ListAPIView):

    permission_classes = [IsAuthenticated]

    serializer_class = ConversationSerializer

    def get_queryset(self):
        """
        Search archived conversations by title or first message
        Query param: q=search_query
        """
        user = self.request.user
        query = self.request.query_params.get('q', '').strip()

        # Get archived conversations
        archived_convs = Conversation.objects.filter(
            user=user,
            is_archived=True
        )

        if query:
            # Search in title and first message
            from django.db.models import Q

            archived_convs = archived_convs.filter(
                Q(title__icontains=query) |
                Q(message__content__icontains=query, message__role='user')
            ).distinct()

        return archived_convs.order_by('-updated_at')



# ==========================
# AUDIO TRANSCRIPTION
# ==========================

class AudioTranscribeView(APIView):

    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    SUPPORTED_AUDIO_TYPES = {
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'audio/x-wav': 'wav',
    }

    MAX_AUDIO_SIZE = 25 * 1024 * 1024  # 25MB

    def post(self, request):
        """
        Transcribe audio file and send transcript to AI
        Expects: audio_file, conversation_id (UUID), message (optional user message)
        Returns: transcript and AI response
        """
        try:
            conversation_id = request.data.get('conversation_id')
            user_message_text = request.data.get('message', '')

            if not conversation_id:
                return Response({
                    "error": "conversation_id required"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate conversation
            try:
                conversation = Conversation.objects.get(
                    id=conversation_id,
                    user=request.user
                )
            except Conversation.DoesNotExist:
                return Response({
                    "error": "Conversation not found"
                }, status=status.HTTP_404_NOT_FOUND)

            # Get audio file
            audio_file = request.FILES.get('audio_file')
            if not audio_file:
                return Response({
                    "error": "No audio file provided"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate audio size
            if audio_file.size > self.MAX_AUDIO_SIZE:
                return Response({
                    "error": "Audio file exceeds 25MB limit"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get file mime type
            mime_type, _ = mimetypes.guess_type(audio_file.name)
            if not mime_type:
                ext = os.path.splitext(audio_file.name)[1].lower()
                ext_mime_map = {
                    '.mp3': 'audio/mpeg',
                    '.wav': 'audio/wav',
                }
                mime_type = ext_mime_map.get(ext)

            # Validate audio type
            if mime_type not in self.SUPPORTED_AUDIO_TYPES:
                return Response({
                    "error": "Audio format not supported. Supported: mp3, wav"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Transcribe audio using Gemini (which supports audio files)
            try:
                import google.generativeai as genai

                # Upload file to Gemini
                temp_path, cleanup = _prepare_temp_file(audio_file)
                try:
                    genai_file = genai.upload_file(
                        path=temp_path,
                        mime_type=mime_type
                    )
                finally:
                    if cleanup and os.path.exists(temp_path):
                        os.remove(temp_path)

                # Create transcription prompt
                model = genai.GenerativeModel("gemini-2.0-flash")

                response = model.generate_content([
                    genai_file,
                    "Please transcribe this audio file. Return only the transcription text."
                ])

                transcript = response.text.strip()

                # Save transcript as user message
                user_msg = Message.objects.create(
                    conversation=conversation,
                    role="user",
                    content=f"🎵 Audio Transcription:\n\n{transcript}"
                )

                # If there's additional user message text, combine it
                if user_message_text.strip():
                    combined_message = f"{user_message_text}\n\n---\n\nAudio Transcript:\n{transcript}"
                else:
                    combined_message = transcript

                # Generate AI response using transcript
                try:
                    ai_model = genai.GenerativeModel("gemini-2.5-flash")
                    ai_response = ai_model.generate_content(combined_message)
                    ai_text = ai_response.text if hasattr(ai_response, "text") else "No response"

                except Exception as e:
                    print(f"Gemini Error: {e}")
                    ai_text = f"AI Processing Error: {str(e)}"

                # Save AI response
                ai_msg = Message.objects.create(
                    conversation=conversation,
                    role="assistant",
                    content=ai_text
                )

                return Response({
                    "transcript": transcript,
                    "user_message_id": str(user_msg.id),
                    "response": ai_text,
                    "ai_message_id": str(ai_msg.id),
                    "conversation_id": str(conversation.id)
                }, status=status.HTTP_200_OK)

            except Exception as e:
                print(f"Transcription Error: {e}")
                return Response({
                    "error": f"Transcription failed: {str(e)}"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            print(f"Audio Process Error: {e}")
            return Response({
                "error": "Audio processing failed"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# ==========================
# VIDEO PROCESSING
# ==========================

class VideoProcessView(APIView):

    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    SUPPORTED_VIDEO_TYPES = {
        'video/mp4': 'mp4',
        'video/quicktime': 'mov',
    }

    MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB

    def post(self, request):
        """
        Process video file - extract metadata and optionally transcribe audio
        Expects: video_file, conversation_id (UUID), message (optional)
        Returns: video metadata, transcript (if audio), and AI response
        """
        try:
            conversation_id = request.data.get('conversation_id')
            user_message_text = request.data.get('message', '')
            extract_audio = request.data.get('extract_audio', True)
            if isinstance(extract_audio, str):
                extract_audio = extract_audio.lower() in ("1", "true", "yes", "on")

            if not conversation_id:
                return Response({
                    "error": "conversation_id required"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate conversation
            try:
                conversation = Conversation.objects.get(
                    id=conversation_id,
                    user=request.user
                )
            except Conversation.DoesNotExist:
                return Response({
                    "error": "Conversation not found"
                }, status=status.HTTP_404_NOT_FOUND)

            # Get video file
            video_file = request.FILES.get('video_file')
            if not video_file:
                return Response({
                    "error": "No video file provided"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Validate video size
            if video_file.size > self.MAX_VIDEO_SIZE:
                return Response({
                    "error": "Video file exceeds 100MB limit"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get file mime type
            mime_type, _ = mimetypes.guess_type(video_file.name)
            if not mime_type:
                ext = os.path.splitext(video_file.name)[1].lower()
                ext_mime_map = {
                    '.mp4': 'video/mp4',
                    '.mov': 'video/quicktime',
                }
                mime_type = ext_mime_map.get(ext)

            # Validate video type
            if mime_type not in self.SUPPORTED_VIDEO_TYPES:
                return Response({
                    "error": "Video format not supported. Supported: mp4, mov"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Extract video metadata
            video_info = {
                "filename": video_file.name,
                "size_bytes": video_file.size,
                "size_display": self._format_file_size(video_file.size),
                "mime_type": mime_type,
            }

            transcript = ""
            ai_text = ""

            # Process video with Gemini
            try:
                import google.generativeai as genai

                # Upload video to Gemini
                temp_path, cleanup = _prepare_temp_file(video_file)
                try:
                    genai_file = genai.upload_file(
                        path=temp_path,
                        mime_type=mime_type
                    )
                finally:
                    if cleanup and os.path.exists(temp_path):
                        os.remove(temp_path)

                model = genai.GenerativeModel("gemini-2.0-flash")

                # Get video description
                video_prompt = "Please provide a brief description of the main content in this video."
                video_response = model.generate_content([
                    genai_file,
                    video_prompt
                ])

                video_description = video_response.text.strip()
                video_info["description"] = video_description

                # If extract_audio is enabled, try to get audio content
                if extract_audio:
                    try:
                        audio_prompt = "Please transcribe all audio/speech from this video. If there's no speech, just describe the audio content."
                        audio_response = model.generate_content([
                            genai_file,
                            audio_prompt
                        ])
                        transcript = audio_response.text.strip()
                    except Exception as e:
                        print(f"Audio extraction error: {e}")
                        transcript = "Audio extraction not available"

                # Save video message
                video_msg_content = f"🎬 Video: {video_file.name}\n\n"
                if transcript and transcript != "Audio extraction not available":
                    video_msg_content += f"Transcript:\n{transcript}\n\n"
                video_msg_content += f"Description:\n{video_description}"

                user_msg = Message.objects.create(
                    conversation=conversation,
                    role="user",
                    content=video_msg_content
                )

                # Generate AI response
                combined_message = f"Video: {video_file.name}\n\n"
                if user_message_text.strip():
                    combined_message += f"User query: {user_message_text}\n\n"
                combined_message += f"Video content:\n{video_description}"
                if transcript and transcript != "Audio extraction not available":
                    combined_message += f"\n\nAudio transcript:\n{transcript}"

                try:
                    ai_model = genai.GenerativeModel("gemini-2.5-flash")
                    ai_response = ai_model.generate_content(combined_message)
                    ai_text = ai_response.text if hasattr(ai_response, "text") else "No response"

                except Exception as e:
                    print(f"AI Response Error: {e}")
                    ai_text = f"AI Processing Error: {str(e)}"

                # Save AI response
                ai_msg = Message.objects.create(
                    conversation=conversation,
                    role="assistant",
                    content=ai_text
                )

                return Response({
                    "video_info": video_info,
                    "transcript": transcript,
                    "user_message_id": str(user_msg.id),
                    "response": ai_text,
                    "ai_message_id": str(ai_msg.id),
                    "conversation_id": str(conversation.id)
                }, status=status.HTTP_200_OK)

            except Exception as e:
                print(f"Video Process Error: {e}")
                return Response({
                    "error": f"Video processing failed: {str(e)}"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            print(f"Video Error: {e}")
            return Response({
                "error": "Video processing failed"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _format_file_size(self, size_bytes):
        """Format file size in human readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.2f} TB"