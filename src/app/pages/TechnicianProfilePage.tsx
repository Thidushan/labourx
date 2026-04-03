import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Star, Briefcase, Phone, Mail, Globe, CheckCircle,
  ArrowLeft, Clock, Award, GraduationCap, FolderOpen, MessageSquare,
  Calendar, DollarSign, Share2, Bookmark
} from 'lucide-react';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { ReviewCard } from '../components/ReviewCard';
import { StarRating } from '../components/StarRating';
import { db } from '../../firebase/config';
import { useAuth } from '../context/AuthContext';

type TabType = 'overview' | 'portfolio' | 'education' | 'reviews';

export function TechnicianProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '', projectType: '' });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const [technician, setTechnician] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasWorkedTogether, setHasWorkedTogether] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchTechnicianProfile = async () => {
      if (!id) {
        setTechnician(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const techRef = doc(db, 'users', id);
        const techSnap = await getDoc(techRef);

        if (!techSnap.exists()) {
          setTechnician(null);
          return;
        }

        const data: any = techSnap.data();

        if (String(data.role || '').toLowerCase() !== 'technician') {
          setTechnician(null);
          return;
        }

        const techData = {
          id: techSnap.id,
          name: data.name || 'Unknown Professional',
          email: data.email || '',
          phone: data.phone || '',
          specialty: data.specialty || 'Professional',
          location: data.location || data.city || '',
          city: data.city || '',
          avatar: data.avatar || data.photoURL || '',
          role: data.role || 'technician',
          bio: data.bio || '',
          yearsExperience: Number(data.yearsExperience || 0),
          rating: Number(data.rating || 0),
          reviewCount: Number(data.totalReviews || data.reviewCount || 0),
          skills: Array.isArray(data.skills) ? data.skills : [],
          certifications: Array.isArray(data.certifications) ? data.certifications : [],
          education: Array.isArray(data.education) ? data.education : [],
          projects: Array.isArray(data.projects) ? data.projects : [],
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
          availability: data.availability || 'Available',
          hourlyRate: data.hourlyRate || 'Contact for pricing',
          completedProjects: Number(data.completedProjects || 0),
          joinedAt: data.joinedAt || '',
          isVerified: Boolean(data.isVerified || false),
          website: data.website || '',
        };

        setTechnician(techData);

        if (currentUser?.role === 'user') {
          const postsSnapshot = await getDocs(collection(db, 'posts'));

          const workedTogether = postsSnapshot.docs.some((postDoc) => {
            const post: any = postDoc.data();
            const bids = Array.isArray(post.bids) ? post.bids : [];

            return (
              post.userId === currentUser.uid &&
              bids.some((b: any) => b.technicianId === techSnap.id && b.isSelected)
            );
          });

          setHasWorkedTogether(workedTogether);
        } else {
          setHasWorkedTogether(false);
        }
      } catch (error) {
        console.error('Error loading technician profile:', error);
        setTechnician(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicianProfile();
  }, [id, currentUser?.uid, currentUser?.role]);

  const openReviewForm = () => {
    setActiveTab('reviews');
    setShowReviewForm(true);
    setTimeout(() => {
      document.getElementById('review-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
  };

  const availabilityColors = {
    Available: 'bg-green-100 text-green-700',
    Busy: 'bg-red-100 text-red-700',
    Limited: 'bg-yellow-100 text-yellow-700',
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !technician || !id || !hasWorkedTogether) return;

    if (
      newReview.rating === 0 ||
      !newReview.comment.trim() ||
      !newReview.projectType.trim()
    ) {
      alert('Please complete all review fields.');
      return;
    }

    try {
      setSubmittingReview(true);

      const newReviewItem = {
        id: `review-${Date.now()}`,
        userId: currentUser.uid,
        userName: currentUser.name,
        userAvatar: currentUser.avatar || currentUser.photoURL || '',
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        date: new Date().toISOString(),
        projectType: newReview.projectType.trim(),
      };

      const existingReviews = Array.isArray(technician.reviews) ? technician.reviews : [];
      const updatedReviews = [newReviewItem, ...existingReviews];
      const updatedReviewCount = updatedReviews.length;
      const updatedRating =
        updatedReviews.reduce(
          (sum: number, review: any) => sum + Number(review.rating || 0),
          0
        ) / updatedReviewCount;

      await updateDoc(doc(db, 'users', id), {
        reviews: updatedReviews,
        reviewCount: updatedReviewCount,
        totalReviews: updatedReviewCount,
        rating: Number(updatedRating.toFixed(1)),
      });

      setTechnician((prev: any) =>
        prev
          ? {
              ...prev,
              reviews: updatedReviews,
              reviewCount: updatedReviewCount,
              rating: Number(updatedRating.toFixed(1)),
            }
          : prev
      );

      setReviewSubmitted(true);
      setShowReviewForm(false);
      setNewReview({ rating: 0, comment: '', projectType: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-foreground mb-2" style={{ fontWeight: 600 }}>
            Loading professional...
          </h2>
          <p className="text-muted-foreground text-sm">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-foreground mb-2" style={{ fontWeight: 600 }}>
            Professional not found
          </h2>
          <Link to="/search" className="text-maroon hover:underline">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: 'Overview', icon: Briefcase },
    { key: 'portfolio', label: 'Portfolio', icon: FolderOpen },
    { key: 'education', label: 'Education', icon: GraduationCap },
    { key: 'reviews', label: `Reviews (${technician.reviewCount})`, icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors mb-4"
          style={{ fontWeight: 500 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="bg-gradient-to-br from-maroon to-maroon-dark py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <img
                src={
                  technician.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    technician.name
                  )}&background=6E1425&color=fff&size=200`
                }
                alt={technician.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white/20 shadow-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      technician.name
                    )}&background=6E1425&color=fff&size=200`;
                }}
              />
              {technician.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-gold rounded-full p-1.5 shadow-lg">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-white" style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                  {technician.name}
                </h1>
                {technician.isVerified && (
                  <span
                    className="bg-gold/20 border border-gold/40 text-gold text-xs px-2 py-0.5 rounded-full"
                    style={{ fontWeight: 600 }}
                  >
                    ✓ Verified
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    availabilityColors[
                      technician.availability as keyof typeof availabilityColors
                    ] || availabilityColors.Available
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  {technician.availability}
                </span>
              </div>

              <p className="text-gold text-lg mb-2" style={{ fontWeight: 600 }}>
                {technician.specialty}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{technician.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  <span>{technician.yearsExperience} years experience</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  <span style={{ fontWeight: 600 }}>
                    {Number(technician.rating || 0).toFixed(1)}
                  </span>
                  <span>({technician.reviewCount} reviews)</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 self-start">
              <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors">
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* keep your remaining UI exactly same below */}
    </div>
  );
}