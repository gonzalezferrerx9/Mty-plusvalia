import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  useMapsLibrary,
  useMap,
  AdvancedMarker,
  Pin
} from '@vis.gl/react-google-maps';

const MONTERREY_CENTER = { lat: 25.6866, lng: -100.3161 };
const INITIAL_ZOOM = 12;
const MONTERREY_BOUNDS = { north: 25.85, south: 25.50, west: -100.60, east: -100.05 };
const MapEvents = () => {
    const map = useMap();
    
    useEffect(() => {
        if (!map) return;

        const handleShowAnalysis = (event: CustomEvent) => {
             const item = event.detail;
             if (item && item.ubicacion_coordenadas) {
                 const { lat, lng } = item.ubicacion_coordenadas;
                 map.panTo({ lat, lng });
                 map.setZoom(16);
             }
        };

        window.addEventListener('SHOW_ANALYSIS_ON_MAP' as any, handleShowAnalysis);
        return () => {
            window.removeEventListener('SHOW_ANALYSIS_ON_MAP' as any, handleShowAnalysis);
        };
    }, [map]);

    return null;
}

interface MapContentProps {
    onMapClick: (lat: number, lng: number, address: string) => void;
    mapType: string;
    interactionsDisabled?: boolean; 
}

const MapContent = ({ onMapClick, mapType, interactionsDisabled = false }: MapContentProps) => {
  const geocodingLib = useMapsLibrary('geocoding');
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  
  useEffect(() => {
    if (geocodingLib) setGeocoder(new geocodingLib.Geocoder());

    const handleShowAnalysis = (event: CustomEvent) => {
        const item = event.detail;
        if (item && item.ubicacion_coordenadas) {
            setSelectedLocation(item.ubicacion_coordenadas);
        }
    };
    window.addEventListener('SHOW_ANALYSIS_ON_MAP' as any, handleShowAnalysis);
    return () => window.removeEventListener('SHOW_ANALYSIS_ON_MAP' as any, handleShowAnalysis);

  }, [geocodingLib]);

  const handleClick = async (ev: any) => {
    if (interactionsDisabled) return; 

    if (!ev.detail.latLng) return;
    const lat = ev.detail.latLng.lat;
    const lng = ev.detail.latLng.lng;
    
    setSelectedLocation({ lat, lng });

    let address = "Ubicación seleccionada";
    
    if (geocoder) {
      try {
        const res = await geocoder.geocode({ location: { lat, lng } });
        if (res.results[0]) address = res.results[0].formatted_address;
      } catch (e) { console.warn("Geocoding failed", e); }
    }

    onMapClick(lat, lng, address);
  };

  return (
    <Map
      defaultCenter={MONTERREY_CENTER}
      defaultZoom={INITIAL_ZOOM}
      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"}
      style={{ width: '100%', height: '100%' }}
      gestureHandling={interactionsDisabled ? 'none' : 'greedy'}
      disableDefaultUI={true} 
      mapTypeId={mapType} 
      onClick={handleClick}
      minZoom={11} 
      maxZoom={19}
      restriction={{ latLngBounds: MONTERREY_BOUNDS, strictBounds: true }}
    >
        <MapEvents />
        {selectedLocation && (
            <AdvancedMarker position={selectedLocation}>
                <Pin background={'#EF4444'} glyphColor={'#FFF'} borderColor={'#991B1B'} />
            </AdvancedMarker>
        )}
    </Map>
  );
};

const MapComponent = ({ onLocationSelect, mapType = 'roadmap', interactionsDisabled = false }: { onLocationSelect: (lat: number, lng: number, address: string) => void, mapType?: string, interactionsDisabled?: boolean }) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  if (!apiKey) return <div className="p-4 bg-red-50 text-red-500 rounded">Falta API Key</div>;

  return (
    <APIProvider apiKey={apiKey} libraries={['geocoding', 'marker']}>
      <MapContent onMapClick={onLocationSelect} mapType={mapType} interactionsDisabled={interactionsDisabled} />
    </APIProvider>
  );
};

export default MapComponent;
