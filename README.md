# MeetSpace — Quick Start Guide

## Frontend (works immediately — no Python needed)

```bash
cd frontend
npm run dev
# Open http://localhost:5173
```

## Backend (requires Python 3.10+)

**Install Python first**: https://www.python.org/downloads/

Then:
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
# API at http://localhost:8000/api/
```

The frontend gracefully falls back to client-side geohash computation
when the backend is offline — so you can demo the full UI without Python.

## Project Structure

```
MeetSpace/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── meetspace/         # Django project config
│   │   ├── settings.py
│   │   └── urls.py
│   └── core/              # Main app
│       ├── geohash.py     # xkcd algorithm
│       ├── models.py      # MeetPoint + Attendance
│       ├── views.py       # REST API views
│       └── urls.py        # API routes
└── frontend/
    ├── src/
    │   ├── components/    # CitySelector, LiveCounter, MeetCard, MapView
    │   ├── pages/         # Home.jsx
    │   ├── hooks/         # useMeetPoint.js
    │   └── utils/         # geohash.js (client-side fallback)
    └── index.html
```

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/meetpoint/?city=<slug>` | Today's MeetPoint |
| GET | `/api/cities/` | All supported cities |
| POST | `/api/attendance/` | Toggle opt-in (anonymous) |
| GET | `/api/attendance/count/?meetpoint_id=<id>&session_id=<uuid>` | Live count |
