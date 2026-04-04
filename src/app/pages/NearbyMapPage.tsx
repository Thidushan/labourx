import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import {
  MapPin,
  Star,
  CheckCircle,
  ArrowLeft,
  LayoutList,
  Map as MapIcon,
  SlidersHorizontal,
  Users,
  LocateFixed,
} from 'lucide-react';
import { NearbyMap, type MapPin as Pin } from '../components/NearbyMap';
import { SPECIALTIES } from '../types';
import { db } from '../../firebase/config';

type FirestoreTechnician = {
  id: string;
  name: string;
  specialty: string;
  city: string;
  avatar: string;
  rating: number;
  availability: 'Available' | 'Busy' | 'Limited';
  isVerified: boolean;
  lat: number;
  lng: number;
};

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

const RADII = [10, 25, 50, 100, 500];

const AVAILABILITY_COLORS = {
  Available: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  Limited: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
  Busy: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
};

export function NearbyMapPage() {
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [userAddress, setUserAddress] = useState('');
  const [radius, setRadius] = useState(500);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('map');
  const [gettingLocation, setGettingLocation] = useState(false);

  const [professionals, setProfessionals] = useState<FirestoreTechnician[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(true);

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        setLoadingProfessionals(true);

        const snapshot = await getDocs(collection(db, 'users'));

        const fetched: FirestoreTechnician[] = snapshot.docs
          .map((docSnap) => {
            const data: any = docSnap.data();

            const lat =
              typeof data.lat === 'number' ? data.lat : Number(data.lat);
            const lng =
              typeof data.lng === 'number' ? data.lng : Number(data.lng);

            return {
              id: docSnap.id,
              name: data.name || 'Professional',
              specialty: data.specialty || 'Professional',
              city: data.locationText || data.city || '',
              avatar: data.avatar || data.photoURL || '',
              rating: Number(data.rating || 0),
              availability: (data.availability || 'Available') as
                | 'Available'
                | 'Busy'
                | 'Limited',
              isVerified: Boolean(data.isVerified || false),
              lat,
              lng,
              role: String(data.role || '').trim().toLowerCase(),
            };
          })
          .filter(
            (item: any) =>
              item.role === 'technician' &&
              Number.isFinite(item.lat) &&
              Number.isFinite(item.lng)
          )
          .map(({ role, ...rest }: any) => rest);

        setProfessionals(fetched);
      } catch (error) {
        console.error('Error fetching nearby professionals:', error);
        setProfessionals([]);
      } finally {
        setLoadingProfessionals(false);
      }
    };

    fetchProfessionals();
  }, []);

  const pins = useMemo<(Pin & { distanceKm: number })[]>(() => {
    return professionals
      .filter((tech) => {
        if (specialtyFilter && tech.specialty !== specialtyFilter) return false;
        return true;
      })
      .map((tech) => {
        const distanceKm =
          userLat !== null && userLng !== null
            ? haversine(userLat, userLng, tech.lat, tech.lng)
            : 0;

        return {
          id: tech.id,
          lat: tech.lat,
          lng: tech.lng,
          title: tech.name,
          subtitle: `${tech.specialty} · ${tech.city}`,
          type: 'professional' as const,
          specialty: tech.specialty,
          rating: tech.rating,
          avatar: tech.avatar,
          availability: tech.availability,
          link: `/technician/${tech.id}`,
          distanceKm,
          distance: distanceKm,
        };
      })
      .filter((pin) => userLat === null || pin.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [professionals, userLat, userLng, radius, specialtyFilter]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported in this browser.');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setUserLat(lat);
        setUserLng(lng);
        setUserAddress(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
        setSelectedPinId(null);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please allow location access.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleClearLocation = () => {
    setUserLat(null);
    setUserLng(null);
    setUserAddress('');
    setSelectedPinId(null);
  };

  const handlePinClick = (pin: Pin) => {
    setSelectedPinId(pin.id);
    setMobileView('map');
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
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
              <Users className="w-4 h-4 text-gold" />
              <h1 className="text-white" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                Professionals Near You
              </h1>
            </div>
          </div>

          {/* Location + filters */}
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-end">
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={gettingLocation}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-maroon px-4 py-2.5 text-sm hover:bg-white/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ fontWeight: 600 }}
                >
                  <LocateFixed className="w-4 h-4" />
                  {gettingLocation ? 'Getting Location...' : 'Use My Location'}
                </button>

                {userAddress && (
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 text-white px-4 py-2.5 text-sm hover:bg-white/15 transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    Clear Location
                  </button>
                )}
              </div>

              <div className="mt-2 min-h-[20px]">
                {userAddress ? (
                  <p className="text-white/80 text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gold" />
                    {userAddress}
                  </p>
                ) : (
                  <p className="text-white/60 text-sm">
                    Allow your location to see professionals near you
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-white/70 text-sm flex-shrink-0">Within</span>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                {RADII.map((r) => (
                  <option key={r} value={r} className="text-gray-900 bg-white">
                    {r >= 500 ? 'All Sri Lanka' : `${r} km`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-shrink-0">
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                <option value="" className="text-gray-900 bg-white">
                  All Specialties
                </option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s} className="text-gray-900 bg-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile tab toggle */}
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

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            w-full md:w-80 lg:w-96 flex-shrink-0 bg-background border-r border-border
            flex flex-col overflow-hidden
            ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}
          `}
        >
          <div className="px-4 py-3 border-b border-border bg-card flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-maroon" />
                <span className="text-foreground text-sm" style={{ fontWeight: 600 }}>
                  {pins.length} professional{pins.length !== 1 ? 's' : ''} found
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

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {loadingProfessionals ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <p className="text-muted-foreground text-sm" style={{ fontWeight: 500 }}>
                  Loading professionals...
                </p>
              </div>
            ) : pins.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <SlidersHorizontal className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm" style={{ fontWeight: 500 }}>
                  No professionals found in this area
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Try expanding the radius or changing specialty
                </p>
              </div>
            ) : (
              pins.map((pin) => {
                const tech = professionals.find((t) => t.id === pin.id);
                if (!tech) return null;

                return (
                  <Link
                    key={pin.id}
                    to={pin.link}
                    onClick={() => setSelectedPinId(pin.id)}
                    className={`block p-4 hover:bg-muted transition-colors ${
                      selectedPinId === pin.id ? 'bg-maroon-light border-l-4 border-maroon' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={
                            tech.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              tech.name
                            )}&background=8B1A2F&color=fff`
                          }
                          alt={tech.name}
                          className="w-11 h-11 rounded-xl object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              tech.name
                            )}&background=8B1A2F&color=fff`;
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
                            className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                              AVAILABILITY_COLORS[tech.availability]
                            }`}
                            style={{ fontWeight: 600 }}
                          >
                            {tech.availability}
                          </span>
                        </div>

                        <p className="text-muted-foreground text-xs mt-0.5 truncate">
                          {tech.specialty}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-gold fill-current" />
                            {tech.rating.toFixed(1)}
                          </span>

                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-maroon" />
                            {tech.city || 'Location not set'}
                          </span>

                          {pin.distanceKm > 0 && (
                            <span className="text-maroon" style={{ fontWeight: 500 }}>
                              ·{' '}
                              {pin.distanceKm < 1
                                ? `${Math.round(pin.distanceKm * 1000)}m`
                                : `${pin.distanceKm.toFixed(1)}km`}{' '}
                              away
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
        </aside>

        {/* Map */}
        <main className={`${mobileView === 'map' ? 'flex' : 'hidden md:flex'} flex-1 min-w-0`}>
          <NearbyMap
            pins={pins}
            userLat={userLat}
            userLng={userLng}
            selectedPinId={selectedPinId}
            onPinClick={handlePinClick}
          />
        </main>
      </div>
    </div>
  );
}