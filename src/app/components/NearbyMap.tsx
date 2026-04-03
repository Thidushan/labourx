import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin as MapPinIcon, ExternalLink } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  type: 'professional' | 'project';
  specialty?: string;
  rating?: number;
  avatar?: string;
  link: string;
  availability?: 'Available' | 'Busy' | 'Limited';
  budgetRange?: string;
  distance?: number;
}

interface NearbyMapProps {
  pins: MapPin[];
  userLat: number | null;
  userLng: number | null;
  isGoogleLoaded: boolean;
  googleLoadError: boolean;
  selectedPinId?: string | null;
  onPinClick?: (pin: MapPin) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const IS_PLACEHOLDER_KEY =
  typeof window !== 'undefined' &&
  (window as any).__GMAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY';

function pinSvg(color: string, label: string, size: number): string {
  const hw = size / 2;
  const dropH = Math.round(size * 1.25);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${dropH}" viewBox="0 0 ${size} ${dropH}">
    <defs>
      <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-opacity="0.35"/>
      </filter>
    </defs>
    <g filter="url(#sh)">
      <path d="M${hw} 2
        C ${hw * 0.44} 2, 2 ${hw * 0.56}, 2 ${hw}
        C 2 ${hw * 1.55}, ${hw} ${dropH - 3}, ${hw} ${dropH - 3}
        S ${size - 2} ${hw * 1.55}, ${size - 2} ${hw}
        C ${size - 2} ${hw * 0.56}, ${hw * 1.56} 2, ${hw} 2Z"
        fill="${color}"/>
      <circle cx="${hw}" cy="${hw}" r="${hw * 0.55}" fill="rgba(255,255,255,0.22)"/>
      <text x="${hw}" y="${hw * 1.35}" text-anchor="middle"
        font-family="system-ui,Arial,sans-serif" font-size="${size * 0.34}"
        font-weight="700" fill="white">${label}</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function userDotSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
    <circle cx="11" cy="11" r="9" fill="#4285F4" stroke="white" stroke-width="3"/>
    <circle cx="11" cy="11" r="3.5" fill="white"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function infoHtml(pin: MapPin): string {
  const availColor =
    pin.availability === 'Available' ? '#16a34a' :
    pin.availability === 'Limited'   ? '#d97706' : '#dc2626';
  const dist =
    pin.distance === undefined ? '' :
    pin.distance < 1
      ? `📍 ${Math.round(pin.distance * 1000)}m away`
      : `📍 ${pin.distance.toFixed(1)} km away`;

  return `<div style="font-family:system-ui,Arial,sans-serif;padding:12px 14px;min-width:190px;max-width:240px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
      ${pin.avatar
        ? `<img src="${pin.avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #8B1A2F;flex-shrink:0;" onerror="this.style.display='none'">`
        : `<div style="width:40px;height:40px;border-radius:50%;background:#8B1A2F;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:16px;flex-shrink:0;">${pin.title[0]}</div>`}
      <div style="min-width:0;">
        <p style="margin:0 0 2px;font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pin.title}</p>
        <p style="margin:0;color:#555;font-size:11px;">${pin.subtitle}</p>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin-bottom:10px;">
      ${pin.rating ? `<span style="background:#fdf8ec;color:#B8933C;font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px;border:1px solid #C9A84C40;">★ ${pin.rating}</span>` : ''}
      ${pin.availability ? `<span style="color:${availColor};font-size:11px;font-weight:600;background:${availColor}18;padding:2px 7px;border-radius:99px;">${pin.availability}</span>` : ''}
      ${pin.budgetRange ? `<span style="color:#444;font-size:11px;background:#f3f3f5;padding:2px 7px;border-radius:99px;">${pin.budgetRange}</span>` : ''}
      ${dist ? `<span style="color:#888;font-size:11px;">${dist}</span>` : ''}
    </div>
    <a href="${pin.link}" style="display:block;background:#8B1A2F;color:white;text-align:center;padding:7px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:600;">
      ${pin.type === 'professional' ? 'View Profile →' : 'View Project →'}
    </a>
  </div>`;
}

// ─── Fake map pins overlay (shown in fallback state) ─────────────────────────
const FAKE_POSITIONS = [
  { top: '28%', left: '38%' }, { top: '55%', left: '62%' },
  { top: '40%', left: '20%' }, { top: '68%', left: '46%' },
  { top: '22%', left: '70%' }, { top: '50%', left: '80%' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export function NearbyMap({
  pins,
  userLat,
  userLng,
  isGoogleLoaded,
  googleLoadError,
  selectedPinId,
  onPinClick,
}: NearbyMapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWinRef = useRef<google.maps.InfoWindow | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isGoogleLoaded || !mapDivRef.current || mapRef.current) return;
    const center = {
      lat: userLat ?? 19.076,
      lng: userLng ?? 72.8777,
    };
    mapRef.current = new google.maps.Map(mapDivRef.current, {
      center,
      zoom: userLat ? 11 : 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    });
    infoWinRef.current = new google.maps.InfoWindow({ maxWidth: 260 });
    setMapReady(true);
  }, [isGoogleLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── User location marker ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || userLat === null || userLng === null) return;
    const pos = { lat: userLat, lng: userLng };
    const userIcon: google.maps.Icon = {
      url: userDotSvg(),
      scaledSize: new google.maps.Size(22, 22),
      anchor: new google.maps.Point(11, 11),
    };
    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(pos);
    } else {
      userMarkerRef.current = new google.maps.Marker({
        position: pos,
        map: mapRef.current,
        title: 'Your Location',
        icon: userIcon,
        zIndex: 999,
      });
    }
    mapRef.current.panTo(pos);
  }, [mapReady, userLat, userLng]);

  // ── Pins / markers ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const currentIds = new Set(markersRef.current.keys());
    const incomingIds = new Set(pins.map(p => p.id));

    // Remove stale
    currentIds.forEach(id => {
      if (!incomingIds.has(id)) {
        markersRef.current.get(id)?.setMap(null);
        markersRef.current.delete(id);
      }
    });

    // Add / update
    pins.forEach(pin => {
      const isSelected = pin.id === selectedPinId;
      const color = pin.type === 'professional'
        ? (isSelected ? '#6E1425' : '#8B1A2F')
        : (isSelected ? '#B8933C' : '#C9A84C');
      const label = pin.specialty?.[0]?.toUpperCase() ?? (pin.type === 'professional' ? 'P' : 'J');
      const size = isSelected ? 42 : 34;
      const icon: google.maps.Icon = {
        url: pinSvg(color, label, size),
        scaledSize: new google.maps.Size(size, Math.round(size * 1.25)),
        anchor: new google.maps.Point(size / 2, Math.round(size * 1.25)),
      };

      if (markersRef.current.has(pin.id)) {
        const m = markersRef.current.get(pin.id)!;
        m.setIcon(icon);
        m.setZIndex(isSelected ? 100 : 1);
      } else {
        const marker = new google.maps.Marker({
          position: { lat: pin.lat, lng: pin.lng },
          map,
          title: pin.title,
          icon,
          zIndex: isSelected ? 100 : 1,
        });
        marker.addListener('click', () => {
          infoWinRef.current?.setContent(infoHtml(pin));
          infoWinRef.current?.open(map, marker);
          onPinClick?.(pin);
        });
        markersRef.current.set(pin.id, marker);
      }
    });
  }, [mapReady, pins, selectedPinId, onPinClick]);

  // ── Pan to selected pin ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedPinId) return;
    const pin = pins.find(p => p.id === selectedPinId);
    if (!pin) return;
    mapRef.current.panTo({ lat: pin.lat, lng: pin.lng });
    const marker = markersRef.current.get(selectedPinId);
    if (marker && infoWinRef.current) {
      infoWinRef.current.setContent(infoHtml(pin));
      infoWinRef.current.open(mapRef.current, marker);
    }
  }, [selectedPinId, mapReady, pins]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current.clear();
      userMarkerRef.current?.setMap(null);
    };
  }, []);

  // ─── Fallback: API key is placeholder or load errored ─────────────────────
  if (googleLoadError) {
    return (
      <div className="w-full h-full min-h-[420px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-border flex flex-col items-center justify-center relative overflow-hidden">
        {/* Grid bg */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.4) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Fake roads */}
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
          <line x1="15%" y1="0" x2="35%" y2="100%" stroke="#555" strokeWidth="3" />
          <line x1="0" y1="38%" x2="100%" y2="32%" stroke="#555" strokeWidth="3" />
          <line x1="58%" y1="0" x2="48%" y2="100%" stroke="#666" strokeWidth="2" />
          <line x1="0" y1="68%" x2="100%" y2="72%" stroke="#666" strokeWidth="2" />
          <rect x="22%" y="22%" width="20%" height="13%" rx="5" fill="#aaa" opacity="0.3" />
          <rect x="55%" y="46%" width="16%" height="11%" rx="5" fill="#aaa" opacity="0.3" />
        </svg>

        {/* Fake pins */}
        {pins.slice(0, 6).map((pin, i) => {
          const pos = FAKE_POSITIONS[i];
          if (!pos) return null;
          const bg = pin.type === 'professional' ? '#8B1A2F' : '#C9A84C';
          return (
            <button
              key={pin.id}
              onClick={() => onPinClick?.(pin)}
              className="absolute z-10 flex flex-col items-center group"
              style={{ top: pos.top, left: pos.left, transform: 'translate(-50%,-100%)' }}
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold"
                style={{ background: bg }}
              >
                {pin.specialty?.[0] ?? 'P'}
              </div>
              <div
                className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent"
                style={{ borderTopColor: bg, borderTopWidth: '6px', borderLeftWidth: '4px', borderRightWidth: '4px' }}
              />
              <div className="absolute bottom-[110%] bg-card border border-border text-foreground text-xs px-2 py-1 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {pin.title}
              </div>
            </button>
          );
        })}

        {/* Info card */}
        <div className="relative z-20 bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-6 max-w-sm mx-6 text-center shadow-xl">
          <div className="w-14 h-14 bg-maroon/10 border-2 border-maroon/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <MapPinIcon className="w-7 h-7 text-maroon" />
          </div>
          <h3 className="text-foreground mb-1" style={{ fontWeight: 700, fontSize: '1rem' }}>
            Google Maps Integration Ready
          </h3>
          <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
            Add your Google Maps API key in{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-maroon">
              NearbyMapPage.tsx
            </code>{' '}
            to enable the live interactive map.
          </p>
          <a
            href="https://developers.google.com/maps/documentation/javascript/get-api-key"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-maroon hover:bg-maroon-dark text-white px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ fontWeight: 500 }}
          >
            Get API Key <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[420px] relative rounded-xl overflow-hidden border border-border shadow-sm">
      {!mapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10">
          <Loader2 className="w-8 h-8 text-maroon animate-spin mb-3" />
          <p className="text-muted-foreground text-sm">Loading map…</p>
        </div>
      )}
      <div ref={mapDivRef} className="w-full h-full" />
    </div>
  );
}
