import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, FileText, MapPin, DollarSign, Clock, Tag, CheckCircle, Image, X } from 'lucide-react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { SPECIALTIES } from '../types';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../../firebase/config';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [postExists, setPostExists] = useState(true);
  const [postOwnerId, setPostOwnerId] = useState<string | null>(null);

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
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
        setExistingImages(Array.isArray(data.images) ? data.images : []);
        setRemovedImages([]);

        setForm({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          location: data.area || '',
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

  const validateFiles = (files: File[]) => {
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`"${file.name}" is not a supported image type. Please upload PNG or JPG files only.`);
        return false;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" is too large. Maximum size is 10MB per image.`);
        return false;
      }
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = e.target.files ? Array.from(e.target.files) : [];
    if (incoming.length === 0) return;

    if (!validateFiles(incoming)) {
      e.target.value = '';
      return;
    }

    const currentCount = existingImages.length + selectedFiles.length;
    const remainingSlots = MAX_FILES - currentCount;

    if (remainingSlots <= 0) {
      alert(`You can upload a maximum of ${MAX_FILES} images.`);
      e.target.value = '';
      return;
    }

    const nextFiles = incoming.slice(0, remainingSlots);
    setSelectedFiles((prev) => [...prev, ...nextFiles]);

    if (incoming.length > remainingSlots) {
      alert(`Only ${MAX_FILES} images are allowed. Extra files were ignored.`);
    }

    e.target.value = '';
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => {
      const imageToRemove = prev[index];

      if (imageToRemove) {
        setRemovedImages((removed) =>
          removed.includes(imageToRemove) ? removed : [...removed, imageToRemove]
        );
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async () => {
    if (selectedFiles.length === 0) return [];

    const uploadPromises = selectedFiles.map(async (file, index) => {
      const safeName = file.name.replace(/\s+/g, '-');
      const fileRef = ref(
        storage,
        `posts/${currentUser.uid}/${Date.now()}-${index}-${safeName}`
      );

      await uploadBytes(fileRef, file);
      return getDownloadURL(fileRef);
    });

    return Promise.all(uploadPromises);
  };

  const deleteRemovedImagesFromStorage = async () => {
    if (removedImages.length === 0) return;

    await Promise.all(
      removedImages.map(async (imageUrl) => {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting image from storage:', imageUrl, error);
          throw error;
        }
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    if (Number(form.budgetMin) > Number(form.budgetMax)) {
      alert('Minimum budget cannot be greater than maximum budget.');
      return;
    }

    if (existingImages.length + selectedFiles.length > MAX_FILES) {
      alert(`You can upload a maximum of ${MAX_FILES} images.`);
      return;
    }

    try {
      setLoading(true);

      const uploadedImageUrls = await uploadNewImages();
      const finalImages = [...existingImages, ...uploadedImageUrls];

      await deleteRemovedImagesFromStorage();

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
        images: finalImages,
        updatedAt: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (error: any) {
      console.error('Error updating post:', error);

      if (error?.code?.includes('storage')) {
        alert('Image upload or delete failed. Please check Firebase Storage rules and try again.');
      } else {
        alert('Failed to update post. Please try again.');
      }
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

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-5 h-5 text-maroon" />
              <h2 className="text-foreground" style={{ fontWeight: 600 }}>Reference Images (Optional)</h2>
            </div>

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

            {(existingImages.length > 0 || selectedFiles.length > 0) && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {existingImages.map((imageUrl, i) => (
                  <div key={`existing-${i}`} className="relative group rounded-lg overflow-hidden border border-border aspect-video bg-muted">
                    <img
                      src={imageUrl}
                      alt={`Existing ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(i)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {selectedFiles.map((file, i) => (
                  <div key={`new-${i}`} className="relative group rounded-lg overflow-hidden border border-border aspect-video bg-muted">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(i)}
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