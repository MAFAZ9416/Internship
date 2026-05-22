from django.urls import path

from .views import *

urlpatterns = [

    # Chat API
    path(
        "",
        ChatAPIView.as_view(),
        name="chat"
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