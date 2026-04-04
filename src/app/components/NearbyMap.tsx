import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin as MapPinIcon, ExternalLink } from 'lucide-react';

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
  selectedPinId?: string | null;
  onPinClick?: (pin: MapPin) => void;
}

const REGION = import.meta.env.VITE_AWS_REGION;
const MAP_NAME = import.meta.env.VITE_AWS_MAP_NAME;
const API_KEY = import.meta.env.VITE_AWS_API_KEY;

function getPinColor(pin: MapPin, isSelected: boolean) {
  if (pin.type === 'professional') {
    return isSelected ? '#6E1425' : '#8B1A2F';
  }
  return isSelected ? '#B8933C' : '#C9A84C';
}

function createMarkerElement(pin: MapPin, isSelected: boolean) {
  const el = document.createElement('div');
  const color = getPinColor(pin, isSelected);
  const label =
    pin.specialty?.[0]?.toUpperCase() ?? (pin.type === 'professional' ? 'P' : 'J');

  el.style.width = isSelected ? '42px' : '34px';
  el.style.height = isSelected ? '42px' : '34px';
  el.style.borderRadius = '9999px';
  el.style.background = color;
  el.style.color = 'white';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.fontWeight = '700';
  el.style.fontSize = isSelected ? '14px' : '12px';
  el.style.border = '2px solid white';
  el.style.boxShadow = '0 3px 10px rgba(0,0,0,0.25)';
  el.style.cursor = 'pointer';
  el.textContent = label;

  return el;
}

function getPopupHtml(pin: MapPin) {
  const availabilityColor =
    pin.availability === 'Available'
      ? '#16a34a'
      : pin.availability === 'Limited'
      ? '#d97706'
      : '#dc2626';

  const distanceText =
    pin.distance === undefined
      ? ''
      : pin.distance < 1
      ? `${Math.round(pin.distance * 1000)}m away`
      : `${pin.distance.toFixed(1)} km away`;

  return `
    <div style="font-family: system-ui, Arial, sans-serif; min-width: 200px; max-width: 260px;">
      <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px;">
        ${
          pin.avatar
            ? `<img src="${pin.avatar}" style="width:42px;height:42px;border-radius:12px;object-fit:cover;" onerror="this.style.display='none'" />`
            : `<div style="width:42px;height:42px;border-radius:12px;background:#8B1A2F;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">${pin.title.charAt(0)}</div>`
        }
        <div style="min-width:0;">
          <div style="font-weight:700;font-size:13px; color:#111827; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${pin.title}</div>
          <div style="font-size:11px; color:#6B7280;">${pin.subtitle}</div>
        </div>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
        ${
          pin.rating
            ? `<span style="font-size:11px; padding:2px 8px; border-radius:999px; background:#fdf8ec; color:#B8933C; font-weight:700;">★ ${pin.rating.toFixed(1)}</span>`
            : ''
        }
        ${
          pin.availability
            ? `<span style="font-size:11px; padding:2px 8px; border-radius:999px; background:${availabilityColor}18; color:${availabilityColor}; font-weight:600;">${pin.availability}</span>`
            : ''
        }
        ${
          pin.budgetRange
            ? `<span style="font-size:11px; padding:2px 8px; border-radius:999px; background:#f3f4f6; color:#374151;">${pin.budgetRange}</span>`
            : ''
        }
      </div>

      ${
        distanceText
          ? `<div style="font-size:11px; color:#8B1A2F; font-weight:600; margin-bottom:10px;">${distanceText}</div>`
          : ''
      }

      <a href="${pin.link}" style="display:block; text-align:center; text-decoration:none; background:#8B1A2F; color:white; padding:8px 12px; border-radius:10px; font-size:12px; font-weight:700;">
        ${pin.type === 'professional' ? 'View Profile →' : 'View Project →'}
      </a>
    </div>
  `;
}

export function NearbyMap({
  pins,
  userLat,
  userLng,
  selectedPinId,
  onPinClick,
}: NearbyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const pinMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!REGION || !MAP_NAME || !API_KEY) {
      console.error('Missing AWS Location environment variables for NearbyMap');
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://maps.geo.${REGION}.amazonaws.com/maps/v0/maps/${MAP_NAME}/style-descriptor?key=${API_KEY}`,
      center:
        userLat !== null && userLng !== null ? [userLng, userLat] : [80.7718, 7.8731],
      zoom: userLat !== null && userLng !== null ? 11 : 7,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      map.resize();
    });

    return () => {
      pinMarkersRef.current.forEach((marker) => marker.remove());
      pinMarkersRef.current.clear();
      userMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const resizeMap = () => {
      mapRef.current?.resize();
    };

    const timeout = window.setTimeout(resizeMap, 100);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [pins, selectedPinId, userLat, userLng]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (userLat === null || userLng === null) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    const userEl = document.createElement('div');
    userEl.style.width = '22px';
    userEl.style.height = '22px';
    userEl.style.borderRadius = '9999px';
    userEl.style.background = '#4285F4';
    userEl.style.border = '4px solid white';
    userEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLng, userLat]);
    } else {
      userMarkerRef.current = new maplibregl.Marker({ element: userEl })
        .setLngLat([userLng, userLat])
        .setPopup(
          new maplibregl.Popup({ offset: 16 }).setHTML(
            '<div style="font-weight:600;">Your Location</div>'
          )
        )
        .addTo(mapRef.current);
    }

    mapRef.current.flyTo({
      center: [userLng, userLat],
      zoom: 11,
      essential: true,
    });
  }, [userLat, userLng]);

  useEffect(() => {
    if (!mapRef.current) return;

    pinMarkersRef.current.forEach((marker) => marker.remove());
    pinMarkersRef.current.clear();

    pins.forEach((pin) => {
      const isSelected = pin.id === selectedPinId;
      const el = createMarkerElement(pin, isSelected);

      const popup = new maplibregl.Popup({ offset: 18 }).setHTML(getPopupHtml(pin));

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([pin.lng, pin.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      el.addEventListener('click', () => {
        onPinClick?.(pin);
      });

      pinMarkersRef.current.set(pin.id, marker);
    });
  }, [pins, selectedPinId, onPinClick]);

  useEffect(() => {
    if (!mapRef.current || !selectedPinId) return;

    const selectedPin = pins.find((pin) => pin.id === selectedPinId);
    const selectedMarker = pinMarkersRef.current.get(selectedPinId);

    if (!selectedPin || !selectedMarker) return;

    mapRef.current.flyTo({
      center: [selectedPin.lng, selectedPin.lat],
      zoom: 13,
      essential: true,
    });

    selectedMarker.togglePopup();
  }, [selectedPinId, pins]);

  if (!REGION || !MAP_NAME || !API_KEY) {
    return (
      <div className="w-full h-full min-h-[420px] bg-muted/30 border border-border rounded-xl flex flex-col items-center justify-center text-center p-6">
        <MapPinIcon className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-foreground" style={{ fontWeight: 600 }}>
          AWS map is not configured
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          Check VITE_AWS_REGION, VITE_AWS_MAP_NAME, and VITE_AWS_API_KEY.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[420px] relative bg-background">
      <div ref={mapContainerRef} className="w-full h-full" />

      <div className="absolute top-4 left-4 z-10 bg-card/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <MapPinIcon className="w-4 h-4 text-maroon" />
          <span style={{ fontWeight: 600 }}>{pins.length}</span>
          <span className="text-muted-foreground">
            result{pins.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 bg-card/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-sm text-xs text-muted-foreground flex items-center gap-2">
        <ExternalLink className="w-3.5 h-3.5" />
        AWS Nearby Map
      </div>
    </div>
  );
}