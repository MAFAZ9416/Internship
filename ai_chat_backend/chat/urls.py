from django.urls import path

from .views import *

urlpatterns = [

    path(
        'chat/',
        ChatAPIView.as_view(),
        name='chat'
    ),

    path(
        'history/',
        ConversationListView.as_view(),
        name='history-list'
    ),

    path(
        'history/<uuid:id>/',
        ConversationHistoryView.as_view(),
        name='history-detail'
    ),

    path(
        'history/delete/<uuid:id>/',
        DeleteConversationView.as_view(),
        name='history-delete'
    ),
    
    path(
        'models/',
        AIModelListView.as_view()
    ),
]