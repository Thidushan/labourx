import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Briefcase,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  ArrowLeft,
  Clock,
  Award,
  GraduationCap,
  FolderOpen,
  MessageSquare,
  Calendar,
  DollarSign,
  Share2,
  Bookmark,
  AlertCircle,
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
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: '',
    projectType: '',
  });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const [technician, setTechnician] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasWorkedTogether, setHasWorkedTogether] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const isClient = currentUser?.role === 'user';
  const isTechnician = currentUser?.role === 'technician';

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

        const resolvedLocationText =
          String(data.locationText || '').trim() ||
          String(data.location || '').trim() ||
          String(data.city || '').trim() ||
          'Location not specified';

        const resolvedHourlyRate =
          String(data.hourlyRate || '').trim() ||
          String(data.wage || '').trim() ||
          String(data.wages || '').trim() ||
          'Contact for pricing';

        const techData = {
  id: techSnap.id,
  name: data.name || 'Unknown Professional',
  email: data.email || '',
  phone: data.phone || '',
  specialty: data.specialty || 'Professional',
  location:
    data.locationText ||
    data.locationName ||
    data.address ||
    data.location ||
    data.city ||
    'Location not specified',
  city: data.city || '',
  avatar: data.avatar || data.photoURL || '',
  role: data.role || 'technician',
  bio: data.bio || 'No bio added yet.',
  yearsExperience: Number(data.yearsExperience || 0),
  rating: Number(data.rating || 0),
  reviewCount: Number(data.totalReviews || data.reviewCount || 0),
  skills: Array.isArray(data.skills) ? data.skills : [],
  certifications: Array.isArray(data.certifications)
    ? data.certifications
    : [],
  education: Array.isArray(data.education) ? data.education : [],
  projects: Array.isArray(data.projects) ? data.projects : [],
  reviews: Array.isArray(data.reviews) ? data.reviews : [],
  availability: data.availability || 'Available',
  hourlyRate:
    data.hourlyRate ||
    data.wages ||
    data.wage ||
    data.price ||
    data.rate ||
    'Contact for pricing',
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
              bids.some(
                (b: any) => b.technicianId === techSnap.id && b.isSelected
              )
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
    if (!isClient || !hasWorkedTogether) return;

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

  const safeAvailability =
    technician?.availability &&
    availabilityColors[
      technician.availability as keyof typeof availabilityColors
    ]
      ? technician.availability
      : 'Available';

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !isClient || !technician || !id || !hasWorkedTogether) {
      return;
    }

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
        userName: currentUser.name || 'Anonymous User',
        userAvatar:
          (currentUser as any)?.avatar || (currentUser as any)?.photoURL || '',
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        date: new Date().toISOString(),
        projectType: newReview.projectType.trim(),
      };

      const existingReviews = Array.isArray(technician.reviews)
        ? technician.reviews
        : [];
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
              totalReviews: updatedReviewCount,
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

  const tabs: {
    key: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: 'overview', label: 'Overview', icon: Briefcase },
    { key: 'portfolio', label: 'Portfolio', icon: FolderOpen },
    { key: 'education', label: 'Education', icon: GraduationCap },
    {
      key: 'reviews',
      label: `Reviews (${technician.reviewCount})`,
      icon: MessageSquare,
    },
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
                    technician.name || 'Professional'
                  )}&background=6E1425&color=fff&size=200`
                }
                alt={technician.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white/20 shadow-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      technician.name || 'Professional'
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
                <h1
                  className="text-white"
                  style={{ fontSize: '1.75rem', fontWeight: 700 }}
                >
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
                      safeAvailability as keyof typeof availabilityColors
                    ]
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  {safeAvailability}
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
              <button
                type="button"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 bg-white/10 rounded-xl p-4">
            <div className="text-center">
              <p
                className="text-white"
                style={{ fontWeight: 700, fontSize: '1.5rem' }}
              >
                {technician.completedProjects}
              </p>
              <p className="text-white/70 text-xs">Projects Done</p>
            </div>
            <div className="text-center border-x border-white/20">
              <p
                className="text-white"
                style={{ fontWeight: 700, fontSize: '1.5rem' }}
              >
                {Number(technician.rating || 0).toFixed(1)}
              </p>
              <p className="text-white/70 text-xs">Avg Rating</p>
            </div>
            <div className="text-center">
              <p
                className="text-white"
                style={{ fontWeight: 700, fontSize: '1.5rem' }}
              >
                {technician.yearsExperience}yr
              </p>
              <p className="text-white/70 text-xs">Experience</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex border-b border-border mb-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-maroon text-maroon'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3
                    className="text-foreground mb-3"
                    style={{ fontWeight: 600 }}
                  >
                    About
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {technician.bio}
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <h3
                    className="text-foreground mb-3"
                    style={{ fontWeight: 600 }}
                  >
                    Skills & Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {technician.skills.length > 0 ? (
                      technician.skills.map((skill: string) => (
                        <span
                          key={skill}
                          className="text-sm px-3 py-1 rounded-full bg-maroon-light text-maroon border border-maroon/10"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No skills added yet.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <h3
                    className="text-foreground mb-3"
                    style={{ fontWeight: 600 }}
                  >
                    Certifications
                  </h3>
                  <div className="space-y-2">
                    {technician.certifications.length > 0 ? (
                      technician.certifications.map(
                        (cert: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm text-card-foreground"
                          >
                            <Award className="w-4 h-4 text-gold flex-shrink-0" />
                            {cert}
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No certifications added yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="space-y-5">
                {technician.projects.length > 0 ? (
                  technician.projects.map((project: any, index: number) => (
                    <div
                      key={project.id || index}
                      className="bg-card border border-border rounded-xl overflow-hidden"
                    >
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img
                          src={
                            project.image ||
                            `https://placehold.co/1200x675?text=Project`
                          }
                          alt={project.title || 'Project'}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3
                            className="text-card-foreground"
                            style={{ fontWeight: 600 }}
                          >
                            {project.title || 'Untitled Project'}
                          </h3>
                          {project.category && (
                            <span className="text-xs px-2 py-1 rounded-full bg-maroon-light text-maroon flex-shrink-0">
                              {project.category}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                          {project.description || 'No description added.'}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {project.year && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-maroon" />
                              <span>{project.year}</span>
                            </div>
                          )}
                          {project.duration && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-maroon" />
                              <span>{project.duration}</span>
                            </div>
                          )}
                          {project.value && (
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-gold" />
                              <span
                                style={{ fontWeight: 600 }}
                                className="text-gold"
                              >
                                {project.value}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <p className="text-muted-foreground text-sm">
                      No portfolio projects added yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-4">
                {technician.education.length > 0 ? (
                  technician.education.map((edu: any, index: number) => (
                    <div
                      key={edu.id || index}
                      className="bg-card border border-border rounded-xl p-5 flex gap-4"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          edu.type === 'degree'
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            : edu.type === 'certification'
                            ? 'bg-gold/10 text-gold'
                            : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        <GraduationCap className="w-5 h-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p
                              style={{ fontWeight: 600 }}
                              className="text-card-foreground"
                            >
                              {edu.degree || 'Qualification'}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {edu.institution || 'Institution'}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm text-muted-foreground">
                              {edu.year || ''}
                            </span>
                            {edu.type && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                                  edu.type === 'degree'
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                    : edu.type === 'certification'
                                    ? 'bg-gold/10 text-gold border border-gold/20'
                                    : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                }`}
                              >
                                {edu.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <p className="text-muted-foreground text-sm">
                      No education details added yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-5">
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row gap-5 items-center">
                  <div className="text-center">
                    <p
                      className="text-foreground"
                      style={{
                        fontSize: '3rem',
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      {Number(technician.rating || 0).toFixed(1)}
                    </p>
                    <StarRating rating={technician.rating} size="md" />
                    <p className="text-muted-foreground text-sm mt-1">
                      {technician.reviewCount} reviews
                    </p>
                  </div>

                  <div className="flex-1 w-full space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = technician.reviews.filter(
                        (r: any) => Number(r.rating) === star
                      ).length;
                      const total = Math.max(
                        technician.reviewCount || 0,
                        technician.reviews.length || 0
                      );
                      const pct = total > 0 ? (count / total) * 100 : 0;

                      return (
                        <div
                          key={star}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="text-muted-foreground w-4">
                            {star}
                          </span>
                          <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                          <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gold h-full rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground w-5">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {isClient && !reviewSubmitted && (
                  <button
                    onClick={() => {
                      if (hasWorkedTogether) {
                        setShowReviewForm(!showReviewForm);
                      }
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-xl text-sm transition-colors ${
                      hasWorkedTogether
                        ? 'border-maroon/30 text-maroon hover:bg-maroon-light'
                        : 'border-muted text-muted-foreground cursor-not-allowed opacity-70'
                    }`}
                    style={{ fontWeight: 500 }}
                    disabled={!hasWorkedTogether}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {hasWorkedTogether
                      ? 'Write a Review'
                      : 'Write a Review (requires completed project)'}
                  </button>
                )}

                {reviewSubmitted && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm" style={{ fontWeight: 500 }}>
                      Your review has been submitted!
                    </span>
                  </div>
                )}

                {showReviewForm && isClient && hasWorkedTogether && (
                  <form
                    id="review-form"
                    onSubmit={handleSubmitReview}
                    className="bg-card border border-border rounded-xl p-5 space-y-4"
                  >
                    <h3 className="text-foreground" style={{ fontWeight: 600 }}>
                      Write Your Review
                    </h3>

                    <div>
                      <label
                        className="text-sm text-foreground mb-2 block"
                        style={{ fontWeight: 500 }}
                      >
                        Rating
                      </label>
                      <StarRating
                        rating={newReview.rating}
                        size="lg"
                        interactive
                        onRate={(r: number) =>
                          setNewReview((prev) => ({ ...prev, rating: r }))
                        }
                      />
                    </div>

                    <div>
                      <label
                        className="text-sm text-foreground mb-1.5 block"
                        style={{ fontWeight: 500 }}
                      >
                        Project Type
                      </label>
                      <input
                        type="text"
                        value={newReview.projectType}
                        onChange={(e) =>
                          setNewReview((prev) => ({
                            ...prev,
                            projectType: e.target.value,
                          }))
                        }
                        placeholder="e.g. Home Construction, Kitchen Renovation"
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30"
                        required
                      />
                    </div>

                    <div>
                      <label
                        className="text-sm text-foreground mb-1.5 block"
                        style={{ fontWeight: 500 }}
                      >
                        Your Review
                      </label>
                      <textarea
                        value={newReview.comment}
                        onChange={(e) =>
                          setNewReview((prev) => ({
                            ...prev,
                            comment: e.target.value,
                          }))
                        }
                        placeholder="Share your experience with this professional..."
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30 resize-none"
                        rows={4}
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="flex-1 bg-maroon text-white py-2.5 rounded-lg text-sm hover:bg-maroon-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ fontWeight: 600 }}
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-4 py-2.5 rounded-lg text-sm border border-border hover:bg-muted transition-colors text-foreground"
                        style={{ fontWeight: 500 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {!currentUser && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <div>
                        <h3
                          className="text-foreground text-sm mb-1"
                          style={{ fontWeight: 600 }}
                        >
                          Sign in to review
                        </h3>
                        <p className="text-muted-foreground text-sm mb-3">
                          Only registered clients can post reviews.
                        </p>
                        <Link
                          to="/login"
                          className="inline-flex items-center justify-center gap-2 border border-maroon text-maroon hover:bg-maroon-light px-4 py-2 rounded-lg text-sm transition-colors"
                          style={{ fontWeight: 500 }}
                        >
                          Sign In
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {isTechnician && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <div>
                        <h3
                          className="text-foreground text-sm mb-1"
                          style={{ fontWeight: 600 }}
                        >
                          Reviews are for clients only
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Only registered clients can post reviews for professionals.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {technician.reviews.length > 0 ? (
                    technician.reviews.map((review: any) => (
                      <ReviewCard key={review.id} review={review} />
                    ))
                  ) : (
                    <div className="bg-card border border-border rounded-xl p-5">
                      <p className="text-muted-foreground text-sm">
                        No reviews yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-72 space-y-5 flex-shrink-0">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-foreground mb-4" style={{ fontWeight: 600 }}>
                Contact Information
              </h3>

              <div className="space-y-3">
                {technician.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-maroon-light rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-maroon" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Phone</p>
                      <a
                        href={`tel:${technician.phone}`}
                        className="text-foreground hover:text-maroon transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        {technician.phone}
                      </a>
                    </div>
                  </div>
                )}

                {technician.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-maroon-light rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-maroon" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Email</p>
                      <a
                        href={`mailto:${technician.email}`}
                        className="text-foreground hover:text-maroon transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        {technician.email}
                      </a>
                    </div>
                  </div>
                )}

                {technician.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-maroon-light rounded-lg flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4 text-maroon" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Website</p>
                      <a
                        href={
                          technician.website.startsWith('http')
                            ? technician.website
                            : `https://${technician.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-maroon transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        {technician.website}
                      </a>
                    </div>
                  </div>
                )}

                {technician.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-maroon-light rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-maroon" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Location</p>
                      <p
                        className="text-foreground"
                        style={{ fontWeight: 500 }}
                      >
                        {technician.location}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {technician.phone && (
                <a
                  href={`tel:${technician.phone}`}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-maroon hover:bg-maroon-dark text-white py-2.5 rounded-lg text-sm transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </a>
              )}
            </div>

            {isClient && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-foreground mb-2" style={{ fontWeight: 600 }}>
                  Review this Professional
                </h3>

                {hasWorkedTogether ? (
                  <>
                    <p className="text-muted-foreground text-xs mb-3">
                      You have a project with {technician.name.split(' ')[0]}. Share your experience to help others.
                    </p>

                    {reviewSubmitted ? (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span style={{ fontWeight: 500 }}>
                          Review submitted!
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={openReviewForm}
                        className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-dark text-white py-2.5 rounded-lg text-sm transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Review Work
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-xs mb-3">
                      Only clients who completed a project with this professional can post a review.
                    </p>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-gold-light border border-gold/20">
                      <AlertCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        Post a job, select {technician.name.split(' ')[0]}'s bid, and complete the project to unlock reviews.
                      </p>
                    </div>

                    <button
                      disabled
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-muted text-muted-foreground py-2.5 rounded-lg text-sm cursor-not-allowed opacity-60"
                      style={{ fontWeight: 500 }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Review Work
                    </button>
                  </>
                )}
              </div>
            )}

            {!currentUser && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-foreground mb-2" style={{ fontWeight: 600 }}>
                  Review this Professional
                </h3>
                <p className="text-muted-foreground text-xs mb-3">
                  Only registered clients can post reviews.
                </p>
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 border border-maroon text-maroon hover:bg-maroon-light py-2.5 rounded-lg text-sm transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Sign In to Review
                </Link>
              </div>
            )}

            {isTechnician && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-foreground mb-2" style={{ fontWeight: 600 }}>
                  Review this Professional
                </h3>
                <p className="text-muted-foreground text-xs">
                  Only registered clients can post reviews for professionals.
                </p>
              </div>
            )}

            <div className="bg-gold-light border border-gold/20 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Hourly Rate</p>
                  <p
                    className="text-gold"
                    style={{ fontWeight: 700, fontSize: '1.2rem' }}
                  >
                    {technician.hourlyRate}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Final pricing may vary by project scope. Request a detailed
                quote.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}