import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Briefcase, MapPin, DollarSign, Clock, Users, CheckCircle,
  Tag, Edit, Eye, Star, Calendar, ArrowRight, FolderOpen
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { mockTechnicians } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { WorkPost } from '../types';

function formatCurrency(amount: number) {
  if (amount >= 1000000) return `Rs. ${(amount / 1000000).toFixed(1)} Mn`;
  if (amount >= 1000) return `Rs. ${(amount / 1000).toFixed(0)}K`;
  return `Rs. ${amount}`;
}

const statusColors: Record<string, string> = {
  open: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
};

export function MyProjectsPage() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState<WorkPost[]>([]);
  const [wonBids, setWonBids] = useState<WorkPost[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setUserPosts([]);
      setWonBids([]);
      return;
    }

    setLoading(true);

    if (currentUser.role === 'user') {
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', currentUser.uid)
      );

      const unsubscribe = onSnapshot(
        postsQuery,
        (snapshot) => {
          const posts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            bids: doc.data().bids || [],
            images: doc.data().images || [],
          })) as WorkPost[];

          posts.sort(
            (a, b) =>
              new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
          );

          setUserPosts(posts);
          setLoading(false);
        },
        (error) => {
          console.error('Error loading projects:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }

    if (currentUser.role === 'technician') {
      const postsRef = collection(db, 'posts');

      const unsubscribe = onSnapshot(
        postsRef,
        (snapshot) => {
          const allPosts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            bids: doc.data().bids || [],
            images: doc.data().images || [],
          })) as WorkPost[];

          const selectedPosts = allPosts.filter((post) =>
            post.bids.some(
              (bid) => bid.technicianId === currentUser.uid && bid.isSelected
            )
          );

          selectedPosts.sort(
            (a, b) =>
              new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
          );

          setWonBids(selectedPosts);
          setLoading(false);
        },
        (error) => {
          console.error('Error loading projects:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }
  }, [currentUser]);

  if (!currentUser) return <Navigate to="/login" replace />;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  /* ── CLIENT VIEW ── */
  if (currentUser.role === 'user') {
    const myPosts = userPosts;
    const activePosts = myPosts.filter((p) => p.status !== 'closed');
    const completedPosts = myPosts.filter((p) => p.status === 'closed');
    const displayed = tab === 'active' ? activePosts : completedPosts;

    return (
      <div className="min-h-screen bg-background">
        <div className="bg-maroon py-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-white" style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Projects</h1>
                <p className="text-white/70 mt-1">Track your posted jobs and ongoing work</p>
              </div>
              <Link
                to="/posts/create"
                className="flex items-center gap-2 bg-gold hover:bg-gold-dark text-white px-4 py-2.5 rounded-xl text-sm transition-colors flex-shrink-0"
                style={{ fontWeight: 600 }}
              >
                + Post New Job
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 bg-white/10 rounded-xl p-4">
              <div className="text-center">
                <p className="text-white" style={{ fontWeight: 700, fontSize: '1.5rem' }}>{myPosts.length}</p>
                <p className="text-white/70 text-xs">Total Posted</p>
              </div>
              <div className="text-center border-x border-white/20">
                <p className="text-white" style={{ fontWeight: 700, fontSize: '1.5rem' }}>{activePosts.length}</p>
                <p className="text-white/70 text-xs">Active</p>
              </div>
              <div className="text-center">
                <p className="text-white" style={{ fontWeight: 700, fontSize: '1.5rem' }}>{completedPosts.length}</p>
                <p className="text-white/70 text-xs">Completed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex border-b border-border mb-6">
            {(['active', 'completed'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm capitalize border-b-2 transition-colors ${tab === t ? 'border-maroon text-maroon' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                style={{ fontWeight: 500 }}
              >
                {t} ({t === 'active' ? activePosts.length : completedPosts.length})
              </button>
            ))}
          </div>

          {displayed.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {tab === 'active' ? 'No active projects right now.' : 'No completed projects yet.'}
              </p>
              {tab === 'active' && (
                <Link to="/posts/create" className="bg-maroon text-white px-5 py-2.5 rounded-xl text-sm hover:bg-maroon-dark transition-colors" style={{ fontWeight: 600 }}>
                  Post a Job
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {displayed.map((post) => {
                const selectedBid = post.bids.find((b) => b.isSelected);
                return (
                  <div key={post.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    {post.images?.[0] && (
                      <div className="h-36 overflow-hidden">
                        <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex flex-wrap gap-2 mb-1.5">
                            <span className="text-xs bg-maroon-light text-maroon px-2 py-0.5 rounded-full flex items-center gap-1" style={{ fontWeight: 500 }}>
                              <Tag className="w-3 h-3" /> {post.category}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[post.status]}`} style={{ fontWeight: 500 }}>
                              {post.status}
                            </span>
                          </div>
                          <h3 className="text-foreground" style={{ fontWeight: 600 }}>{post.title}</h3>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Link
                            to={`/posts/${post.id}/edit`}
                            className="flex items-center gap-1 border border-border hover:border-maroon/40 text-foreground hover:text-maroon px-3 py-1.5 rounded-lg text-xs transition-colors"
                            style={{ fontWeight: 500 }}
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </Link>
                          <Link
                            to={`/posts/${post.id}`}
                            className="flex items-center gap-1 bg-maroon hover:bg-maroon-dark text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
                            style={{ fontWeight: 500 }}
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Link>
                        </div>
                      </div>

                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{post.description}</p>

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-gold" />
                          {formatCurrency(post.budgetMin)} – {formatCurrency(post.budgetMax)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-maroon" /> {post.timeline}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {post.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {new Date(post.postedAt).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4 text-maroon" />
                          <span><span className="text-foreground" style={{ fontWeight: 600 }}>{post.bids.length}</span> bid{post.bids.length !== 1 ? 's' : ''} received</span>
                        </div>
                        {selectedBid ? (
                          <Link to={`/technician/${selectedBid.technicianId}`} className="flex items-center gap-2">
                            <img
                              src={selectedBid.technicianAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedBid.technicianName)}&background=8B1A2F&color=fff`}
                              alt={selectedBid.technicianName}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-xs text-foreground" style={{ fontWeight: 500 }}>{selectedBid.technicianName}</span>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </Link>
                        ) : (
                          post.bids.length > 0 && (
                            <Link to={`/posts/${post.id}`} className="text-xs text-maroon hover:underline flex items-center gap-1" style={{ fontWeight: 500 }}>
                              Review bids <ArrowRight className="w-3 h-3" />
                            </Link>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── TECHNICIAN VIEW ── */
  const techData = mockTechnicians.find((t) => t.id === currentUser.uid) || {
    id: currentUser.uid,
    name: currentUser.name,
    rating: currentUser.rating || 0,
    reviewCount: currentUser.totalReviews || 0,
    projects: [],
    completedProjects: 0,
    reviews: [],
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-maroon py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-white" style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Projects</h1>
          <p className="text-white/70 mt-1">Your portfolio and won contracts on LabourX</p>
          <div className="grid grid-cols-3 gap-4 mt-6 bg-white/10 rounded-xl p-4">
            <div className="text-center">
              <p className="text-white" style={{ fontWeight: 700, fontSize: '1.5rem' }}>{techData.projects.length}</p>
              <p className="text-white/70 text-xs">Portfolio</p>
            </div>
            <div className="text-center border-x border-white/20">
              <p className="text-white" style={{ fontWeight: 700, fontSize: '1.5rem' }}>{wonBids.length}</p>
              <p className="text-white/70 text-xs">Won on Platform</p>
            </div>
            <div className="text-center">
              <p className="text-white" style={{ fontWeight: 700, fontSize: '1.5rem' }}>{techData.completedProjects}</p>
              <p className="text-white/70 text-xs">Total Completed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {wonBids.length > 0 && (
          <div>
            <h2 className="text-foreground mb-4" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              🏆 Won Contracts on LabourX
            </h2>
            <div className="space-y-4">
              {wonBids.map((post) => {
                const myBid = post.bids.find((b) => b.technicianId === currentUser.uid && b.isSelected)!;
                return (
                  <div key={post.id} className="bg-card border border-green-200 dark:border-green-800 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[post.status]}`} style={{ fontWeight: 500 }}>
                            {post.status}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>
                            <CheckCircle className="w-3 h-3" /> Bid Selected
                          </span>
                        </div>
                        <h3 className="text-foreground" style={{ fontWeight: 600 }}>{post.title}</h3>
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{post.description}</p>
                      </div>
                      <Link
                        to={`/posts/${post.id}`}
                        className="flex items-center gap-1 bg-maroon hover:bg-maroon-dark text-white px-3 py-1.5 rounded-lg text-xs transition-colors flex-shrink-0"
                        style={{ fontWeight: 500 }}
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-gold" />
                        <span className="text-gold" style={{ fontWeight: 600 }}>{formatCurrency(myBid.budget)}</span> (your bid)
                      </span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-maroon" /> {myBid.timeline}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {post.location}</span>
                      <span className="flex items-center gap-1">
                        <img
                          src={post.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userName)}&background=8B1A2F&color=fff`}
                          alt={post.userName}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        {post.userName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              📁 Portfolio Projects
            </h2>
            <Link
              to="/profile"
              className="flex items-center gap-1.5 text-sm text-maroon hover:underline"
              style={{ fontWeight: 500 }}
            >
              <Edit className="w-3.5 h-3.5" /> Manage in Profile
            </Link>
          </div>

          {techData.projects.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-3">No portfolio projects yet.</p>
              <Link to="/profile" className="bg-maroon text-white px-4 py-2 rounded-lg text-sm hover:bg-maroon-dark transition-colors" style={{ fontWeight: 500 }}>
                Add Projects to Profile
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {techData.projects.map((project: any) => (
                <div key={project.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop'; }}
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-foreground text-sm" style={{ fontWeight: 600 }}>{project.title}</h3>
                      <span className="text-xs bg-maroon-light text-maroon px-2 py-0.5 rounded-full flex-shrink-0">{project.category}</span>
                    </div>
                    <p className="text-muted-foreground text-xs line-clamp-2 mb-3">{project.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-maroon" /> {project.year}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-maroon" /> {project.duration}
                      </span>
                      {project.value && (
                        <span className="flex items-center gap-1 text-gold" style={{ fontWeight: 600 }}>
                          <DollarSign className="w-3 h-3" /> {project.value}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: '1.1rem' }}>⭐ Reviews Received</h2>
            <Link to={`/technician/${techData.id}`} className="flex items-center gap-1.5 text-sm text-maroon hover:underline" style={{ fontWeight: 500 }}>
              View public profile <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <p className="text-foreground" style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{Number(techData.rating || 0).toFixed(1)}</p>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(Number(techData.rating || 0)) ? 'fill-gold text-gold' : 'text-muted-foreground'}`} />
                  ))}
                </div>
                <p className="text-muted-foreground text-xs mt-1">{techData.reviewCount || 0} reviews</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = (techData.reviews || []).filter((r: any) => r.rating === star).length;
                  const pct = (techData.reviews || []).length > 0 ? (count / techData.reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground w-3">{star}</span>
                      <Star className="w-3 h-3 fill-gold text-gold" />
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-muted-foreground w-3">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {(techData.reviews || []).slice(0, 2).map((review: any) => (
              <div key={review.id} className="border-t border-border pt-3 mt-3">
                <div className="flex items-center gap-2 mb-1">
                  <img src={review.userAvatar || ''} alt={review.userName} className="w-7 h-7 rounded-full object-cover" />
                  <div>
                    <p className="text-foreground text-xs" style={{ fontWeight: 600 }}>{review.userName}</p>
                    <p className="text-muted-foreground text-xs">{review.projectType}</p>
                  </div>
                  <div className="flex gap-0.5 ml-auto">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'fill-gold text-gold' : 'text-muted-foreground'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground text-xs line-clamp-2">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}