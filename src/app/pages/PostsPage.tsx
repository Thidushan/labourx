import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, X } from 'lucide-react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { PostCard } from '../components/PostCard';
import { db } from '../../firebase/config';
import { SPECIALTIES } from '../types';
import { useAuth } from '../context/AuthContext';

export function PostsPage() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);

        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(postsQuery);

        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          bids: doc.data().bids || [],
          images: doc.data().images || [],
        }));

        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const filtered = posts.filter(post => {
    const matchSearch =
      !search ||
      post.title?.toLowerCase().includes(search.toLowerCase()) ||
      post.description?.toLowerCase().includes(search.toLowerCase()) ||
      post.location?.toLowerCase().includes(search.toLowerCase());

    const matchCategory = !selectedCategory || post.category === selectedCategory;
    const matchStatus = !selectedStatus || post.status === selectedStatus;

    return matchSearch && matchCategory && matchStatus;
  });

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedStatus('');
  };

  const hasFilters = search || selectedCategory || selectedStatus;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-maroon py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-white" style={{ fontSize: '2rem', fontWeight: 700 }}>Work Posts</h1>
              <p className="text-white/70 mt-1">Browse projects posted by clients — submit your bid and win work</p>
            </div>
            {currentUser?.role === 'user' && (
              <Link
                to="/posts/create"
                className="flex items-center gap-2 bg-gold hover:bg-gold-dark text-white px-5 py-2.5 rounded-xl transition-colors flex-shrink-0"
                style={{ fontWeight: 600 }}
              >
                <Plus className="w-4 h-4" />
                Post a Job
              </Link>
            )}
            {!currentUser && (
              <Link
                to="/register"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white px-5 py-2.5 rounded-xl transition-colors flex-shrink-0"
                style={{ fontWeight: 600 }}
              >
                <Plus className="w-4 h-4" />
                Post Your Project
              </Link>
            )}
          </div>

          {/* Search & Filters */}
          <div className="mt-5 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 flex-1 min-w-48">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search posts..."
                className="flex-1 outline-none text-gray-800 text-sm bg-transparent"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 rounded-xl border-0 bg-white text-gray-800 text-sm focus:outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {SPECIALTIES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border-0 bg-white text-gray-800 text-sm focus:outline-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${!selectedCategory ? 'bg-maroon text-white' : 'bg-card border border-border text-foreground hover:border-maroon hover:text-maroon'}`}
            style={{ fontWeight: 500 }}
          >
            All Posts ({posts.length})
          </button>
          {SPECIALTIES.slice(0, 6).map(s => {
            const count = posts.filter(p => p.category === s).length;
            if (count === 0) return null;
            return (
              <button
                key={s}
                onClick={() => setSelectedCategory(selectedCategory === s ? '' : s)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${selectedCategory === s ? 'bg-maroon text-white' : 'bg-card border border-border text-foreground hover:border-maroon hover:text-maroon'}`}
                style={{ fontWeight: 500 }}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-muted-foreground text-sm">
            Showing <span className="text-foreground" style={{ fontWeight: 600 }}>{filtered.length}</span> posts
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-maroon hover:underline" style={{ fontWeight: 500 }}>
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <h3 className="text-foreground mb-2" style={{ fontWeight: 600 }}>Loading posts...</h3>
            <p className="text-muted-foreground text-sm">Please wait a moment</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-foreground mb-2" style={{ fontWeight: 600 }}>No posts found</h3>
            <p className="text-muted-foreground text-sm mb-4">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="bg-maroon text-white px-4 py-2 rounded-lg text-sm hover:bg-maroon-dark transition-colors" style={{ fontWeight: 500 }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* CTA for professionals */}
        {currentUser?.role === 'technician' && (
          <div className="mt-10 bg-maroon-light border border-maroon/20 rounded-xl p-6 text-center">
            <h3 className="text-foreground mb-2" style={{ fontWeight: 600 }}>Find Projects That Match Your Skills</h3>
            <p className="text-muted-foreground text-sm mb-4">Browse open projects and submit competitive bids to win work from clients in your area.</p>
            <p className="text-maroon text-sm" style={{ fontWeight: 500 }}>Click on any post above to view details and submit your bid!</p>
          </div>
        )}
      </div>
    </div>
  );
}