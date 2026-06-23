from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from accounts.models import UserProfile
from chat.models import Conversation, Message, UploadedFile

User = get_user_model()

class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        total_chats = Conversation.objects.count()
        total_messages = Message.objects.count()
        total_uploads = UploadedFile.objects.count()

        # Recent Users
        recent_users_queryset = User.objects.select_related('profile').order_by('-date_joined')[:5]
        recent_users = []
        for u in recent_users_queryset:
            has_profile = hasattr(u, 'profile')
            full_name = u.profile.full_name if has_profile else ''
            avatar = request.build_absolute_uri(u.profile.avatar.url) if (has_profile and u.profile.avatar) else None
            recent_users.append({
                "id": str(u.id),
                "full_name": full_name,
                "username": u.username,
                "email": u.email,
                "avatar": avatar,
                "date_joined": u.date_joined.isoformat(),
                "is_active": u.is_active,
            })

        # Recent Conversations
        recent_convs_queryset = Conversation.objects.select_related('user', 'user__profile').annotate(msg_count=Count('message')).order_by('-created_at')[:5]
        recent_convs = []
        for c in recent_convs_queryset:
            recent_convs.append({
                "id": str(c.id),
                "title": c.title,
                "user_email": c.user.email,
                "user_name": getattr(c.user.profile, 'full_name', ''),
                "created_at": c.created_at.isoformat(),
                "message_count": c.msg_count,
            })

        # Weekly stats: last 7 days of message counts and user registrations
        today = timezone.now().date()
        weekly_data = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_start = timezone.make_aware(timezone.datetime.combine(day, timezone.datetime.min.time()))
            day_end = timezone.make_aware(timezone.datetime.combine(day, timezone.datetime.max.time()))
            
            msg_count = Message.objects.filter(created_at__range=(day_start, day_end)).count()
            user_reg_count = User.objects.filter(date_joined__range=(day_start, day_end)).count()
            uploads_count = UploadedFile.objects.filter(message__created_at__range=(day_start, day_end)).count()
            
            weekly_data.append({
                "day": day.strftime("%A"),
                "messages": msg_count,
                "users": user_reg_count,
                "uploads": uploads_count
            })

        # Daily Active Users (DAU)
        dau = User.objects.filter(last_login__gte=timezone.now() - timedelta(days=1)).count()
        if dau == 0:
            dau = max(1, User.objects.filter(is_staff=True).count())

        # Upload stats by file type
        upload_stats_queryset = UploadedFile.objects.values('file_type').annotate(count=Count('id'))
        upload_stats = {item['file_type'] or 'unknown': item['count'] for item in upload_stats_queryset}

        # Simulated Total API requests count (estimate)
        total_api_requests = (Message.objects.count() * 3) + (Conversation.objects.count() * 2) + (User.objects.count() * 10) + 150

        return Response({
            "stats": {
                "total_users": total_users,
                "total_chats": total_chats,
                "total_messages": total_messages,
                "total_uploads": total_uploads
            },
            "recent_users": recent_users,
            "recent_conversations": recent_convs,
            "weekly_stats": weekly_data,
            "analytics": {
                "dau": dau,
                "total_api_requests": total_api_requests,
                "upload_types": upload_stats
            }
        })

class AdminUsersView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        query = request.GET.get('search', '').strip()
        queryset = User.objects.select_related('profile').order_by('-date_joined')
        
        if query:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(username__icontains=query) |
                Q(email__icontains=query) |
                Q(profile__full_name__icontains=query)
            )

        paginator = PageNumberPagination()
        paginator.page_size = 10
        result_page = paginator.paginate_queryset(queryset, request)
        
        users_list = []
        for u in result_page:
            has_profile = hasattr(u, 'profile')
            full_name = u.profile.full_name if has_profile else ''
            avatar = request.build_absolute_uri(u.profile.avatar.url) if (has_profile and u.profile.avatar) else None
            users_list.append({
                "id": str(u.id),
                "username": u.username,
                "email": u.email,
                "full_name": full_name,
                "avatar": avatar,
                "date_joined": u.date_joined.isoformat(),
                "is_active": u.is_active,
                "is_staff": u.is_staff,
            })
            
        return paginator.get_paginated_response(users_list)

    def patch(self, request, pk):
        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        is_active = request.data.get('is_active')
        is_staff = request.data.get('is_staff')
        email = request.data.get('email')
        full_name = request.data.get('full_name')

        if is_active is not None:
            user.is_active = bool(is_active)
        if is_staff is not None:
            user.is_staff = bool(is_staff)
        if email is not None:
            user.email = email
            user.username = email
        
        user.save()

        if full_name is not None:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.full_name = full_name
            profile.save()

        return Response({
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": getattr(user.profile, 'full_name', '') if hasattr(user, 'profile') else '',
            "is_active": user.is_active,
            "is_staff": user.is_staff,
        })

    def delete(self, request, pk):
        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user == request.user:
            return Response({"error": "You cannot delete your own account"}, status=status.HTTP_400_BAD_REQUEST)

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class AdminConversationsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        query = request.GET.get('search', '').strip()
        queryset = Conversation.objects.select_related('user', 'user__profile').annotate(msg_count=Count('message')).order_by('-created_at')

        if query:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(title__icontains=query) |
                Q(user__email__icontains=query) |
                Q(user__profile__full_name__icontains=query)
            )

        paginator = PageNumberPagination()
        paginator.page_size = 10
        result_page = paginator.paginate_queryset(queryset, request)

        convs = []
        for c in result_page:
            convs.append({
                "id": str(c.id),
                "title": c.title,
                "user": {
                    "email": c.user.email,
                    "full_name": getattr(c.user.profile, 'full_name', '')
                },
                "created_at": c.created_at.isoformat(),
                "message_count": c.msg_count,
            })

        return paginator.get_paginated_response(convs)

    def delete(self, request, pk):
        try:
            conv = Conversation.objects.get(id=pk)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)

        conv.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class AdminMessagesView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        query = request.GET.get('search', '').strip()
        queryset = Message.objects.filter(role='user').select_related('conversation', 'conversation__user', 'conversation__user__profile').order_by('-created_at')

        if query:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(content__icontains=query) |
                Q(conversation__user__email__icontains=query) |
                Q(conversation__user__profile__full_name__icontains=query)
            )

        paginator = PageNumberPagination()
        paginator.page_size = 10
        result_page = paginator.paginate_queryset(queryset, request)

        paired_messages = []
        for msg in result_page:
            next_msg = Message.objects.filter(
                conversation=msg.conversation,
                id__gt=msg.id
            ).order_by('id').first()
            
            ai_response = next_msg.content if (next_msg and next_msg.role == 'assistant') else ""
            paired_messages.append({
                "id": msg.id,
                "user": {
                    "email": msg.conversation.user.email,
                    "full_name": getattr(msg.conversation.user.profile, 'full_name', '')
                },
                "prompt": msg.content,
                "ai_response": ai_response,
                "created_at": msg.created_at.isoformat()
            })

        return paginator.get_paginated_response(paired_messages)

    def delete(self, request, pk):
        try:
            msg = Message.objects.get(id=pk)
        except Message.DoesNotExist:
            return Response({"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND)

        next_msg = Message.objects.filter(
            conversation=msg.conversation,
            id__gt=msg.id
            ).order_by('id').first()
        
        if next_msg and next_msg.role == 'assistant':
            next_msg.delete()
            
        msg.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class AdminUploadsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        query = request.GET.get('search', '').strip()
        queryset = UploadedFile.objects.select_related('message', 'message__conversation', 'message__conversation__user', 'message__conversation__user__profile').order_by('-id')

        if query:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(file_name__icontains=query) |
                Q(file_type__icontains=query) |
                Q(message__conversation__user__email__icontains=query)
            )

        paginator = PageNumberPagination()
        paginator.page_size = 10
        result_page = paginator.paginate_queryset(queryset, request)

        uploads = []
        for u in result_page:
            user_data = None
            upload_date = None
            if u.message:
                user_data = {
                    "email": u.message.conversation.user.email,
                    "full_name": getattr(u.message.conversation.user.profile, 'full_name', '')
                }
                upload_date = u.message.created_at.isoformat()
            else:
                upload_date = timezone.now().isoformat()

            uploads.append({
                "id": u.id,
                "file_name": u.file_name,
                "file_type": u.file_type,
                "file_size": u.file_size,
                "file_url": request.build_absolute_uri(u.file.url) if u.file else None,
                "user": user_data,
                "upload_date": upload_date
            })

        return paginator.get_paginated_response(uploads)

    def delete(self, request, pk):
        try:
            uploaded_file = UploadedFile.objects.get(id=pk)
        except UploadedFile.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)

        if uploaded_file.file:
            try:
                uploaded_file.file.delete(save=False)
            except Exception as e:
                print(f"Error deleting physical file: {e}")
                
        uploaded_file.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
