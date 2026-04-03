import { useEffect, useRef, useState } from 'react';
import { MapPin, Crosshair, Loader2, Search, X } from 'lucide-react';

interface LocationPickerProps {
  isGoogleLoaded: boolean;
  onLocationChange: (lat: number, lng: number, address: string) => void;
  initialAddress?: string;
  compact?: boolean;
}

export function LocationPicker({
  isGoogleLoaded,
  onLocationChange,
  initialAddress = '',
  compact = false,
}: LocationPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [address, setAddress] = useState(initialAddress);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Init Places Autocomplete once Google is loaded
  useEffect(() => {
    if (!isGoogleLoaded || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode'],
      componentRestrictions: { country: 'in' },
      fields: ['geometry', 'formatted_address'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current!.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const addr = place.formatted_address ?? inputRef.current?.value ?? '';
        setAddress(addr);
        onLocationChange(lat, lng, addr);
      }
    });
  }, [isGoogleLoaded, onLocationChange]);

  const handleGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;

        if (isGoogleLoaded) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            setGpsLoading(false);
            const addr =
              status === 'OK' && results?.[0]
                ? results[0].formatted_address
                : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setAddress(addr);
            onLocationChange(lat, lng, addr);
          });
        } else {
          setGpsLoading(false);
          const addr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setAddress(addr);
          onLocationChange(lat, lng, addr);
        }
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
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <div className={`flex items-center gap-2 ${compact ? '' : 'flex-col sm:flex-row'}`}>
        {/* Address input */}
        <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800 border border-border rounded-xl px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-maroon/30 transition-all">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder={isGoogleLoaded ? 'Search your city or area…' : 'Enter your city or area…'}
            className="flex-1 bg-transparent outline-none text-foreground text-sm placeholder:text-muted-foreground"
          />
          {address && (
            <button onClick={clearAddress} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* GPS button */}
        <button
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

      {/* GPS error */}
      {gpsError && (
        <div className="flex items-center gap-1.5 mt-2 text-destructive text-xs">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {gpsError}
        </div>
      )}

      {/* Location confirmed */}
      {address && !gpsError && (
        <div className="flex items-center gap-1.5 mt-2 text-muted-foreground text-xs">
          <MapPin className="w-3.5 h-3.5 text-maroon flex-shrink-0" />
          <span className="truncate">{address}</span>
        </div>
      )}
    </div>
  );
}
