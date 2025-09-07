import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { House } from './types';
import { houses as allHouses } from './data/houseData';
import { HomeIcon, MapPinIcon, SearchIcon, BuildingIcon } from './components/icons';

// Add a declaration for the Leaflet global object `L` from the CDN script
declare var L: any;

const CloseIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

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
  }, [house.latitude, house.longitude]);

  return <div ref={mapRef} className="h-40 w-full" aria-label={`Map preview showing location of ${house.houseName}`}></div>;
};

// Child Component: HouseCard
const HouseCard: React.FC<{ house: House; onViewMap: (house: House) => void }> = ({ house, onViewMap }) => (
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
  onSubmit
}) => (
  <form onSubmit={onSubmit} className="bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-4xl mx-auto space-y-4 md:space-y-0 md:grid md:grid-cols-4 md:gap-4 md:items-end">
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
      <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md shadow-md flex items-center justify-center space-x-2 transition-transform transform hover:scale-105">
        <SearchIcon className="h-5 w-5" />
        <span>Search</span>
      </button>
    </div>
  </form>
);

// Child Component: MapModal
const MapModal: React.FC<{ house: House; onClose: () => void }> = ({ house, onClose }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);

    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            mapInstance.current = L.map(mapRef.current).setView([house.latitude, house.longitude], 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance.current);
            L.marker([house.latitude, house.longitude])
                .addTo(mapInstance.current)
                .bindPopup(`<b>${house.houseName}</b>`)
                .openPopup();
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('keydown', handleEscape);
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [house, onClose]);

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

  const atolls = useMemo(() => {
    const atollSet = new Set(allHouses.map(house => house.atoll));
    return Array.from(atollSet).sort();
  }, []);

  const islands = useMemo(() => {
    if (!selectedAtoll) return [];
    const islandSet = new Set(allHouses.filter(house => house.atoll === selectedAtoll).map(house => house.island));
    return Array.from(islandSet).sort();
  }, [selectedAtoll]);

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
    setFilteredHouses(results);
    setHasSearched(true);
  }, [selectedAtoll, selectedIsland, searchName]);

  const renderResults = () => {
    if (!hasSearched) {
      return (
        <div className="text-center text-gray-500 mt-16 animate-pulse">
          <p>Please select your criteria and search to find a house.</p>
        </div>
      );
    }
    if (filteredHouses.length === 0) {
      return (
        <div className="text-center text-gray-500 mt-16">
          <h3 className="text-2xl font-semibold text-gray-700">No Results Found</h3>
          <p className="mt-2">Try adjusting your search criteria.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
        {filteredHouses.map((house, index) => (
          <HouseCard key={`${house.houseName}-${index}`} house={house} onViewMap={setMapHouse} />
        ))}
      </div>
    );
  };

  return (
    <>
      {mapHouse && <MapModal house={mapHouse} onClose={() => setMapHouse(null)} />}
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