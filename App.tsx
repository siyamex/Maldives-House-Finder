import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { House } from './types';
import { houses as allHouses } from './data/houseData';
import { HomeIcon, MapPinIcon, SearchIcon, BuildingIcon, CrosshairIcon, DistanceIcon } from './components/icons';

// Add a declaration for the Leaflet global object `L` from the CDN script
declare var L: any;

const CloseIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Helper function to calculate distance between two coordinates
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Child Component: MapPreview
const MapPreview: React.FC<{ house: House }> = ({ house }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: [house.latitude, house.longitude],
        zoom: 15,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        attributionControl: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
      L.marker([house.latitude, house.longitude]).addTo(mapInstance.current);
    }
     return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [house.latitude, house.longitude]);

  return <div ref={mapRef} className="h-40 w-full" aria-label={`Map preview showing location of ${house.houseName}`}></div>;
};

// Child Component: HouseCard
const HouseCard: React.FC<{ house: House & { distance?: number }; onViewMap: (house: House) => void }> = ({ house, onViewMap }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out flex flex-col">
    <MapPreview house={house} />
    <div className="p-6 flex-grow">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <HomeIcon className="h-10 w-10 text-cyan-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 tracking-wide">{house.houseName}</h3>
          <p className="text-gray-600 font-medium">{house.address}</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-cyan-100 flex flex-col space-y-2">
        <div className="flex items-center text-sm text-gray-500">
          <MapPinIcon className="h-5 w-5 mr-2 text-teal-500" />
          <span>Atoll: <span className="font-semibold text-gray-700">{house.atoll}</span></span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <BuildingIcon className="h-5 w-5 mr-2 text-teal-500" />
          <span>Island: <span className="font-semibold text-gray-700">{house.island}</span></span>
        </div>
        {house.distance !== undefined && (
          <div className="flex items-center text-sm text-gray-500">
            <DistanceIcon className="h-5 w-5 mr-2 text-teal-500" />
            <span>Distance: <span className="font-semibold text-gray-700">{house.distance.toFixed(2)} km</span></span>
          </div>
        )}
      </div>
    </div>
    <div className="px-6 pb-6 pt-0 mt-auto">
      <button
        onClick={() => onViewMap(house)}
        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-md shadow-md flex items-center justify-center space-x-2 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        aria-label={`View ${house.houseName} on map`}
      >
        <MapPinIcon className="h-5 w-5" />
        <span>View on Map</span>
      </button>
    </div>
  </div>
);


// Child Component: SearchForm
interface SearchFormProps {
  atolls: string[];
  islands: string[];
  selectedAtoll: string;
  selectedIsland: string;
  searchName: string;
  onAtollChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onIslandChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGetCurrentLocation: () => void;
  locationStatus: 'idle' | 'loading' | 'error' | 'success';
}

const SearchForm: React.FC<SearchFormProps> = ({
  atolls,
  islands,
  selectedAtoll,
  selectedIsland,
  searchName,
  onAtollChange,
  onIslandChange,
  onNameChange,
  onSubmit,
  onGetCurrentLocation,
  locationStatus
}) => (
  <form onSubmit={onSubmit} className="bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-6xl mx-auto space-y-4 md:space-y-0 md:grid md:grid-cols-5 md:gap-4 md:items-end">
    <div className="col-span-4 md:col-span-1">
      <label htmlFor="atoll" className="block text-sm font-medium text-gray-700 mb-1">Atoll</label>
      <select id="atoll" value={selectedAtoll} onChange={onAtollChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition">
        <option value="">Select Atoll</option>
        {atolls.map(atoll => <option key={atoll} value={atoll}>{atoll}</option>)}
      </select>
    </div>
    <div className="col-span-4 md:col-span-1">
      <label htmlFor="island" className="block text-sm font-medium text-gray-700 mb-1">Island</label>
      <select id="island" value={selectedIsland} onChange={onIslandChange} disabled={!selectedAtoll} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed">
        <option value="">Select Island</option>
        {islands.map(island => <option key={island} value={island}>{island}</option>)}
      </select>
    </div>
    <div className="col-span-4 md:col-span-1">
      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">House Name</label>
      <input type="text" id="name" value={searchName} onChange={onNameChange} placeholder="e.g. Sunbeam" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />
    </div>
    <div className="col-span-4 md:col-span-1">
       <label className="block text-sm font-medium text-gray-700 mb-1 opacity-0 hidden md:block">Location</label>
      <button
        type="button"
        onClick={onGetCurrentLocation}
        disabled={locationStatus === 'loading'}
        className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-md shadow-sm flex items-center justify-center space-x-2 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
      >
        <CrosshairIcon className={`h-5 w-5 ${locationStatus === 'success' ? 'text-green-500' : ''}`} />
        <span>{
          locationStatus === 'loading' ? 'Finding...' :
          locationStatus === 'success' ? 'Located' :
          locationStatus === 'error' ? 'Retry' :
          'My Location'
        }</span>
      </button>
    </div>
    <div className="col-span-4 md:col-span-1">
       <label className="block text-sm font-medium text-gray-700 mb-1 opacity-0 hidden md:block">Search</label>
      <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md shadow-md flex items-center justify-center space-x-2 transition-transform transform hover:scale-105">
        <SearchIcon className="h-5 w-5" />
        <span>Search</span>
      </button>
    </div>
  </form>
);

// Child Component: MapModal
const MapModal: React.FC<{
    house: House;
    onClose: () => void;
    userLocation: { lat: number; lng: number } | null;
}> = ({ house, onClose, userLocation }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const featureGroupRef = useRef<any>(null);

    // Effect for initializing and destroying the map
    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            const map = L.map(mapRef.current);
            mapInstance.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            const fg = L.featureGroup().addTo(map);
            featureGroupRef.current = fg;
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Effect for updating map content when props change
    useEffect(() => {
        const map = mapInstance.current;
        const featureGroup = featureGroupRef.current;
        if (!map || !featureGroup) return;

        featureGroup.clearLayers();

        const houseLatLng: [number, number] = [house.latitude, house.longitude];
        const houseMarker = L.marker(houseLatLng).bindPopup(`<b>${house.houseName}</b>`);
        featureGroup.addLayer(houseMarker);

        if (userLocation) {
            const userLatLng: [number, number] = [userLocation.lat, userLocation.lng];
            const userIcon = L.divIcon({
                html: `<div class="w-3 h-3 bg-blue-500 rounded-full shadow-lg border-2 border-white"></div>`,
                className: '', iconSize: [12, 12], iconAnchor: [6, 6]
            });
            const userMarker = L.marker(userLatLng, { icon: userIcon }).bindPopup('Your Location');
            const path = L.polyline([userLatLng, houseLatLng], { color: '#0ea5e9', dashArray: '5, 10' });
            
            featureGroup.addLayer(userMarker);
            featureGroup.addLayer(path);
            
            map.fitBounds(featureGroup.getBounds().pad(0.2));
            houseMarker.openPopup();
        } else {
            map.setView(houseLatLng, 16);
            houseMarker.openPopup();
        }
    }, [house, userLocation]);

    // Effect for handling the Escape key to close the modal
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-modal-title"
        >
            <div 
                className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[85vh] p-4 relative flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 id="map-modal-title" className="text-2xl font-bold text-gray-800 mb-4 flex-shrink-0">{house.houseName}</h3>
                <div ref={mapRef} className="flex-grow w-full h-full rounded-md" aria-label={`Interactive map showing ${house.houseName}`}></div>
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                    aria-label="Close map"
                >
                    <CloseIcon className="h-6 w-6 text-gray-700" />
                </button>
            </div>
        </div>
    );
};


function App() {
  const [filteredHouses, setFilteredHouses] = useState<House[]>([]);
  const [selectedAtoll, setSelectedAtoll] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('');
  const [searchName, setSearchName] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [mapHouse, setMapHouse] = useState<House | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');

  const atolls = useMemo(() => {
    const atollSet = new Set(allHouses.map(house => house.atoll));
    return Array.from(atollSet).sort();
  }, []);

  const islands = useMemo(() => {
    if (!selectedAtoll) return [];
    const islandSet = new Set(allHouses.filter(house => house.atoll === selectedAtoll).map(house => house.island));
    return Array.from(islandSet).sort();
  }, [selectedAtoll]);

  const displayedHouses = useMemo(() => {
    if (!userLocation) {
      return filteredHouses;
    }
    return filteredHouses
        .map(house => ({
            ...house,
            distance: getDistance(userLocation.lat, userLocation.lng, house.latitude, house.longitude),
        }))
        .sort((a, b) => a.distance - b.distance);
  }, [filteredHouses, userLocation]);

  const handleAtollChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAtoll(e.target.value);
    setSelectedIsland(''); // Reset island when atoll changes
  };

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    let results = allHouses;
    if (selectedAtoll) {
      results = results.filter(h => h.atoll === selectedAtoll);
    }
    if (selectedIsland) {
      results = results.filter(h => h.island === selectedIsland);
    }
    if (searchName.trim()) {
      results = results.filter(h => h.houseName.toLowerCase().includes(searchName.trim().toLowerCase()));
    }
    setFilteredHouses(results.slice(0, 10));
    setHasSearched(true);
  }, [selectedAtoll, selectedIsland, searchName]);
  
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
        setLocationStatus('error');
        return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            setLocationStatus('success');
        },
        () => {
            setLocationStatus('error');
        },
        { enableHighAccuracy: true }
    );
  };

  const renderResults = () => {
    if (!hasSearched) {
      return (
        <div className="text-center text-gray-500 mt-16 animate-pulse">
          <p>Please select your criteria and search to find a house.</p>
        </div>
      );
    }
    if (displayedHouses.length === 0) {
      return (
        <div className="text-center text-gray-500 mt-16">
          <h3 className="text-2xl font-semibold text-gray-700">No Results Found</h3>
          <p className="mt-2">Try adjusting your search criteria.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
        {displayedHouses.map((house, index) => (
          <HouseCard key={`${house.houseName}-${index}`} house={house} onViewMap={setMapHouse} />
        ))}
      </div>
    );
  };

  return (
    <>
      {mapHouse && <MapModal 
        house={mapHouse} 
        onClose={() => setMapHouse(null)} 
        userLocation={userLocation}
      />}
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-200 font-sans text-gray-800">
        <main className="container mx-auto px-4 py-8 md:py-12">
          <header className="text-center mb-8 md:mb-12">
            <div className="inline-block bg-white p-4 rounded-full shadow-lg mb-4">
                <MapPinIcon className="h-12 w-12 text-cyan-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800">
              Maldives House Finder
            </h1>
            <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
              Easily locate any registered house in the Maldives. Select an atoll, island, and search by name.
            </p>
          </header>

          <SearchForm
            atolls={atolls}
            islands={islands}
            selectedAtoll={selectedAtoll}
            selectedIsland={selectedIsland}
            searchName={searchName}
            onAtollChange={handleAtollChange}
            onIslandChange={(e) => setSelectedIsland(e.target.value)}
            onNameChange={(e) => setSearchName(e.target.value)}
            onSubmit={handleSearch}
            onGetCurrentLocation={handleGetCurrentLocation}
            locationStatus={locationStatus}
          />

          <section className="mt-12">
            {renderResults()}
          </section>
        </main>
        <footer className="text-center py-6 text-gray-500 text-sm">
          <p>Maldives House Finder © 2024</p>
        </footer>
      </div>
    </>
  );
}

export default App;
