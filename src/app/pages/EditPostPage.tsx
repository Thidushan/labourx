import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, FileText, MapPin, DollarSign, Clock, Tag, CheckCircle } from 'lucide-react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { SPECIALTIES } from '../types';
import { useAuth } from '../context/AuthContext';
import { db } from '../../firebase/config';

export function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [postExists, setPostExists] = useState(true);
  const [postOwnerId, setPostOwnerId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    city: '',
    budgetMin: '',
    budgetMax: '',
    timeline: '',
    status: 'open',
  });

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setPostExists(false);
        setLoadingPost(false);
        return;
      }

      try {
        setLoadingPost(true);

        const postRef = doc(db, 'posts', id);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
          setPostExists(false);
          return;
        }

        const data = postSnap.data();

        setPostOwnerId(data.userId || null);

        setForm({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          location: data.area || data.location || '',
          city: data.city || data.userCity || '',
          budgetMin:
            data.budgetMin !== undefined && data.budgetMin !== null
              ? String(data.budgetMin)
              : '',
          budgetMax:
            data.budgetMax !== undefined && data.budgetMax !== null
              ? String(data.budgetMax)
              : '',
          timeline: data.timeline || '',
          status: data.status || 'open',
        });
      } catch (error) {
        console.error('Error loading post:', error);
        setPostExists(false);
      } finally {
        setLoadingPost(false);
      }
    };

    fetchPost();
  }, [id]);

  if (!currentUser) return <Navigate to="/login" replace />;

  if (loadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-foreground mb-2" style={{ fontWeight: 700 }}>
            Loading post...
          </h2>
        </div>
      </div>
    );
  }

  if (!postExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-foreground mb-2" style={{ fontWeight: 700 }}>
            Post not found
          </h2>
          <Link to="/posts" className="text-maroon hover:underline">
            Back to Posts
          </Link>
        </div>
      </div>
    );
  }

  if (currentUser.uid !== postOwnerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-foreground mb-2" style={{ fontWeight: 700 }}>
            Not Authorized
          </h2>
          <p className="text-muted-foreground mb-4">
            You can only edit your own posts.
          </p>
          <Link to="/posts" className="text-maroon hover:underline">
            Back to Posts
          </Link>
        </div>
      </div>
    );
  }

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    if (Number(form.budgetMin) > Number(form.budgetMax)) {
      alert('Minimum budget cannot be greater than maximum budget.');
      return;
    }

    try {
      setLoading(true);

      await updateDoc(doc(db, 'posts', id), {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        location: `${form.location.trim()}, ${form.city.trim()}`,
        area: form.location.trim(),
        city: form.city.trim(),
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
        timeline: form.timeline.trim(),
        status: form.status,
        updatedAt: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 dark:bg-green-900/30">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2
            className="text-foreground mb-3"
            style={{ fontSize: '1.5rem', fontWeight: 700 }}
          >
            Post Updated!
          </h2>
          <p className="text-muted-foreground mb-6">
            Your changes to "
            <span style={{ fontWeight: 600 }} className="text-foreground">
              {form.title}
            </span>
            " have been saved successfully.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to={`/posts/${id}`}
              className="bg-maroon hover:bg-maroon-dark text-white px-5 py-2.5 rounded-xl text-sm transition-colors"
              style={{ fontWeight: 600 }}
            >
              View Post
            </Link>
            <Link
              to="/my-projects"
              className="border border-border text-foreground hover:bg-muted px-5 py-2.5 rounded-xl text-sm transition-colors"
              style={{ fontWeight: 500 }}
            >
              My Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon transition-colors text-sm';
  const labelClass = 'block text-sm text-foreground mb-1.5';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-maroon py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-3 transition-colors"
            style={{ fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white" style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            Edit Job Post
          </h1>
          <p className="text-white/70 mt-1">
            Update the details of your project listing
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status */}
          <div className="bg-card border border-border rounded-xl p-5">
            <label
              className={`${labelClass} flex items-center gap-1`}
              style={{ fontWeight: 600 }}
            >
              Post Status
            </label>
            <div className="flex gap-3 mt-1">
              {(['open', 'in-progress', 'closed'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update('status', s)}
                  className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors border ${
                    form.status === s
                      ? 'bg-maroon text-white border-maroon'
                      : 'border-border text-foreground hover:bg-muted'
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Project Details */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="w-5 h-5 text-maroon" />
              <h2 className="text-foreground" style={{ fontWeight: 600 }}>
                Project Details
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>
                  Project Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>
                  <Tag className="w-3.5 h-3.5 inline mr-1 text-maroon" />
                  Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Select category</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>
                  Project Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  className={`${inputClass} resize-none`}
                  rows={5}
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="w-5 h-5 text-maroon" />
              <h2 className="text-foreground" style={{ fontWeight: 600 }}>
                Location
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>
                  Area / Locality *
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>
                  City *
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>

          {/* Budget & Timeline */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <DollarSign className="w-5 h-5 text-gold" />
              <h2 className="text-foreground" style={{ fontWeight: 600 }}>
                Budget & Timeline
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>
                  Min Budget (Rs.) *
                </label>
                <input
                  type="number"
                  value={form.budgetMin}
                  onChange={(e) => update('budgetMin', e.target.value)}
                  className={inputClass}
                  required
                  min="0"
                />
              </div>
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>
                  Max Budget (Rs.) *
                </label>
                <input
                  type="number"
                  value={form.budgetMax}
                  onChange={(e) => update('budgetMax', e.target.value)}
                  className={inputClass}
                  required
                  min="0"
                />
              </div>
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>
                  <Clock className="w-3.5 h-3.5 inline mr-1 text-maroon" />
                  Timeline *
                </label>
                <input
                  type="text"
                  value={form.timeline}
                  onChange={(e) => update('timeline', e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-maroon hover:bg-maroon-dark disabled:opacity-60 text-white py-3 rounded-xl transition-colors"
              style={{ fontWeight: 700 }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-3 border border-border text-foreground hover:bg-muted rounded-xl text-sm transition-colors"
              style={{ fontWeight: 500 }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}