"""
xkcd Geohash Algorithm (https://xkcd.com/426/)
Uses MD5(date + "-" + djia_open) to produce a daily unique coordinate
within a 1°×1° graticule for each city.
"""
import hashlib

CITIES = {
    'mumbai':        {'name': 'Mumbai',        'lat': 19, 'lon': 72,   'center': [19.076,  72.877]},
    'bangalore':     {'name': 'Bengaluru',     'lat': 12, 'lon': 77,   'center': [12.971,  77.594]},
    'delhi':         {'name': 'New Delhi',     'lat': 28, 'lon': 77,   'center': [28.613,  77.209]},
    'hyderabad':     {'name': 'Hyderabad',     'lat': 17, 'lon': 78,   'center': [17.385,  78.486]},
    'pune':          {'name': 'Pune',          'lat': 18, 'lon': 73,   'center': [18.520,  73.856]},
    'chennai':       {'name': 'Chennai',       'lat': 13, 'lon': 80,   'center': [13.082,  80.270]},
    'san-francisco': {'name': 'San Francisco', 'lat': 37, 'lon': -122, 'center': [37.774, -122.419]},
    'london':        {'name': 'London',        'lat': 51, 'lon': 0,    'center': [51.507,  -0.127]},
    'new-york':      {'name': 'New York',      'lat': 40, 'lon': -74,  'center': [40.712,  -74.006]},
}


def get_mock_djia(date_str: str) -> float:
    """Deterministic pseudo-DJIA value for a given date (30000–40000 range)."""
    h = hashlib.md5(f"djia-seed-{date_str}".encode()).hexdigest()
    val = int(h[:8], 16) / 0xFFFFFFFF
    return round(30000 + val * 10000, 2)


def compute_geohash(date_str: str, city_slug: str) -> dict:
    """
    Compute daily MeetPoint for a city.

    Steps:
      1. Get mock DJIA for the date.
      2. hash_input = "{date}-{djia}"
      3. md5_hex = MD5(hash_input)  → 32 hex chars
      4. lat_frac = first 16 hex chars → float in [0,1)
         lon_frac = last  16 hex chars → float in [0,1)
      5. meet_lat = graticule_lat + lat_frac
         meet_lon = graticule_lon + lon_frac
    """
    city = CITIES.get(city_slug)
    if not city:
        raise ValueError(f"Unknown city slug: '{city_slug}'")

    djia = get_mock_djia(date_str)
    hash_input = f"{date_str}-{djia}"
    md5_hex = hashlib.md5(hash_input.encode()).hexdigest()

    lat_frac = int(md5_hex[:16], 16) / (16 ** 16)
    lon_frac = int(md5_hex[16:], 16) / (16 ** 16)

    meet_lat = city['lat'] + lat_frac
    meet_lon = city['lon'] + lon_frac

    return {
        'lat':       round(meet_lat, 6),
        'lon':       round(meet_lon, 6),
        'djia':      djia,
        'hash':      md5_hex,
        'city':      city,
        'city_slug': city_slug,
        'date':      date_str,
    }
