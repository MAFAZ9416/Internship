from django.urls import path

from .views import *

urlpatterns = [

    # Chat API
    path(
        "",
        ChatAPIView.as_view(),
        name="chat"
    ),

    # Edit message
    path(
        "message/<int:id>/edit/",
        EditMessageView.as_view(),
        name="edit-message"
    ),

    # File Upload
    path(
        "upload/",
        FileUploadView.as_view(),
        name="file-upload"
    ),

    # History list
    path(
        "history/",
        ConversationListView.as_view(),
        name="history"
    ),

    # Open conversation
    path(
        "history/<uuid:id>/",
        ConversationHistoryView.as_view(),
        name="conversation-history"
    ),

    # Delete conversation
    path(
        "history/<uuid:id>/delete/",
        DeleteConversationView.as_view(),
        name="delete-conversation"
    ),

    # Archive conversation
    path(
        "history/<uuid:id>/archive/",
        ArchiveConversationView.as_view(),
        name="archive-conversation"
    ),

    # Restore conversation
    path(
        "history/<uuid:id>/restore/",
        RestoreConversationView.as_view(),
        name="restore-conversation"
    ),

    # AI models
    path(
        "models/",
        AIModelListView.as_view(),
        name="models"
    ),

    path(
        "history/<uuid:id>/rename/",
        RenameConversationView.as_view(),
        name="rename-conversation"
    ),


]