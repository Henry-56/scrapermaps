import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to update map center when selected place changes
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 16);
        }
    }, [center, map]);
    return null;
}

export default function Map({ places, selectedPlaceId, onSelectPlace }) {
    const defaultCenter = [-12.0651, -75.2049]; // Huancayo Center
    const center = selectedPlaceId
        ? [places.find(p => p.name === selectedPlaceId)?.location.lat, places.find(p => p.name === selectedPlaceId)?.location.lng]
        : defaultCenter;

    return (
        <MapContainer center={defaultCenter} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl={false}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {places.map((place, idx) => (
                <Marker
                    key={idx}
                    position={[place.location.lat, place.location.lng]}
                    eventHandlers={{
                        click: () => onSelectPlace(place.name),
                    }}
                >
                    <Popup>
                        <div className="text-sm">
                            <h3 className="font-bold">{place.name}</h3>
                            <p>{place.address}</p>
                            <p className="text-yellow-600">★ {place.rating} ({place.reviews})</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
            <MapUpdater center={selectedPlaceId ? center : null} />
        </MapContainer>
    );
}
