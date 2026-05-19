import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix Leaflet default icon paths broken by Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom violet pulsing icon
const meetIcon = L.divIcon({
  className: '',
  html: `
    <div class="meet-marker">
      <div class="meet-marker-ring"></div>
      <div class="meet-marker-ring meet-marker-ring--2"></div>
      <div class="meet-marker-core">📍</div>
    </div>
  `,
  iconSize:   [60, 60],
  iconAnchor: [30, 30],
  popupAnchor: [0, -32],
});

/** Auto-pans map whenever lat/lon changes */
function FlyTo({ lat, lon }) {
  const map = useMap();
  const prevRef = useRef(null);
  useEffect(() => {
    const key = `${lat},${lon}`;
    if (key !== prevRef.current) {
      map.flyTo([lat, lon], 15, { duration: 1.5 });
      prevRef.current = key;
    }
  }, [lat, lon, map]);
  return null;
}

export default function MapView({ meetpoint, count }) {
  if (!meetpoint) return <div className="map-placeholder skeleton" />;
  const { lat, lon, city_name } = meetpoint;

  return (
    <div className="map-wrapper animate-fade-in">
      <MapContainer
        center={[lat, lon]}
        zoom={14}
        className="leaflet-map"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />
        <FlyTo lat={lat} lon={lon} />

        {/* Radius circle — ~200m */}
        <Circle
          center={[lat, lon]}
          radius={200}
          pathOptions={{
            color: '#7c3aed',
            fillColor: '#7c3aed',
            fillOpacity: 0.12,
            weight: 2,
            dashArray: '6 4',
          }}
        />

        <Marker position={[lat, lon]} icon={meetIcon}>
          <Popup className="meet-popup">
            <strong>Today's MeetPoint</strong><br />
            <span style={{ fontSize: 13, opacity: 0.8 }}>{city_name}</span><br />
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#9f67ff' }}>
              {lat.toFixed(5)}, {lon.toFixed(5)}
            </span><br />
            <span style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
              🧑‍💻 {count} dev{count !== 1 ? 's' : ''} heading here
            </span>
          </Popup>
        </Marker>
      </MapContainer>

      <div className="map-overlay-badge glass">
        <span className="mob-icon">🧑‍💻</span>
        <span><strong>{count}</strong> {count === 1 ? 'dev' : 'devs'} nearby</span>
      </div>
    </div>
  );
}
