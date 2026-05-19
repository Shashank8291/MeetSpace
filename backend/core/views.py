from datetime import date, timedelta
from django.db.models import Count
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import MeetPoint, Attendance, ChatMessage, MessageReaction, RegisteredUser
from .serializers import MeetPointSerializer, ChatMessageSerializer, RegisteredUserSerializer
from .geohash import compute_geohash, CITIES

ALLOWED_EMOJIS = {'☕', '🚀', '👍', '🔥'}


def get_user_from_request(request):
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Token '):
        token = auth_header.split(' ', 1)[1].strip()
        return RegisteredUser.objects.filter(auth_token=token).first()
    return None


def build_user_response(user, request):
    return {
        'token': str(user.auth_token),
        'user': RegisteredUserSerializer(user, context={'request': request}).data,
    }


@api_view(['POST'])
def auth_register(request):
    name = (request.data.get('name') or '').strip()
    email = (request.data.get('email') or '').strip().lower()
    phone = (request.data.get('phone') or '').strip()
    password = request.data.get('password')
    avatar = request.FILES.get('avatar')

    if not name or not email or not phone or not password:
        return Response({'error': 'Name, phone, email, and password are required.'}, status=400)
    if RegisteredUser.objects.filter(email=email).exists():
        return Response({'error': 'A user with that email already exists.'}, status=400)

    user = RegisteredUser(name=name, email=email, phone=phone, avatar=avatar)
    user.set_password(password)
    user.save()
    return Response(build_user_response(user, request), status=status.HTTP_201_CREATED)


@api_view(['POST'])
def auth_login(request):
    email = (request.data.get('email') or '').strip().lower()
    password = request.data.get('password')

    if not email or not password:
        return Response({'error': 'Email and password are required.'}, status=400)

    user = RegisteredUser.objects.filter(email=email).first()
    if not user or not user.check_password(password):
        return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    user.refresh_token()
    return Response(build_user_response(user, request))


@api_view(['GET', 'PUT', 'PATCH'])
def auth_me(request):
    user = get_user_from_request(request)
    if not user:
        return Response({'error': 'Authentication token required.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method in ['PUT', 'PATCH']:
        name = request.data.get('name')
        phone = request.data.get('phone')
        avatar = request.FILES.get('avatar')

        if name:
            user.name = name.strip()
        if phone:
            user.phone = phone.strip()
        if avatar:
            user.avatar = avatar

        user.save()
        return Response({'user': RegisteredUserSerializer(user, context={'request': request}).data})

    return Response({'user': RegisteredUserSerializer(user, context={'request': request}).data})


# ─────────────────────────────────────────────────────────────
# MeetPoint
# ─────────────────────────────────────────────────────────────

@api_view(['GET'])
def get_meetpoint(request):
    city_slug = request.query_params.get('city', 'bangalore')
    today = date.today().isoformat()

    try:
        geo = compute_geohash(today, city_slug)
    except ValueError as e:
        return Response({'error': str(e)}, status=400)

    mp, _ = MeetPoint.objects.get_or_create(
        date=today,
        city_slug=city_slug,
        defaults={
            'lat':        geo['lat'],
            'lon':        geo['lon'],
            'djia_value': geo['djia'],
            'hash_value': geo['hash'],
        },
    )

    city_info = CITIES.get(city_slug, {})
    data = MeetPointSerializer(mp).data
    data['city_name']   = city_info.get('name', city_slug)
    data['city_center'] = city_info.get('center', [mp.lat, mp.lon])
    return Response(data)


@api_view(['GET'])
def list_cities(request):
    cities = [
        {'slug': slug, 'name': info['name'], 'center': info['center']}
        for slug, info in CITIES.items()
    ]
    return Response(cities)


@api_view(['POST'])
def toggle_attendance(request):
    session_id   = request.data.get('session_id')
    meetpoint_id = request.data.get('meetpoint_id')

    if not session_id or not meetpoint_id:
        return Response({'error': 'session_id and meetpoint_id required'}, status=400)

    try:
        mp = MeetPoint.objects.get(id=meetpoint_id)
    except MeetPoint.DoesNotExist:
        return Response({'error': 'MeetPoint not found'}, status=404)

    existing = Attendance.objects.filter(session_id=session_id, meetpoint=mp).first()
    if existing:
        existing.delete()
        going = False
    else:
        Attendance.objects.create(session_id=session_id, meetpoint=mp, status='going')
        going = True

    count = mp.attendances.filter(status='going').count()
    return Response({'going': going, 'count': count, 'meetpoint_id': meetpoint_id})


@api_view(['GET'])
def get_attendance_count(request):
    meetpoint_id = request.query_params.get('meetpoint_id')
    session_id   = request.query_params.get('session_id', '')

    if not meetpoint_id:
        return Response({'error': 'meetpoint_id required'}, status=400)

    try:
        mp = MeetPoint.objects.get(id=meetpoint_id)
    except MeetPoint.DoesNotExist:
        return Response({'error': 'MeetPoint not found'}, status=404)

    count = mp.attendances.filter(status='going').count()
    going = (
        mp.attendances.filter(session_id=session_id, status='going').exists()
        if session_id else False
    )
    return Response({'count': count, 'going': going})


# ─────────────────────────────────────────────────────────────
# Community Chat
# ─────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
def chat_messages(request):
    city_slug = request.query_params.get('city', 'bangalore')

    if city_slug not in CITIES:
        return Response({'error': f"Unknown city: {city_slug}"}, status=400)

    if request.method == 'GET':
        after_id   = request.query_params.get('after_id')
        session_id = request.query_params.get('session_id', '')

        qs = ChatMessage.objects.filter(city_slug=city_slug)
        if after_id:
            qs = qs.filter(id__gt=after_id)

        # Latest 60, return in chronological order
        messages = list(qs.order_by('-created_at')[:60])
        messages.reverse()

        serializer = ChatMessageSerializer(
            messages, many=True, context={'session_id': session_id}
        )

        # Online count: unique sessions with a message in last 5 minutes
        cutoff = timezone.now() - timedelta(minutes=5)
        online = (
            ChatMessage.objects
            .filter(city_slug=city_slug, created_at__gte=cutoff)
            .values('session_id').distinct().count()
        )

        return Response({'messages': serializer.data, 'online': online})

    # POST — send a message
    session_id = request.data.get('session_id')
    anon_name  = request.data.get('anon_name', 'DevAnon')
    message    = (request.data.get('message') or '').strip()

    if not session_id:
        return Response({'error': 'session_id required'}, status=400)
    if not message:
        return Response({'error': 'message cannot be empty'}, status=400)
    if len(message) > 500:
        return Response({'error': 'Message too long (max 500 chars)'}, status=400)

    msg = ChatMessage.objects.create(
        city_slug=city_slug,
        session_id=session_id,
        anon_name=anon_name,
        message=message,
    )
    serializer = ChatMessageSerializer(msg, context={'session_id': session_id})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def toggle_reaction(request, message_id):
    session_id = request.data.get('session_id')
    emoji      = request.data.get('emoji')

    if not session_id or not emoji:
        return Response({'error': 'session_id and emoji required'}, status=400)
    if emoji not in ALLOWED_EMOJIS:
        return Response({'error': f"Emoji not allowed. Use: {ALLOWED_EMOJIS}"}, status=400)

    try:
        msg = ChatMessage.objects.get(id=message_id)
    except ChatMessage.DoesNotExist:
        return Response({'error': 'Message not found'}, status=404)

    existing = MessageReaction.objects.filter(
        message=msg, session_id=session_id, emoji=emoji
    ).first()

    if existing:
        existing.delete()
        reacted = False
    else:
        MessageReaction.objects.create(message=msg, session_id=session_id, emoji=emoji)
        reacted = True

    counts = dict(
        msg.reactions.values('emoji')
        .annotate(c=Count('id'))
        .values_list('emoji', 'c')
    )
    return Response({'reacted': reacted, 'emoji': emoji, 'reaction_counts': counts})
