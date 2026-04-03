import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import {
  MapPin, Star, CheckCircle, Clock, ArrowLeft, LayoutList, Map as MapIcon,
  SlidersHorizontal, Users, Briefcase, Zap
} from 'lucide-react';
import { NearbyMap, type MapPin as Pin } from '../components/NearbyMap';
import { LocationPicker } from '../components/LocationPicker';
import { useAuth } from '../context/AuthContext';
import { mockTechnicians, mockWorkPosts } from '../data/mockData';
import { SPECIALTIES } from '../types';

// ─── Replace with your real key ──────────────────────────────────────────────
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

// ─── Mock coordinates for professionals ──────────────────────────────────────
const TECH_COORDS: Record<string, { lat: number; lng: number }> = {
  'tech-1': { lat: 6.8731, lng: 79.8874 },  // Nugegoda, Colombo
  'tech-2': { lat: 7.2906, lng: 80.6337 },  // Kandy City, Kandy
  'tech-3': { lat: 6.9102, lng: 79.8560 },  // Colombo 07
  'tech-4': { lat: 6.0535, lng: 80.2210 },  // Galle Fort, Galle
  'tech-5': { lat: 7.2083, lng: 79.8358 },  // Negombo Town
  'tech-6': { lat: 7.2733, lng: 80.5984 },  // Peradeniya, Kandy
};

// ─── Mock coordinates for work posts ─────────────────────────────────────────
const POST_COORDS: Record<string, { lat: number; lng: number }> = {
  'post-1': { lat: 6.8936, lng: 79.9070 },  // Kotte, Colombo
  'post-2': { lat: 7.2953, lng: 80.6352 },  // Kandy City
  'post-3': { lat: 6.9147, lng: 79.8497 },  // Colombo 03
  'post-4': { lat: 6.9007, lng: 79.8558 },  // Colombo 07
  'post-5': { lat: 6.0430, lng: 80.2150 },  // Galle Town
};

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatBudget(min: number, max: number): string {
  const fmt = (n: number) =>
    n >= 1000000
      ? `Rs. ${(n / 1000000).toFixed(1)}Mn`
      : `Rs. ${(n / 1000).toFixed(0)}K`;
  return `${fmt(min)} – ${fmt(max)}`;
}

const RADII = [10, 25, 50, 100, 500];
const AVAILABILITY_COLORS = {
  Available: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  Limited: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
  Busy: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
};

// ─── Component ────────────────────────────────────────────────────────────────
export function NearbyMapPage() {
  const { currentUser } = useAuth();
  const isTechnician = currentUser?.role === 'technician';

  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [googleLoadError, setGoogleLoadError] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [userAddress, setUserAddress] = useState('');
  const [radius, setRadius] = useState(500); // km — show all by default
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('map');

  // ── Load Google Maps API ──────────────────────────────────────────────────
  useEffect(() => {
    // Skip loading if API key is still the placeholder
    if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
      setGoogleLoadError(true);
      return;
    }

    setOptions({ apiKey: GOOGLE_MAPS_API_KEY, version: 'weekly' });

    Promise.all([
      importLibrary('maps'),
      importLibrary('places'),
      importLibrary('geocoding'),
    ])
      .then(() => setIsGoogleLoaded(true))
      .catch(() => {
        setGoogleLoadError(true);
        setIsGoogleLoaded(false);
      });
  }, []);

  // ── Build pins ────────────────────────────────────────────────────────────
  const pins = useMemo<(Pin & { distanceKm: number })[]>(() => {
    if (isTechnician) {
      // Technicians see nearby projects/posts
      return mockWorkPosts
        .filter(p => {
          if (!POST_COORDS[p.id]) return false;
          if (specialtyFilter && p.category !== specialtyFilter) return false;
          return true;
        })
        .map(p => {
          const coords = POST_COORDS[p.id];
          const distanceKm =
            userLat !== null && userLng !== null
              ? haversine(userLat, userLng, coords.lat, coords.lng)
              : 0;
          return {
            id: p.id,
            lat: coords.lat,
            lng: coords.lng,
            title: p.title,
            subtitle: `${p.category} · ${p.location}`,
            type: 'project' as const,
            specialty: p.category,
            budgetRange: formatBudget(p.budgetMin, p.budgetMax),
            link: `/posts/${p.id}`,
            distanceKm,
            distance: distanceKm,
          };
        })
        .filter(p => userLat === null || p.distanceKm <= radius)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    } else {
      // Clients / guests see nearby professionals
      return mockTechnicians
        .filter(t => {
          if (!TECH_COORDS[t.id]) return false;
          if (specialtyFilter && t.specialty !== specialtyFilter) return false;
          return true;
        })
        .map(t => {
          const coords = TECH_COORDS[t.id];
          const distanceKm =
            userLat !== null && userLng !== null
              ? haversine(userLat, userLng, coords.lat, coords.lng)
              : 0;
          return {
            id: t.id,
            lat: coords.lat,
            lng: coords.lng,
            title: t.name,
            subtitle: `${t.specialty} · ${t.city}`,
            type: 'professional' as const,
            specialty: t.specialty,
            rating: t.rating,
            avatar: t.avatar,
            availability: t.availability,
            link: `/technician/${t.id}`,
            distanceKm,
            distance: distanceKm,
          };
        })
        .filter(p => userLat === null || p.distanceKm <= radius)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }
  }, [isTechnician, userLat, userLng, radius, specialtyFilter]);

  const handleLocation = (lat: number, lng: number, address: string) => {
    setUserLat(lat);
    setUserLng(lng);
    setUserAddress(address);
    setSelectedPinId(null);
  };

  const handlePinClick = (pin: Pin) => {
    setSelectedPinId(pin.id);
    setMobileView('map');
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <div className="bg-maroon flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link
              to="/search"
              className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm"
              style={{ fontWeight: 500 }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Search
            </Link>
            <span className="text-white/30">·</span>
            <div className="flex items-center gap-2">
              {isTechnician ? (
                <Briefcase className="w-4 h-4 text-gold" />
              ) : (
                <Users className="w-4 h-4 text-gold" />
              )}
              <h1 className="text-white" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {isTechnician ? 'Projects Near You' : 'Professionals Near You'}
              </h1>
            </div>
          </div>

          {/* Location Picker + Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 max-w-xl">
              <LocationPicker
                isGoogleLoaded={isGoogleLoaded}
                onLocationChange={handleLocation}
                initialAddress={userAddress}
              />
            </div>

            {/* Radius */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-white/70 text-sm flex-shrink-0">Within</span>
              <select
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                {RADII.map(r => (
                  <option key={r} value={r} className="text-gray-900 bg-white">
                    {r >= 500 ? 'All Sri Lanka' : `${r} km`}
                  </option>
                ))}
              </select>
            </div>

            {/* Specialty filter */}
            <div className="flex-shrink-0">
              <select
                value={specialtyFilter}
                onChange={e => setSpecialtyFilter(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                <option value="" className="text-gray-900 bg-white">
                  {isTechnician ? 'All Categories' : 'All Specialties'}
                </option>
                {SPECIALTIES.map(s => (
                  <option key={s} value={s} className="text-gray-900 bg-white">{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Tab Toggle ─────────────────────────────────────────────── */}
      <div className="md:hidden flex border-b border-border bg-card flex-shrink-0">
        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
            mobileView === 'list'
              ? 'text-maroon border-b-2 border-maroon'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          style={{ fontWeight: 500 }}
        >
          <LayoutList className="w-4 h-4" />
          List ({pins.length})
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
            mobileView === 'map'
              ? 'text-maroon border-b-2 border-maroon'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          style={{ fontWeight: 500 }}
        >
          <MapIcon className="w-4 h-4" />
          Map
        </button>
      </div>

      {/* ── Main Split Layout ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside
          className={`
            w-full md:w-80 lg:w-96 flex-shrink-0 bg-background border-r border-border
            flex flex-col overflow-hidden
            ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}
          `}
        >
          {/* Sidebar header */}
          <div className="px-4 py-3 border-b border-border bg-card flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isTechnician
                  ? <Zap className="w-4 h-4 text-gold" />
                  : <Users className="w-4 h-4 text-maroon" />}
                <span className="text-foreground text-sm" style={{ fontWeight: 600 }}>
                  {pins.length} {isTechnician ? 'project' : 'professional'}{pins.length !== 1 ? 's' : ''} found
                </span>
              </div>
              {userAddress && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-maroon" />
                  Sorted by distance
                </span>
              )}
            </div>
            {!userAddress && (
              <p className="text-xs text-muted-foreground mt-1">
                Share your location for distance-sorted results
              </p>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {pins.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <SlidersHorizontal className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm" style={{ fontWeight: 500 }}>
                  No results in this area
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Try expanding the radius or clearing filters
                </p>
              </div>
            ) : isTechnician ? (
              // ── Project cards for technicians ──
              pins.map(pin => {
                const post = mockWorkPosts.find(p => p.id === pin.id);
                if (!post) return null;
                return (
                  <Link
                    key={pin.id}
                    to={pin.link}
                    onClick={() => setSelectedPinId(pin.id)}
                    className={`block p-4 hover:bg-muted transition-colors ${
                      selectedPinId === pin.id ? 'bg-maroon-light border-l-3 border-maroon' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Briefcase className="w-4 h-4 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm truncate" style={{ fontWeight: 600 }}>
                          {post.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-xs bg-gold/10 text-gold-dark px-2 py-0.5 rounded-full">
                            {post.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatBudget(post.budgetMin, post.budgetMax)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-maroon" />
                            {post.location}
                          </span>
                          {pin.distanceKm > 0 && (
                            <span className="text-maroon" style={{ fontWeight: 500 }}>
                              · {pin.distanceKm < 1
                                  ? `${Math.round(pin.distanceKm * 1000)}m`
                                  : `${pin.distanceKm.toFixed(0)}km`} away
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              // ── Professional cards for clients ──
              pins.map(pin => {
                const tech = mockTechnicians.find(t => t.id === pin.id);
                if (!tech) return null;
                return (
                  <Link
                    key={pin.id}
                    to={pin.link}
                    onClick={() => setSelectedPinId(pin.id)}
                    className={`block p-4 hover:bg-muted transition-colors ${
                      selectedPinId === pin.id ? 'bg-maroon-light border-l-3 border-maroon' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={tech.avatar}
                          alt={tech.name}
                          className="w-11 h-11 rounded-xl object-cover"
                          onError={e => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tech.name)}&background=8B1A2F&color=fff`;
                          }}
                        />
                        {tech.isVerified && (
                          <CheckCircle className="absolute -bottom-1 -right-1 w-4 h-4 text-green-500 bg-background rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-foreground text-sm truncate" style={{ fontWeight: 600 }}>
                            {tech.name}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${AVAILABILITY_COLORS[tech.availability]}`}
                            style={{ fontWeight: 500 }}
                          >
                            {tech.availability}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{tech.specialty}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-gold text-gold" />
                            <span style={{ fontWeight: 600 }}>{tech.rating}</span>
                            <span>({tech.reviewCount})</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-maroon" />
                            {tech.city}
                          </span>
                          {pin.distanceKm > 0 && (
                            <span className="text-maroon" style={{ fontWeight: 500 }}>
                              {pin.distanceKm < 1
                                ? `${Math.round(pin.distanceKm * 1000)}m`
                                : `${pin.distanceKm.toFixed(0)}km`} away
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Sidebar footer – quick link */}
          {pins.length > 0 && (
            <div className="p-3 border-t border-border bg-card flex-shrink-0">
              <Link
                to={isTechnician ? '/posts' : '/search'}
                className="flex items-center justify-center gap-2 w-full bg-maroon-light text-maroon hover:bg-maroon hover:text-white py-2.5 rounded-lg text-sm transition-colors"
                style={{ fontWeight: 500 }}
              >
                {isTechnician ? (
                  <><Briefcase className="w-4 h-4" /> View All Projects</>
                ) : (
                  <><Users className="w-4 h-4" /> View All Professionals</>
                )}
              </Link>
            </div>
          )}
        </aside>

        {/* ── Map area ──────────────────────────────────────────────────────── */}
        <div
          className={`
            flex-1 p-3 bg-muted
            ${mobileView === 'map' ? 'flex' : 'hidden md:flex'}
          `}
        >
          <NearbyMap
            pins={pins}
            userLat={userLat}
            userLng={userLng}
            isGoogleLoaded={isGoogleLoaded}
            googleLoadError={googleLoadError}
            selectedPinId={selectedPinId}
            onPinClick={handlePinClick}
          />
        </div>
      </div>
    </div>
  );
}