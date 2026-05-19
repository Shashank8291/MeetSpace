import uuid
from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from django.db.models import Count


class MeetPoint(models.Model):
    date = models.DateField()
    city_slug = models.CharField(max_length=50)
    lat = models.FloatField()
    lon = models.FloatField()
    djia_value = models.FloatField()
    hash_value = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('date', 'city_slug')

    def __str__(self):
        return f"MeetPoint({self.city_slug} @ {self.date})"


class Attendance(models.Model):
    STATUS_CHOICES = [('going', 'Going'), ('interested', 'Interested')]

    session_id = models.UUIDField()
    meetpoint = models.ForeignKey(
        MeetPoint, on_delete=models.CASCADE, related_name='attendances'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='going')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('session_id', 'meetpoint')

    def __str__(self):
        return f"Attendance({self.session_id} → {self.meetpoint})"


class ChatMessage(models.Model):
    city_slug  = models.CharField(max_length=50, db_index=True)
    session_id = models.UUIDField(db_index=True)
    anon_name  = models.CharField(max_length=60)
    message    = models.TextField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.anon_name} [{self.city_slug}]: {self.message[:40]}"

    def reaction_counts(self):
        return dict(
            self.reactions.values('emoji')
            .annotate(c=Count('id'))
            .values_list('emoji', 'c')
        )


class MessageReaction(models.Model):
    EMOJI_CHOICES = [('☕', 'coffee'), ('🚀', 'rocket'), ('👍', 'thumbsup'), ('🔥', 'fire')]

    message    = models.ForeignKey(ChatMessage, on_delete=models.CASCADE, related_name='reactions')
    session_id = models.UUIDField()
    emoji      = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'session_id', 'emoji')

    def __str__(self):
        return f"{self.emoji} on msg#{self.message_id} by {self.session_id}"


class RegisteredUser(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=32)
    password_hash = models.CharField(max_length=128)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    auth_token = models.CharField(max_length=36, unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password_hash)

    def refresh_token(self):
        self.auth_token = uuid.uuid4()
        self.save(update_fields=['auth_token'])

    def __str__(self):
        return self.email
