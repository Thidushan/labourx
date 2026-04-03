import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, MapPin, DollarSign, Clock, Tag, Image, CheckCircle, X } from 'lucide-react';
import { SPECIALTIES } from '../types';
import { useAuth } from '../context/AuthContext';

export function CreatePostPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    city: '',
    budgetMin: '',
    budgetMax: '',
    timeline: '',
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-foreground mb-2" style={{ fontWeight: 700 }}>Sign in to Post a Job</h2>
          <p className="text-muted-foreground mb-4">You need to be signed in as a client to post work.</p>
          <Link to="/login" className="bg-maroon text-white px-5 py-2.5 rounded-xl text-sm hover:bg-maroon-dark transition-colors" style={{ fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    );
  }

  if (currentUser.role === 'technician') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-foreground mb-2" style={{ fontWeight: 700 }}>Only Clients Can Post Jobs</h2>
          <p className="text-muted-foreground mb-4">As a professional, you can browse and bid on existing posts.</p>
          <Link to="/posts" className="bg-maroon text-white px-5 py-2.5 rounded-xl text-sm hover:bg-maroon-dark transition-colors" style={{ fontWeight: 600 }}>Browse Posts</Link>
        </div>
      </div>
    );
  }

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-foreground mb-3" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Post Published!</h2>
          <p className="text-muted-foreground mb-2">Your job post "<span style={{ fontWeight: 600 }} className="text-foreground">{form.title}</span>" is now live.</p>
          <p className="text-muted-foreground text-sm mb-6">Relevant professionals will be notified and can start submitting bids. You'll be notified when bids are received.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/posts" className="bg-maroon hover:bg-maroon-dark text-white px-5 py-2.5 rounded-xl text-sm transition-colors" style={{ fontWeight: 600 }}>View All Posts</Link>
            <Link to="/dashboard" className="border border-border text-foreground hover:bg-muted px-5 py-2.5 rounded-xl text-sm transition-colors" style={{ fontWeight: 500 }}>Go to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 5 - selectedFiles.length);
      setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon transition-colors text-sm";
  const labelClass = "block text-sm text-foreground mb-1.5";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-maroon py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-3 transition-colors" style={{ fontWeight: 500 }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white" style={{ fontSize: '1.75rem', fontWeight: 700 }}>Post a Job</h1>
          <p className="text-white/70 mt-1">Describe your project and receive bids from verified professionals</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="w-5 h-5 text-maroon" />
              <h2 className="text-foreground" style={{ fontWeight: 600 }}>Project Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>Project Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => update('title', e.target.value)}
                  placeholder="e.g. Need to build a house in Rajagiriya, Colombo"
                  className={inputClass}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Be specific — a clear title attracts better bids</p>
              </div>
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>
                  <Tag className="w-3.5 h-3.5 inline mr-1 text-maroon" />
                  Category / Specialty Required *
                </label>
                <select value={form.category} onChange={e => update('category', e.target.value)} className={inputClass} required>
                  <option value="">Select the type of professional you need</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>Project Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  placeholder="Describe your project in detail: what needs to be done, current state, materials preferences, special requirements, etc."
                  className={`${inputClass} resize-none`}
                  rows={5}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">More details = better quality bids. Aim for at least 100 words.</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="w-5 h-5 text-maroon" />
              <h2 className="text-foreground" style={{ fontWeight: 600 }}>Location</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>Area / Locality *</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => update('location', e.target.value)}
                  placeholder="e.g. Nawala"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>City *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => update('city', e.target.value)}
                  placeholder="e.g. Colombo"
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
              <h2 className="text-foreground" style={{ fontWeight: 600 }}>Budget & Timeline</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>Minimum Budget (Rs.) *</label>
                <input
                  type="number"
                  value={form.budgetMin}
                  onChange={e => update('budgetMin', e.target.value)}
                  placeholder="e.g. 500000"
                  className={inputClass}
                  required
                  min="0"
                />
              </div>
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>Maximum Budget (Rs.) *</label>
                <input
                  type="number"
                  value={form.budgetMax}
                  onChange={e => update('budgetMax', e.target.value)}
                  placeholder="e.g. 800000"
                  className={inputClass}
                  required
                  min="0"
                />
              </div>
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>
                  <Clock className="w-3.5 h-3.5 inline mr-1 text-maroon" />
                  Expected Timeline *
                </label>
                <input
                  type="text"
                  value={form.timeline}
                  onChange={e => update('timeline', e.target.value)}
                  placeholder="e.g. 3-4 weeks"
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>

          {/* Images (placeholder) */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-5 h-5 text-maroon" />
              <h2 className="text-foreground" style={{ fontWeight: 600 }}>Reference Images (Optional)</h2>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-maroon/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                Drag & drop images or{' '}
                <span className="text-maroon hover:underline cursor-pointer" style={{ fontWeight: 500 }}>
                  browse files
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB each (max 5 images)</p>
            </div>

            {/* Preview selected files */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-border aspect-video bg-muted">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-maroon hover:bg-maroon-dark disabled:opacity-60 text-white py-3 rounded-xl transition-colors"
              style={{ fontWeight: 700 }}
            >
              {loading ? 'Publishing...' : 'Publish Job Post'}
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

          <p className="text-xs text-muted-foreground text-center">
            By posting, you agree to our Terms of Service. Your post will be visible to professionals relevant to your selected category.
          </p>
        </form>
      </div>
    </div>
  );
}