import React, { useState, useEffect } from 'react';
import Map from './Map';

// Import data files directly (Astro will bundle them)
import pollerias from '../data/pollerias_huancayo.json';
import restaurantes from '../data/restaurantes_huancayo.json';
import ferreterias from '../data/ferreterias_huancayo.json';
import farmacias from '../data/farmacias_huancayo.json';
import clinicas from '../data/clinicas_huancayo.json';
import talleres from '../data/talleres_huancayo.json';
import hoteles from '../data/hoteles_huancayo.json';
import colegios from '../data/colegios_privados_huancayo.json';
import barberias from '../data/barberias_huancayo.json';
import ropa from '../data/ropa_huancayo.json';

const SECTORS = {
    'Pollerías': pollerias,
    'Restaurantes': restaurantes,
    'Ferreterías': ferreterias,
    'Farmacias': farmacias,
    'Clínicas': clinicas,
    'Talleres': talleres,
    'Hoteles': hoteles,
    'Colegios': colegios,
    'Barberías': barberias,
    'Ropa': ropa
};

export default function Layout() {
    const [activeSector, setActiveSector] = useState('Pollerías');
    const [selectedPlaceId, setSelectedPlaceId] = useState(null);
    const [places, setPlaces] = useState([...pollerias.businesses].sort((a, b) => b.score - a.score));

    useEffect(() => {
        // When sector changes, update places list and reset selection
        if (SECTORS[activeSector]) {
            // Sort by score descending (Businesses without website have higher score)
            const sortedPlaces = [...SECTORS[activeSector].businesses].sort((a, b) => b.score - a.score);
            setPlaces(sortedPlaces);
            setSelectedPlaceId(null);
        }
    }, [activeSector]);

    const selectedPlace = places.find(p => p.name === selectedPlaceId);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white">
            {/* Sidebar */}
            <div className="w-96 flex-shrink-0 flex flex-col border-r shadow-lg z-10 bg-white">
                <div className="p-4 border-b bg-blue-600 text-white">
                    <h1 className="text-xl font-bold mb-2">Explorador de Huancayo</h1>

                    <select
                        value={activeSector}
                        onChange={(e) => setActiveSector(e.target.value)}
                        className="w-full p-2 text-black rounded text-sm font-medium"
                    >
                        {Object.keys(SECTORS).map(sector => (
                            <option key={sector} value={sector}>{sector}</option>
                        ))}
                    </select>

                    <div className="flex justify-between items-center mt-2 text-xs opacity-90">
                        <span>{places.length} resultados</span>
                        <span>{SECTORS[activeSector]?.stats?.without_website} sin web</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {places.map((place, idx) => (
                        <div
                            key={idx}
                            onClick={() => setSelectedPlaceId(place.name)}
                            className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedPlaceId === place.name ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-gray-800 leading-tight">{place.name}</h3>
                                {place.priority === 'high' && <span className="text-[10px] bg-red-100 text-red-800 px-1 rounded border border-red-200">Alta</span>}
                            </div>

                            <div className="flex items-center text-sm text-gray-600 mt-1 space-x-2">
                                <span className="text-yellow-500 font-bold">{place.rating || '-'} ★</span>
                                <span className="text-xs">({place.reviews || 0})</span>
                                {!place.has_website && <span className="text-[10px] bg-green-100 text-green-800 px-1 rounded ml-auto">Sin Web (+40)</span>}
                            </div>

                            <p className="text-xs text-gray-500 mt-1 truncate">{place.address}</p>
                            {place.opening_hours && place.opening_hours !== 'N/A' && (
                                <p className="text-xs text-green-600 mt-1">
                                    {Array.isArray(place.opening_hours) ? 'Abierto hoy' : place.opening_hours}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                <Map
                    places={places}
                    selectedPlaceId={selectedPlaceId}
                    onSelectPlace={setSelectedPlaceId}
                />

                {/* Floating details card for selected place (Mobile optimization / quick view) */}
                {selectedPlace && (
                    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white p-4 rounded-lg shadow-xl z-[1000] border border-gray-200">
                        <button
                            onClick={() => setSelectedPlaceId(null)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                        <h2 className="font-bold text-lg">{selectedPlace.name}</h2>
                        <p className="text-sm text-gray-600 mb-2">{selectedPlace.address}</p>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-gray-50 p-2 rounded">
                                <span className="block text-xs text-gray-500">Teléfono</span>
                                {selectedPlace.phone}
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                                <span className="block text-xs text-gray-500">Rating</span>
                                {selectedPlace.rating} ★
                            </div>
                        </div>

                        <a
                            href={selectedPlace.maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 block w-full bg-blue-600 text-white text-center py-2 rounded font-medium hover:bg-blue-700 transition"
                        >
                            Ver en Google Maps
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
