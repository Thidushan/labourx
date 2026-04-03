import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, MapPin, Star, Navigation } from 'lucide-react';
import { TechnicianCard } from '../components/TechnicianCard';
import { mockTechnicians } from '../data/mockData';
import { Technician, SPECIALTIES } from '../types';

const cities = ['All Cities', 'Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna', 'Matara', 'Kurunegala', 'Ratnapura'];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || '');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [minRating, setMinRating] = useState(0);
  const [availability, setAvailability] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<Technician[]>(mockTechnicians);

  useEffect(() => {
    let filtered = [...mockTechnicians];

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.specialty.toLowerCase().includes(q) ||
        t.skills.some(s => s.toLowerCase().includes(q)) ||
        t.city.toLowerCase().includes(q)
      );
    }

    if (selectedSpecialty) {
      filtered = filtered.filter(t => t.specialty === selectedSpecialty);
    }

    if (selectedCity && selectedCity !== 'All Cities') {
      filtered = filtered.filter(t => t.city === selectedCity);
    }

    if (minRating > 0) {
      filtered = filtered.filter(t => t.rating >= minRating);
    }

    if (availability) {
      filtered = filtered.filter(t => t.availability === availability);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'reviews') return b.reviewCount - a.reviewCount;
      if (sortBy === 'experience') return b.yearsExperience - a.yearsExperience;
      if (sortBy === 'projects') return b.completedProjects - a.completedProjects;
      return 0;
    });

    setResults(filtered);
  }, [query, selectedSpecialty, selectedCity, minRating, availability, sortBy]);

  const clearFilters = () => {
    setQuery('');
    setSelectedSpecialty('');
    setSelectedCity('All Cities');
    setMinRating(0);
    setAvailability('');
    setSortBy('rating');
    setSearchParams({});
  };

  const activeFiltersCount = [
    selectedSpecialty,
    selectedCity !== 'All Cities' ? selectedCity : '',
    minRating > 0 ? 'rating' : '',
    availability,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="bg-maroon py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-white mb-2" style={{ fontSize: '2rem', fontWeight: 700 }}>Find Construction Professionals</h1>
          <p className="text-white/70 mb-6">Search from {mockTechnicians.length}+ verified experts across Sri Lanka</p>
          <div className="flex gap-2 max-w-2xl">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, specialty, or skill..."
                className="flex-1 outline-none text-gray-800 text-sm bg-transparent"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${showFilters ? 'bg-white text-maroon border-white' : 'border-white/30 text-white hover:bg-white/10'}`}
              style={{ fontWeight: 500 }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters {activeFiltersCount > 0 && <span className="bg-gold text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFiltersCount}</span>}
            </button>
          </div>

          {/* Specialty Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setSelectedSpecialty('')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${!selectedSpecialty ? 'bg-white text-maroon' : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'}`}
              style={{ fontWeight: 500 }}
            >
              All
            </button>
            {SPECIALTIES.slice(0, 7).map(s => (
              <button
                key={s}
                onClick={() => setSelectedSpecialty(selectedSpecialty === s ? '' : s)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedSpecialty === s ? 'bg-white text-maroon' : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'}`}
                style={{ fontWeight: 500 }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Browse Near Me Button */}
          <div className="mt-5">
            <Link
              to="/nearby"
              className="inline-flex items-center gap-2.5 bg-gold hover:bg-gold-dark text-white px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg group"
              style={{ fontWeight: 600 }}
            >
              <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Navigation className="w-3.5 h-3.5" />
              </div>
              Browse Professionals Near Me
              <MapPin className="w-4 h-4 opacity-80" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-foreground mb-2 block" style={{ fontWeight: 500 }}>
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-maroon" />
                City
              </label>
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30"
              >
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-foreground mb-2 block" style={{ fontWeight: 500 }}>
                <Star className="w-3.5 h-3.5 inline mr-1 text-gold" />
                Minimum Rating
              </label>
              <select
                value={minRating}
                onChange={e => setMinRating(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30"
              >
                <option value={0}>Any Rating</option>
                <option value={4}>4+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
                <option value={4.8}>4.8+ Stars</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-foreground mb-2 block" style={{ fontWeight: 500 }}>Availability</label>
              <select
                value={availability}
                onChange={e => setAvailability(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30"
              >
                <option value="">Any Availability</option>
                <option value="Available">Available</option>
                <option value="Limited">Limited</option>
                <option value="Busy">Busy</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-foreground mb-2 block" style={{ fontWeight: 500 }}>Sort By</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30"
              >
                <option value="rating">Highest Rating</option>
                <option value="reviews">Most Reviews</option>
                <option value="experience">Most Experience</option>
                <option value="projects">Most Projects</option>
              </select>
            </div>
            {activeFiltersCount > 0 && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-maroon hover:underline" style={{ fontWeight: 500 }}>
                  <X className="w-4 h-4" /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-muted-foreground text-sm">
            Showing <span className="text-foreground" style={{ fontWeight: 600 }}>{results.length}</span> professionals
            {query && <> for "<span className="text-maroon">{query}</span>"</>}
            {selectedSpecialty && <> in <span className="text-maroon">{selectedSpecialty}</span></>}
          </p>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none"
          >
            <option value="rating">Sort: Highest Rating</option>
            <option value="reviews">Sort: Most Reviews</option>
            <option value="experience">Sort: Most Experience</option>
          </select>
        </div>

        {/* Results Grid */}
        {results.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-foreground mb-2" style={{ fontWeight: 600 }}>No professionals found</h3>
            <p className="text-muted-foreground text-sm mb-4">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="bg-maroon text-white px-4 py-2 rounded-lg text-sm hover:bg-maroon-dark transition-colors" style={{ fontWeight: 500 }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map(tech => (
              <TechnicianCard key={tech.id} technician={tech} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}