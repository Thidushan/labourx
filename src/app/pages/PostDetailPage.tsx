import { useEffect, useState } from 'react';
import {
  ArrowLeft, MapPin, Clock, DollarSign, Users, Calendar, Tag,
  Star, CheckCircle, Send, AlertCircle, ChevronDown, ChevronUp, Edit
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Bid } from '../types';

function formatCurrency(amount: number) {
  if (amount >= 1000000) return `Rs. ${(amount / 1000000).toFixed(1)} Mn`;
  if (amount >= 1000) return `Rs. ${(amount / 1000).toFixed(0)}K`;
  return `Rs. ${amount}`;
}

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<Bid[]>([]);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidSubmitted, setBidSubmitted] = useState(false);
  const [expandedBid, setExpandedBid] = useState<string | null>(null);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [selectingBid, setSelectingBid] = useState(false);

  const [bidForm, setBidForm] = useState({
    budget: '',
    timeline: '',
    description: '',
    approach: '',
  });

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const postRef = doc(db, 'posts', id);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          const postData = {
            id: postSnap.id,
            ...postSnap.data(),
            bids: postSnap.data().bids || [],
            images: postSnap.data().images || [],
          };

          setPost(postData);
          setBids(postData.bids || []);

          if (currentUser?.uid) {
            const alreadySubmitted = (postData.bids || []).some(
              (b: Bid) => b.technicianId === currentUser.uid
            );
            setBidSubmitted(alreadySubmitted);
          }
        } else {
          setPost(null);
        }
      } catch (error) {
        console.error('Error loading post:', error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, currentUser?.uid]);

  const currentTechnician = currentUser?.role === 'technician'
    ? {
        id: currentUser.uid,
        name: currentUser.name,
        avatar: currentUser.avatar || currentUser.photoURL || '',
        specialty: currentUser.specialty || 'Professional',
        rating: currentUser.rating || 0,
      }
    : null;

  const statusConfig = {
    open: { label: 'Open for Bids', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400' },
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTechnician || !post || !id || !currentUser) return;

    const duplicateBid = bids.some(b => b.technicianId === currentUser.uid);
    if (duplicateBid) {
      alert('You have already submitted a bid for this post.');
      setBidSubmitted(true);
      setShowBidForm(false);
      return;
    }

    const newBid: Bid = {
      id: `bid-${Date.now()}`,
      technicianId: currentTechnician.id,
      technicianName: currentTechnician.name,
      technicianAvatar: currentTechnician.avatar,
      technicianSpecialty: currentTechnician.specialty,
      technicianRating: currentTechnician.rating,
      description: bidForm.description,
      budget: parseInt(bidForm.budget.replace(/[^0-9]/g, '')) || 0,
      timeline: bidForm.timeline,
      approach: bidForm.approach,
      submittedAt: new Date().toISOString(),
    };

    try {
      setSubmittingBid(true);

      const updatedBids = [...bids, newBid];

      await updateDoc(doc(db, 'posts', id), {
        bids: updatedBids,
      });

      setBids(updatedBids);
      setPost((prev: any) => prev ? { ...prev, bids: updatedBids } : prev);
      setBidSubmitted(true);
      setShowBidForm(false);
      setBidForm({
        budget: '',
        timeline: '',
        description: '',
        approach: '',
      });
    } catch (error) {
      console.error('Error submitting bid:', error);
      alert('Failed to submit bid. Please try again.');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleSelectBid = async (bidId: string) => {
    if (!id || !post) return;

    try {
      setSelectingBid(true);

      const updatedBids = bids.map(b => ({
        ...b,
        isSelected: b.id === bidId,
      }));

      await updateDoc(doc(db, 'posts', id), {
        bids: updatedBids,
        status: 'in-progress',
      });

      setBids(updatedBids);
      setPost((prev: any) =>
        prev
          ? {
              ...prev,
              bids: updatedBids,
              status: 'in-progress',
            }
          : prev
      );
    } catch (error) {
      console.error('Error selecting bid:', error);
      alert('Failed to select bid. Please try again.');
    } finally {
      setSelectingBid(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-foreground mb-2" style={{ fontWeight: 600 }}>Loading post...</h2>
          <p className="text-muted-foreground text-sm">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-foreground mb-2" style={{ fontWeight: 600 }}>Post not found</h2>
          <Link to="/posts" className="text-maroon hover:underline">Back to Posts</Link>
        </div>
      </div>
    );
  }

  const isPostOwner = currentUser?.uid === post.userId;
  const alreadyBid = bids.some(b => b.technicianId === currentUser?.uid);
  const canBid =
    currentUser?.role === 'technician' &&
    post.status === 'open' &&
    !alreadyBid &&
    !bidSubmitted;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors" style={{ fontWeight: 500 }}>
          <ArrowLeft className="w-4 h-4" /> Back to Posts
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main */}
          <div className="flex-1">
            {/* Post Header */}
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-maroon-light text-maroon text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ fontWeight: 500 }}>
                  <Tag className="w-3 h-3" /> {post.category}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[post.status as keyof typeof statusConfig]?.color || statusConfig.open.color}`} style={{ fontWeight: 500 }}>
                  {statusConfig[post.status as keyof typeof statusConfig]?.label || 'Open for Bids'}
                </span>
              </div>
              <h1 className="text-foreground mb-3" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{post.title}</h1>
              {isPostOwner && (
                <Link
                  to={`/posts/${post.id}/edit`}
                  className="inline-flex items-center gap-1.5 mb-4 text-sm border border-border hover:border-maroon/40 text-foreground hover:text-maroon px-3 py-1.5 rounded-lg transition-colors bg-muted/50"
                  style={{ fontWeight: 500 }}
                >
                  <Edit className="w-3.5 h-3.5" /> Edit This Post
                </Link>
              )}
              <p className="text-muted-foreground leading-relaxed mb-5">{post.description}</p>

              {post.images && post.images.length > 0 && (
                <div className="rounded-xl overflow-hidden mb-5">
                  <img src={post.images[0]} alt="Project" className="w-full h-56 object-cover" />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Budget Range</p>
                  <p className="text-gold" style={{ fontWeight: 700 }}>{formatCurrency(post.budgetMin)} – {formatCurrency(post.budgetMax)}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Timeline</p>
                  <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>{post.timeline}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Location</p>
                  <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>{post.location}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Posted</p>
                  <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>
                    {new Date(post.postedAt).toLocaleDateString('en-LK', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Bids Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-maroon" />
                  <h2 className="text-foreground" style={{ fontWeight: 600 }}>
                    {bids.length} {bids.length === 1 ? 'Bid' : 'Bids'} Received
                  </h2>
                </div>
                {canBid && !alreadyBid && (
                  <button
                    onClick={() => setShowBidForm(!showBidForm)}
                    className="flex items-center gap-2 bg-maroon hover:bg-maroon-dark text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    <Send className="w-4 h-4" />
                    Submit Your Bid
                  </button>
                )}
              </div>

              {/* Bid Form */}
              {showBidForm && (
                <form onSubmit={handleSubmitBid} className="mb-6 p-5 bg-maroon-light border border-maroon/20 rounded-xl space-y-4">
                  <h3 className="text-foreground" style={{ fontWeight: 600 }}>Submit Your Proposal</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-foreground mb-1.5 block" style={{ fontWeight: 500 }}>Your Budget (₹) *</label>
                      <input
                        type="text"
                        value={bidForm.budget}
                        onChange={e => setBidForm(p => ({ ...p, budget: e.target.value }))}
                        placeholder="e.g. 4500000"
                        className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-foreground mb-1.5 block" style={{ fontWeight: 500 }}>Your Timeline *</label>
                      <input
                        type="text"
                        value={bidForm.timeline}
                        onChange={e => setBidForm(p => ({ ...p, timeline: e.target.value }))}
                        placeholder="e.g. 12 months"
                        className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-foreground mb-1.5 block" style={{ fontWeight: 500 }}>Why should they choose you? *</label>
                    <textarea
                      value={bidForm.description}
                      onChange={e => setBidForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Describe your experience, relevant projects, and why you're the best fit..."
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30 resize-none"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-foreground mb-1.5 block" style={{ fontWeight: 500 }}>Execution Approach *</label>
                    <textarea
                      value={bidForm.approach}
                      onChange={e => setBidForm(p => ({ ...p, approach: e.target.value }))}
                      placeholder="Describe your plan, phases, methodology..."
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30 resize-none"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={submittingBid} className="bg-maroon hover:bg-maroon-dark text-white px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60" style={{ fontWeight: 600 }}>
                      {submittingBid ? 'Submitting...' : 'Submit Bid'}
                    </button>
                    <button type="button" onClick={() => setShowBidForm(false)} className="px-4 py-2.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors text-foreground" style={{ fontWeight: 500 }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {bidSubmitted && (
                <div className="mb-4 flex items-center gap-2 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm" style={{ fontWeight: 500 }}>Your bid has been submitted successfully! The client will review it shortly.</span>
                </div>
              )}

              {!currentUser && (
                <div className="mb-4 flex items-center gap-2 p-4 rounded-xl bg-gold-light border border-gold/20">
                  <AlertCircle className="w-4 h-4 text-gold flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <Link to="/login" className="text-maroon hover:underline" style={{ fontWeight: 500 }}>Sign in</Link> as a professional to submit a bid.
                  </p>
                </div>
              )}

              {/* Bids List */}
              {bids.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No bids yet. Be the first to submit!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bids.map(bid => (
                    <div key={bid.id} className={`border rounded-xl overflow-hidden transition-all ${bid.isSelected ? 'border-green-400 bg-green-50/50 dark:bg-green-900/10' : 'border-border bg-card'}`}>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <Link to={`/technician/${bid.technicianId}`}>
                              <img
                                src={bid.technicianAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(bid.technicianName)}&background=8B1A2F&color=fff`}
                                alt={bid.technicianName}
                                className="w-11 h-11 rounded-full object-cover border-2 border-maroon/20 hover:border-maroon transition-colors"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(bid.technicianName)}&background=8B1A2F&color=fff`;
                                }}
                              />
                            </Link>
                            <div>
                              <Link to={`/technician/${bid.technicianId}`} className="text-foreground hover:text-maroon transition-colors" style={{ fontWeight: 600 }}>
                                {bid.technicianName}
                              </Link>
                              <p className="text-muted-foreground text-xs">{bid.technicianSpecialty}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="w-3 h-3 fill-gold text-gold" />
                                <span className="text-xs" style={{ fontWeight: 600 }}>{bid.technicianRating}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <p className="text-gold" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                              {formatCurrency(bid.budget)}
                            </p>
                            <p className="text-muted-foreground text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {bid.timeline}
                            </p>
                            {bid.isSelected && (
                              <span className="flex items-center gap-1 text-xs text-green-600" style={{ fontWeight: 500 }}>
                                <CheckCircle className="w-3.5 h-3.5" /> Selected
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-muted-foreground text-sm mt-3 line-clamp-2">{bid.description}</p>

                        <div className="flex items-center justify-between mt-3">
                          <button
                            onClick={() => setExpandedBid(expandedBid === bid.id ? null : bid.id)}
                            className="flex items-center gap-1 text-sm text-maroon hover:underline"
                            style={{ fontWeight: 500 }}
                          >
                            {expandedBid === bid.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {expandedBid === bid.id ? 'Hide' : 'View'} Full Proposal
                          </button>
                          {isPostOwner && !bid.isSelected && post.status !== 'closed' && (
                            <button
                              onClick={() => handleSelectBid(bid.id)}
                              disabled={selectingBid}
                              className="text-xs bg-maroon text-white px-3 py-1.5 rounded-lg hover:bg-maroon-dark transition-colors disabled:opacity-60"
                              style={{ fontWeight: 500 }}
                            >
                              {selectingBid ? 'Saving...' : 'Select this Bid'}
                            </button>
                          )}
                          <Link to={`/technician/${bid.technicianId}`} className="text-xs text-muted-foreground hover:text-maroon transition-colors">
                            View Profile
                          </Link>
                        </div>
                      </div>

                      {expandedBid === bid.id && (
                        <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/50">
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground mb-1" style={{ fontWeight: 600 }}>EXECUTION APPROACH</p>
                            <p className="text-sm text-foreground leading-relaxed">{bid.approach}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-72 space-y-5 flex-shrink-0">
            {/* Posted By */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-foreground mb-3" style={{ fontWeight: 600 }}>Posted By</h3>
              <div className="flex items-center gap-3">
                <img
                  src={post.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userName)}&background=8B1A2F&color=fff`}
                  alt={post.userName}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userName)}&background=8B1A2F&color=fff`;
                  }}
                />
                <div>
                  <p style={{ fontWeight: 600 }} className="text-card-foreground">{post.userName}</p>
                  <p className="text-muted-foreground text-sm flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {post.userCity}
                  </p>
                </div>
              </div>
            </div>

            {/* Project Summary */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="text-foreground mb-1" style={{ fontWeight: 600 }}>Project Summary</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4 text-gold" />
                <span>Budget: <span style={{ fontWeight: 600 }} className="text-gold">{formatCurrency(post.budgetMin)} – {formatCurrency(post.budgetMax)}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-maroon" />
                <span>Timeline: <span style={{ fontWeight: 600 }} className="text-foreground">{post.timeline}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-maroon" />
                <span>{post.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 text-maroon" />
                <span>Posted: {new Date(post.postedAt).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4 text-maroon" />
                <span><span style={{ fontWeight: 600 }} className="text-foreground">{bids.length}</span> bids received</span>
              </div>
            </div>

            {/* CTA */}
            {canBid && !alreadyBid && (
              <button
                onClick={() => setShowBidForm(true)}
                className="w-full bg-maroon hover:bg-maroon-dark text-white py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                style={{ fontWeight: 600 }}
              >
                <Send className="w-4 h-4" />
                Submit Your Bid
              </button>
            )}
            {!currentUser && (
              <Link
                to="/login"
                className="w-full bg-maroon hover:bg-maroon-dark text-white py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                style={{ fontWeight: 600 }}
              >
                Sign in to Bid
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}