from django.db.models import Count
from rest_framework import serializers
from .models import MeetPoint, Attendance, ChatMessage, MessageReaction, RegisteredUser


class MeetPointSerializer(serializers.ModelSerializer):
    attendance_count = serializers.SerializerMethodField()

    class Meta:
        model = MeetPoint
        fields = ['id', 'date', 'city_slug', 'lat', 'lon', 'djia_value', 'hash_value', 'attendance_count']

    def get_attendance_count(self, obj):
        return obj.attendances.filter(status='going').count()


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'session_id', 'meetpoint', 'status', 'created_at']
        read_only_fields = ['created_at']


class ChatMessageSerializer(serializers.ModelSerializer):
    reaction_counts = serializers.SerializerMethodField()
    my_reactions    = serializers.SerializerMethodField()
    is_mine         = serializers.SerializerMethodField()
    time_display    = serializers.SerializerMethodField()

    class Meta:
        model  = ChatMessage
        fields = [
            'id', 'anon_name', 'message', 'created_at',
            'is_mine', 'reaction_counts', 'my_reactions', 'time_display',
        ]

    def _session(self):
        return self.context.get('session_id', '')

    def get_reaction_counts(self, obj):
        return dict(
            obj.reactions.values('emoji')
            .annotate(c=Count('id'))
            .values_list('emoji', 'c')
        )

    def get_my_reactions(self, obj):
        sid = self._session()
        if not sid:
            return []
        return list(obj.reactions.filter(session_id=sid).values_list('emoji', flat=True))

    def get_is_mine(self, obj):
        return str(obj.session_id) == self._session()

    def get_time_display(self, obj):
        return obj.created_at.strftime('%H:%M')


class RegisteredUserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = RegisteredUser
        fields = ['id', 'name', 'email', 'phone', 'avatar_url']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and request is not None:
            return request.build_absolute_uri(obj.avatar.url)
        return None
