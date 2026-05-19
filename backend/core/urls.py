from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('auth/register/', views.auth_register),
    path('auth/login/',    views.auth_login),
    path('auth/me/',       views.auth_me),

    # MeetPoint
    path('meetpoint/',          views.get_meetpoint),
    path('cities/',             views.list_cities),
    path('attendance/',         views.toggle_attendance),
    path('attendance/count/',   views.get_attendance_count),

    # Community Chat
    path('chat/',                       views.chat_messages),
    path('chat/<int:message_id>/react/', views.toggle_reaction),
]
