import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Star, Shield, Zap, Users, TrendingUp, ArrowRight,
  HardHat, Lightbulb, Droplets, Palette, PenTool, Hammer,
  CheckCircle, Award, Clock, MessageSquare, ChevronRight
} from 'lucide-react';
import { TechnicianCard } from '../components/TechnicianCard';
import { PostCard } from '../components/PostCard';
import { mockTechnicians, mockWorkPosts } from '../data/mockData';

const categories = [
  { name: 'Mason', icon: HardHat, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', description: 'Brickwork, Concrete & Foundations' },
  { name: 'Electrician', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400', description: 'Wiring, Solar & Smart Home' },
  { name: 'Plumber', icon: Droplets, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', description: 'Pipes, Drainage & Fixtures' },
  { name: 'Interior Designer', icon: Palette, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', description: 'Spaces, Aesthetics & Interiors' },
  { name: 'Architect', icon: PenTool, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', description: 'Design, Planning & Structure' },
  { name: 'Carpenter', icon: Hammer, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', description: 'Furniture, Kitchens & Woodwork' },
];

const steps = [
  { icon: Search, title: 'Search & Discover', description: 'Search for professionals by specialty and location. Browse verified profiles, portfolios, and reviews.' },
  { icon: MessageSquare, title: 'Post or Connect', description: 'Post your project and receive bids, or directly contact a professional whose work impresses you.' },
  { icon: CheckCircle, title: 'Get Work Done', description: 'Choose the best professional, get your project executed, and leave a review to help the community.' },
];

const stats = [
  { value: '2,500+', label: 'Verified Professionals' },
  { value: '15,000+', label: 'Projects Completed' },
  { value: '50+', label: 'Cities Covered' },
  { value: '4.8★', label: 'Average Rating' },
];

const testimonials = [
  {
    name: 'Nimasha Jayasinghe',
    city: 'Colombo',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 5,
    text: "LabourX made finding an architect for our dream home so simple. Within a day, we had 6 proposals with detailed plans and budgets. We found the perfect match!",
    project: 'Custom Home Design',
  },
  {
    name: 'Rukshan Perera',
    city: 'Kandy',
    avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
    rating: 5,
    text: "As a technician, this platform transformed my business. I now get consistent projects and clients can see my full portfolio before contacting me.",
    project: 'Master Electrician',
  },
  {
    name: 'Chamari Seneviratne',
    city: 'Galle',
    avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
    rating: 5,
    text: "Posted my kitchen renovation project and had 8 bids within 48 hours! The detailed proposals with budgets and timelines made it easy to choose the right carpenter.",
    project: 'Kitchen Renovation',
  },
];

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[580px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1774600166432-ba8ac640b318?w=1400&fit=crop')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-gold/20 border border-gold/40 rounded-full px-4 py-1.5 mb-5">
              <Award className="w-4 h-4 text-gold" />
              <span className="text-gold text-sm" style={{ fontWeight: 500 }}>Sri Lanka's #1 Construction Marketplace</span>
            </div>
            <h1 className="text-white mb-4" style={{ fontSize: '2.75rem', fontWeight: 700, lineHeight: 1.2 }}>
              Build Your Dream with{' '}
              <span style={{ color: '#C9A84C' }}>Trusted Professionals</span>
            </h1>
            <p className="text-white/80 mb-8 text-lg">
              Connect with verified masons, electricians, plumbers, architects, and more. 
              Find the right expert for your construction project.
            </p>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
              <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-lg">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a specialty (e.g. Plumber, Architect...)"
                  className="flex-1 outline-none text-gray-800 text-sm bg-transparent"
                />
              </div>
              <button
                type="submit"
                className="bg-maroon hover:bg-maroon-dark text-white px-6 py-3 rounded-xl transition-colors flex-shrink-0"
                style={{ fontWeight: 600 }}
              >
                Search
              </button>
            </form>
            <div className="flex flex-wrap gap-2 mt-4">
              {['Mason', 'Electrician', 'Plumber', 'Architect', 'Interior Designer'].map(tag => (
                <button
                  key={tag}
                  onClick={() => navigate(`/search?specialty=${tag}`)}
                  className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1 text-xs transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-maroon py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-white" style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stat.value}</div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-foreground mb-3" style={{ fontSize: '2rem', fontWeight: 700 }}>Browse by Specialty</h2>
            <p className="text-muted-foreground">Find the right professional for every construction need</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(cat => (
              <Link
                key={cat.name}
                to={`/search?specialty=${cat.name}`}
                className="group flex flex-col items-center p-5 rounded-xl border border-border bg-card hover:border-maroon hover:shadow-md transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <span className="text-sm text-center text-foreground" style={{ fontWeight: 600 }}>{cat.name}</span>
                <span className="text-xs text-center text-muted-foreground mt-1">{cat.description}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link to="/search" className="inline-flex items-center gap-2 text-maroon hover:text-maroon-dark text-sm" style={{ fontWeight: 500 }}>
              View all specialties <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-maroon-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-foreground mb-3" style={{ fontSize: '2rem', fontWeight: 700 }}>How LabourX Works</h2>
            <p className="text-muted-foreground">Three simple steps to get your project started</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-px border-t-2 border-dashed border-maroon/30 z-0 -translate-y-px" style={{ width: 'calc(100% - 3rem)', left: '75%' }} />
                )}
                <div className="bg-card border border-border rounded-xl p-6 relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-maroon rounded-xl flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-7 h-7 rounded-full bg-gold text-white flex items-center justify-center text-sm" style={{ fontWeight: 700 }}>
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-foreground mb-2" style={{ fontWeight: 600 }}>{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-foreground" style={{ fontSize: '2rem', fontWeight: 700 }}>Top Professionals</h2>
              <p className="text-muted-foreground mt-1">Highly rated and verified experts</p>
            </div>
            <Link to="/search" className="flex items-center gap-1 text-maroon hover:text-maroon-dark text-sm" style={{ fontWeight: 500 }}>
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {mockTechnicians.slice(0, 3).map((tech, i) => (
              <TechnicianCard key={tech.id} technician={tech} featured={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1581674662583-5e89b374fae6?w=1400&fit=crop')` }} />
        <div className="absolute inset-0 bg-maroon/85" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-white mb-2" style={{ fontSize: '1.75rem', fontWeight: 700 }}>Have a Project in Mind?</h2>
              <p className="text-white/80">Post your project and receive competitive bids from verified professionals within 24 hours.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link
                to="/posts/create"
                className="bg-gold hover:bg-gold-dark text-white px-6 py-3 rounded-xl transition-colors"
                style={{ fontWeight: 600 }}
              >
                Post a Job
              </Link>
              <Link
                to="/search"
                className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-6 py-3 rounded-xl transition-colors"
                style={{ fontWeight: 600 }}
              >
                Browse Experts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Work Posts */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-foreground" style={{ fontSize: '2rem', fontWeight: 700 }}>Recent Work Posts</h2>
              <p className="text-muted-foreground mt-1">Open projects looking for skilled professionals</p>
            </div>
            <Link to="/posts" className="flex items-center gap-1 text-maroon hover:text-maroon-dark text-sm" style={{ fontWeight: 500 }}>
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {mockWorkPosts.slice(0, 3).map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gold-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-foreground mb-3" style={{ fontSize: '2rem', fontWeight: 700 }}>Why LabourX?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Shield, title: 'Verified Professionals', desc: 'Every professional is background-checked and verified' },
              { icon: Star, title: 'Transparent Reviews', desc: 'Real reviews from real clients for informed decisions' },
              { icon: Zap, title: 'Fast Matching', desc: 'Get bids and connect with experts within hours' },
              { icon: TrendingUp, title: 'Competitive Pricing', desc: 'Compare multiple bids and get the best value' },
            ].map((item, i) => (
              <div key={i} className="text-center bg-card border border-border rounded-xl p-5">
                <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-foreground mb-2 text-base" style={{ fontWeight: 600 }}>{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-foreground mb-3" style={{ fontSize: '2rem', fontWeight: 700 }}>What Our Community Says</h2>
            <p className="text-muted-foreground">Stories from homeowners and professionals across Sri Lanka</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }, (_, j) => (
                    <Star key={j} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-card-foreground text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p style={{ fontWeight: 600 }} className="text-sm text-card-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.project} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-14 bg-maroon-light border-t border-maroon/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-foreground mb-3" style={{ fontSize: '2rem', fontWeight: 700 }}>Are You a Construction Professional?</h2>
          <p className="text-muted-foreground mb-6 text-lg">
            Join LabourX and showcase your expertise to thousands of clients. Build your portfolio, receive job offers, and grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="bg-maroon hover:bg-maroon-dark text-white px-8 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
              style={{ fontWeight: 600 }}
            >
              <Users className="w-5 h-5" />
              Join as a Professional
            </Link>
            <Link
              to="/search"
              className="border border-maroon text-maroon hover:bg-maroon hover:text-white px-8 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
              style={{ fontWeight: 600 }}
            >
              <Search className="w-5 h-5" />
              Browse Professionals
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}