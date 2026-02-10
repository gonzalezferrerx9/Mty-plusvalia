"use client";

import React, { useState, useEffect } from 'react';
import {
  Map,
  InfoWindow,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
async function searchOSM(query: string) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      const bbox = data[0].boundingbox; 
      return {
        viewport: {
          south: parseFloat(bbox[0]),
          north: parseFloat(bbox[1]),
          west: parseFloat(bbox[2]),
          east: parseFloat(bbox[3])
        },
        location: {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        }
      };
    }
    return null;
  } catch (e) {
    console.error("OSM error:", e);
    return null;
  }
}

// CONSTANTS
const MONTERREY_CENTER = { lat: 25.6866, lng: -100.3161 };
const INITIAL_ZOOM = 11;
const MONTERREY_BOUNDS = { 
  north: 26.00, 
  south: 25.35, 
  west: -100.80, 
  east: -99.90 
};
const MAP_STYLES: any[] = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] }
];

// COMPONENTE INTERNO: Lógica de Interfaz y Mapa
export default function MapInterface() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<any | null>(null);
  const [infoPosition, setInfoPosition] = useState<any | null>(null);
  
  const [businessIdea, setBusinessIdea] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  const placesLib = useMapsLibrary('places');
  const map = useMap();

  const handleSearchLocations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessIdea.trim()) return;

    setIsSearching(true);
    setRecommendations([]);
    setSelectedZone(null);
    setInfoPosition(null);
    
    if (map) {
        map.panTo(MONTERREY_CENTER);
        map.setZoom(INITIAL_ZOOM);
    }

    try {
      const res = await fetch('/api/recommend-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessIdea }),
      });
      const data = await res.json();
      
      if (!res.ok || data.error) throw new Error(data.error || "Error IA");
      
      if (data.locations) {
        setRecommendations(data.locations);
      }
    } catch (error: any) {
      alert(`⚠️ Error: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectZone = async (zone: any) => {
    if (!map) return;

    setSelectedZone(zone);
    setInfoPosition(null); 

    let foundLocation = false;

    // GOOGLE PLACES API 
    if (placesLib && placesLib.Place) {
        try {
            // @ts-ignore
            const { places } = await placesLib.Place.searchByText({
                textQuery: zone.search_query,
                fields: ['location', 'viewport'],
                maxResultCount: 1,
            });

            if (places && places.length > 0) {
                const place = places[0];
                if (place.viewport) map.fitBounds(place.viewport);
                else if (place.location) {
                    map.setCenter(place.location);
                    map.setZoom(14);
                }
                setInfoPosition(place.location);
                foundLocation = true;
            }
        } catch (e) {
            console.warn("Google Places falló, intentando OSM...", e);
        }
    }

    // FALLBACK 
    if (!foundLocation) {
        const osmData = await searchOSM(zone.search_query);
        if (osmData) {
            if (osmData.viewport) map.fitBounds(osmData.viewport);
            else {
                map.setCenter(osmData.location);
                map.setZoom(14);
            }
            setInfoPosition(osmData.location);
            foundLocation = true;
        }
    }

    if (!foundLocation) {
        alert(`No se pudo ubicar "${zone.name}" en el mapa.`);
    }
  };

  return (
    <div className="w-full h-full relative flex">
        {/* PANEL LATERAL */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-h-[90vh]">
            <div className="w-80 bg-white p-2 rounded-lg shadow-lg border border-gray-200">
                <form onSubmit={handleSearchLocations} className="flex gap-2 items-center">
                    <input
                        type="text"
                        className="flex-grow p-2 text-sm outline-none text-gray-700"
                        placeholder="Ej. Restaurante..."
                        value={businessIdea}
                        onChange={(e) => setBusinessIdea(e.target.value)}
                    />
                    <button type="submit" disabled={isSearching} className={`px-3 py-1.5 rounded text-white text-xs font-bold transition-colors ${isSearching ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {isSearching ? '...' : '🔍'}
                    </button>
                </form>
            </div>

            {recommendations.length > 0 && (
                <div className="w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col animate-in slide-in-from-left duration-300">
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Zonas Recomendadas</h3>
                    </div>
                    <div className="overflow-y-auto max-h-[60vh]">
                        {recommendations.map((zone, idx) => (
                            <div 
                                key={idx}
                                onClick={() => handleSelectZone(zone)}
                                className={`p-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-blue-50 ${
                                    selectedZone?.name === zone.name ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                }`}
                            >
                                <h4 className="font-bold text-gray-800 text-sm mb-1">{zone.name}</h4>
                                <p className="text-gray-500 text-xs line-clamp-2">{zone.reason}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedZone && (
                <div className="w-80 bg-white rounded-lg shadow-xl border border-blue-200 overflow-hidden animate-in fade-in zoom-in duration-300 mt-2">
                    <div className="bg-blue-600 px-4 py-2 flex justify-between items-center">
                        <h3 className="text-white font-bold text-sm truncate">{selectedZone.name}</h3>
                        <button onClick={() => {setSelectedZone(null); setInfoPosition(null);}} className="text-white hover:text-gray-200">✕</button>
                    </div>
                    <div className="p-4 space-y-3 max-h-[40vh] overflow-y-auto">
                        <div className="bg-blue-50 p-3 rounded-md">
                            <h5 className="text-xs font-bold text-blue-800 uppercase mb-1">📍 Estrategia</h5>
                            <p className="text-xs text-gray-700 leading-relaxed">{selectedZone.reason}</p>
                        </div>
                        {selectedZone.business_considerations && (
                            <div className="bg-purple-50 p-3 rounded-md">
                                <h5 className="text-xs font-bold text-purple-800 uppercase mb-1">💸 Inversión & Operación</h5>
                                <p className="text-xs text-gray-700 leading-relaxed">{selectedZone.business_considerations}</p>
                            </div>
                        )}
                        {selectedZone.rent_estimate && (
                            <div className="flex items-center gap-3 bg-green-50 p-3 rounded-md border border-green-100">
                                <span className="text-xl">💰</span>
                                <div>
                                    <h5 className="text-xs font-bold text-green-800 uppercase">Renta Promedio</h5>
                                    <p className="text-sm font-semibold text-gray-800">{selectedZone.rent_estimate}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* MAP */}
        <div className="flex-grow h-screen">
            <Map
                defaultCenter={MONTERREY_CENTER}
                defaultZoom={INITIAL_ZOOM}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"}
                style={{ width: '100%', height: '100%' }}
                gestureHandling={'greedy'}
                disableDefaultUI={false}
                // RESTRICTIONS
                minZoom={10}
                maxZoom={18}
                restriction={{
                    latLngBounds: MONTERREY_BOUNDS,
                    strictBounds: false
                }}
            >

                {infoPosition && (
                    <InfoWindow
                        position={infoPosition}
                        onCloseClick={() => setInfoPosition(null)}
                    >
                        <div className="p-1 font-bold text-gray-800 text-xs text-center">
                            {selectedZone?.name}
                        </div>
                    </InfoWindow>
                )}
            </Map>
        </div>
    </div>
  );
}
