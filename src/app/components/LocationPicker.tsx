import { useEffect, useRef, useState } from 'react';
import { MapPin, Crosshair, Loader2, Search, X } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { withAPIKey } from '@aws/amazon-location-utilities-auth-helper';
import {
  LocationClient,
  SearchPlaceIndexForTextCommand,
} from '@aws-sdk/client-location';

interface LocationPickerProps {
  isGoogleLoaded?: boolean; // kept only to avoid breaking existing usage
  onLocationChange: (lat: number, lng: number, address: string) => void;
  initialAddress?: string;
  compact?: boolean;
}

type SearchResult = {
  label: string;
  lat: number;
  lng: number;
};

const REGION = import.meta.env.VITE_AWS_REGION;
const MAP_NAME = import.meta.env.VITE_AWS_MAP_NAME;
const API_KEY = import.meta.env.VITE_AWS_API_KEY;
const PLACE_INDEX = import.meta.env.VITE_AWS_PLACE_INDEX;

export function LocationPicker({
  isGoogleLoaded: _isGoogleLoaded,
  onLocationChange,
  initialAddress = '',
  compact = false,
}: LocationPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [address, setAddress] = useState(initialAddress);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!REGION || !MAP_NAME || !API_KEY) {
      console.error('Missing AWS Location environment variables.');
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://maps.geo.${REGION}.amazonaws.com/maps/v0/maps/${MAP_NAME}/style-descriptor?key=${API_KEY}`,
      center: [80.7718, 7.8731], // Sri Lanka
      zoom: 7,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const placeMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 14,
    });

    markerRef.current?.remove();
    markerRef.current = new maplibregl.Marker()
      .setLngLat([lng, lat])
      .addTo(mapRef.current);
  };

  const searchPlaces = async (text: string) => {
    if (!text.trim() || text.trim().length < 3) {
      setResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      setGpsError('');

      const authHelper = await withAPIKey(API_KEY);

      const client = new LocationClient({
        region: REGION,
        ...authHelper.getLocationClientConfig(),
      });

      const command = new SearchPlaceIndexForTextCommand({
        IndexName: PLACE_INDEX,
        Text: text.trim(),
        MaxResults: 5,
      });

      const response = await client.send(command);

      const mapped: SearchResult[] =
        response.Results?.map((item) => ({
          label: item.Place?.Label || 'Unknown place',
          lng: item.Place?.Geometry?.Point?.[0] ?? 0,
          lat: item.Place?.Geometry?.Point?.[1] ?? 0,
        })).filter((item) => item.lat !== 0 && item.lng !== 0) || [];

      setResults(mapped);
    } catch (error) {
      console.error('Place search error:', error);
      setGpsError('Location search failed. Check AWS setup.');
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchClick = async () => {
    await searchPlaces(address);
  };

  const handleSelectPlace = (place: SearchResult) => {
    setAddress(place.label);
    setResults([]);
    setGpsError('');
    placeMarker(place.lat, place.lng);
    onLocationChange(place.lat, place.lng, place.label);
  };

  const handleGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError('');
    setResults([]);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const addr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        setGpsLoading(false);
        setAddress(addr);
        placeMarker(lat, lng);
        onLocationChange(lat, lng, addr);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(
          err.code === 1
            ? 'Location permission denied. Please allow access.'
            : 'Unable to determine your location.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const clearAddress = () => {
    setAddress('');
    setResults([]);
    setGpsError('');
    if (inputRef.current) inputRef.current.value = '';
    markerRef.current?.remove();
  };

  return (
    <div className="w-full">
      <div className={`flex items-center gap-2 ${compact ? '' : 'flex-col sm:flex-row'}`}>
        <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800 border border-border rounded-xl px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-maroon/30 transition-all">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchClick();
              }
            }}
            placeholder="Search your city or area…"
            className="flex-1 bg-transparent outline-none text-foreground text-sm placeholder:text-muted-foreground"
          />

          {searchLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}

          {address && (
            <button
              type="button"
              onClick={clearAddress}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSearchClick}
          disabled={searchLoading || !address.trim()}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-border hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60 text-foreground px-4 py-2.5 rounded-xl text-sm transition-colors flex-shrink-0 shadow-sm"
          style={{ fontWeight: 500 }}
          title="Search location"
        >
          {searchLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {!compact && <span>{searchLoading ? 'Searching…' : 'Search'}</span>}
        </button>

        <button
          type="button"
          onClick={handleGps}
          disabled={gpsLoading}
          className="flex items-center gap-2 bg-maroon hover:bg-maroon-dark disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm transition-colors flex-shrink-0 shadow-sm"
          style={{ fontWeight: 500 }}
          title="Use my current location"
        >
          {gpsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Crosshair className="w-4 h-4" />
          )}
          {!compact && <span>{gpsLoading ? 'Locating…' : 'Use My Location'}</span>}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-2 border border-border rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
          {results.map((place, index) => (
            <button
              key={`${place.label}-${index}`}
              type="button"
              onClick={() => handleSelectPlace(place)}
              className="w-full text-left px-3 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 border-b last:border-b-0 border-border transition-colors"
            >
              {place.label}
            </button>
          ))}
        </div>
      )}

      {gpsError && (
        <div className="flex items-center gap-1.5 mt-2 text-destructive text-xs">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {gpsError}
        </div>
      )}

      {address && !gpsError && (
        <div className="flex items-center gap-1.5 mt-2 text-muted-foreground text-xs">
          <MapPin className="w-3.5 h-3.5 text-maroon flex-shrink-0" />
          <span className="truncate">{address}</span>
        </div>
      )}

      <div
        ref={mapContainerRef}
        className="w-full mt-3 rounded-xl overflow-hidden border border-border"
        style={{ height: compact ? '260px' : '420px' }}
      />
    </div>
  );
}