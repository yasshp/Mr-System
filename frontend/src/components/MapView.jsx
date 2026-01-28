import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapView({ tasks }) {
  if (!tasks?.length || !tasks[0]?.latitude) {
    return (
      <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
        No location data available for this day
      </div>
    );
  }

  const positions = tasks
    .filter(t => t.latitude && t.longitude)
    .map(t => [parseFloat(t.latitude), parseFloat(t.longitude)]);

  const center = positions[0] || [23.0225, 72.5714]; // Default Ahmedabad

  return (
    <div className="h-96 rounded-lg overflow-hidden border dark:border-gray-700">
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {tasks.map(task => {
          if (!task.latitude || !task.longitude) return null;
          return (
            <Marker 
              key={task.activity_id}
              position={[parseFloat(task.latitude), parseFloat(task.longitude)]}
            >
              <Popup>
                <strong>{task.customer_name}</strong><br />
                {task.start_time} – {task.end_time}<br />
                {task.locality}
              </Popup>
            </Marker>
          );
        })}

        {positions.length > 1 && (
          <Polyline 
            positions={positions} 
            color="#4f46e5" 
            weight={4} 
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
}