import { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Calendar, Edit, CheckCircle, Save,
  Trash2, Plus, GraduationCap, Award, Briefcase, Image, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockTechnicians } from '../data/mockData';
import { SPECIALTIES } from '../types';

type EduType = 'degree' | 'certification' | 'training';

interface EduItem {
  id: string;
  degree: string;
  institution: string;
  year: number;
  type: EduType;
}

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  image: string;
  year: number;
  duration: string;
  value: string;
  category: string;
}

export function ProfilePage() {
  const { currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Grab initial tech data for state initialisation (safe even if currentUser is null)
  const initTech = currentUser?.role === 'technician'
    ? mockTechnicians.find(t => t.id === currentUser.id) || mockTechnicians[0]
    : null;

  // Education state
  const [eduItems, setEduItems] = useState<EduItem[]>(
    (initTech?.education as EduItem[]) || []
  );
  const [addingEdu, setAddingEdu] = useState(false);
  const [newEdu, setNewEdu] = useState({ degree: '', institution: '', year: '', type: 'degree' as EduType });

  // Portfolio state
  const [portfolioItems, setPortfolioItems] = useState<ProjectItem[]>(
    (initTech?.projects as ProjectItem[]) || []
  );
  const [addingProject, setAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', year: '', duration: '', value: '', category: '' });
  const portfolioImgRef = useRef<HTMLInputElement>(null);
  const [newProjectImg, setNewProjectImg] = useState<string>('');

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const techData = currentUser.role === 'technician'
    ? mockTechnicians.find(t => t.id === currentUser.id) || mockTechnicians[0]
    : null;

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Education helpers
  const addEdu = () => {
    if (!newEdu.degree || !newEdu.institution || !newEdu.year) return;
    setEduItems(prev => [...prev, {
      id: `edu-${Date.now()}`,
      degree: newEdu.degree,
      institution: newEdu.institution,
      year: Number(newEdu.year),
      type: newEdu.type,
    }]);
    setNewEdu({ degree: '', institution: '', year: '', type: 'degree' });
    setAddingEdu(false);
  };
  const removeEdu = (id: string) => setEduItems(prev => prev.filter(e => e.id !== id));

  // Portfolio helpers
  const handlePortfolioImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setNewProjectImg(URL.createObjectURL(file));
  };
  const addProject = () => {
    if (!newProject.title || !newProject.description) return;
    setPortfolioItems(prev => [...prev, {
      id: `proj-${Date.now()}`,
      title: newProject.title,
      description: newProject.description,
      image: newProjectImg || 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop',
      year: Number(newProject.year) || new Date().getFullYear(),
      duration: newProject.duration,
      value: newProject.value,
      category: newProject.category,
    }]);
    setNewProject({ title: '', description: '', year: '', duration: '', value: '', category: '' });
    setNewProjectImg('');
    setAddingProject(false);
  };
  const removeProject = (id: string) => setPortfolioItems(prev => prev.filter(p => p.id !== id));

  const inputClass = 'w-full px-4 py-2.5 rounded-lg border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon transition-colors placeholder-muted-foreground';

  const EDU_TYPE_LABELS: Record<EduType, string> = { degree: 'Degree', certification: 'Certification', training: 'Training' };
  const EDU_TYPE_COLORS: Record<EduType, string> = {
    degree: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    certification: 'bg-gold-light text-gold-dark border border-gold/20',
    training: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-maroon py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-white" style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Profile</h1>
          <p className="text-white/70 mt-1">Manage your personal information and account settings</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {saved && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span style={{ fontWeight: 500 }}>Profile updated successfully!</span>
          </div>
        )}

        {/* Avatar & Basic */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-maroon flex items-center justify-center overflow-hidden">
                {techData?.avatar ? (
                  <img src={techData.avatar} alt={currentUser.name} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <span className="text-white" style={{ fontSize: '2rem', fontWeight: 700 }}>{currentUser.name.charAt(0)}</span>
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 bg-gold rounded-full p-1.5 shadow">
                <Edit className="w-3 h-3 text-white" />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: '1.2rem' }}>{currentUser.name}</h2>
                  <p className="text-maroon text-sm capitalize" style={{ fontWeight: 500 }}>
                    {currentUser.role}{currentUser.specialty ? ` · ${currentUser.specialty}` : ''}
                  </p>
                  {currentUser.city && (
                    <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {currentUser.city}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => editing ? handleSave() : setEditing(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${editing ? 'bg-maroon text-white hover:bg-maroon-dark' : 'border border-border text-foreground hover:bg-muted'}`}
                  style={{ fontWeight: 500 }}
                >
                  {editing ? <><Save className="w-4 h-4" /> Save</> : <><Edit className="w-4 h-4" /> Edit</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-foreground mb-5" style={{ fontWeight: 600 }}>Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-foreground mb-1.5 flex items-center gap-1" style={{ fontWeight: 500 }}>
                <User className="w-3.5 h-3.5 text-maroon" /> Full Name
              </label>
              {editing ? <input type="text" defaultValue={currentUser.name} className={inputClass} /> : <p className="text-foreground text-sm py-2.5">{currentUser.name}</p>}
            </div>
            <div>
              <label className="text-sm text-foreground mb-1.5 flex items-center gap-1" style={{ fontWeight: 500 }}>
                <Mail className="w-3.5 h-3.5 text-maroon" /> Email
              </label>
              {editing ? <input type="email" defaultValue={currentUser.email} className={inputClass} /> : <p className="text-foreground text-sm py-2.5">{currentUser.email}</p>}
            </div>
            <div>
              <label className="text-sm text-foreground mb-1.5 flex items-center gap-1" style={{ fontWeight: 500 }}>
                <Phone className="w-3.5 h-3.5 text-maroon" /> Phone
              </label>
              {editing ? <input type="tel" defaultValue="+94 77 900 0011" className={inputClass} /> : <p className="text-foreground text-sm py-2.5">+94 77 900 0011</p>}
            </div>
            <div>
              <label className="text-sm text-foreground mb-1.5 flex items-center gap-1" style={{ fontWeight: 500 }}>
                <MapPin className="w-3.5 h-3.5 text-maroon" /> City
              </label>
              {editing ? <input type="text" defaultValue={currentUser.city} className={inputClass} /> : <p className="text-foreground text-sm py-2.5">{currentUser.city || '—'}</p>}
            </div>
          </div>
        </div>

        {/* Professional Info (technicians only) */}
        {currentUser.role === 'technician' && techData && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-foreground mb-5" style={{ fontWeight: 600 }}>Professional Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-foreground mb-1.5 block" style={{ fontWeight: 500 }}>Specialty</label>
                {editing ? (
                  <select defaultValue={techData.specialty} className={inputClass}>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : <p className="text-foreground text-sm py-2.5">{techData.specialty}</p>}
              </div>
              <div>
                <label className="text-sm text-foreground mb-1.5 block" style={{ fontWeight: 500 }}>Bio</label>
                {editing ? (
                  <textarea defaultValue={techData.bio} className={`${inputClass} resize-none`} rows={4} />
                ) : <p className="text-foreground text-sm py-2.5 leading-relaxed">{techData.bio}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-foreground mb-1.5 block" style={{ fontWeight: 500 }}>Years of Experience</label>
                  {editing ? (
                    <input type="number" defaultValue={techData.yearsExperience} className={inputClass} />
                  ) : <p className="text-foreground text-sm py-2.5">{techData.yearsExperience} years</p>}
                </div>
                <div>
                  <label className="text-sm text-foreground mb-1.5 block" style={{ fontWeight: 500 }}>Hourly Rate</label>
                  {editing ? (
                    <input type="text" defaultValue={techData.hourlyRate} className={inputClass} />
                  ) : <p className="text-foreground text-sm py-2.5">{techData.hourlyRate}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Education & Certifications (technicians only) */}
        {currentUser.role === 'technician' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-maroon" />
                <h3 className="text-foreground" style={{ fontWeight: 600 }}>Education & Certifications</h3>
              </div>
              {!addingEdu && (
                <button
                  onClick={() => setAddingEdu(true)}
                  className="flex items-center gap-1.5 text-sm text-maroon hover:text-maroon-dark border border-maroon/30 hover:border-maroon px-3 py-1.5 rounded-lg transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              )}
            </div>

            {/* Existing entries */}
            <div className="space-y-3 mb-4">
              {eduItems.length === 0 && !addingEdu && (
                <p className="text-muted-foreground text-sm text-center py-4">No education entries yet. Click Add to get started.</p>
              )}
              {eduItems.map(item => (
                <div key={item.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-maroon-light rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.type === 'degree' ? <GraduationCap className="w-4 h-4 text-maroon" /> :
                       item.type === 'certification' ? <Award className="w-4 h-4 text-gold" /> :
                       <CheckCircle className="w-4 h-4 text-green-600" />}
                    </div>
                    <div>
                      <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>{item.degree}</p>
                      <p className="text-muted-foreground text-xs">{item.institution} · {item.year}</p>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${EDU_TYPE_COLORS[item.type]}`}>
                        {EDU_TYPE_LABELS[item.type]}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => removeEdu(item.id)} className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0 mt-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new education form */}
            {addingEdu && (
              <div className="border border-maroon/20 bg-maroon-light rounded-xl p-4 space-y-3">
                <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Add Education / Certification</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-foreground mb-1 block" style={{ fontWeight: 500 }}>Degree / Certificate Name *</label>
                    <input
                      type="text"
                      value={newEdu.degree}
                      onChange={e => setNewEdu(p => ({ ...p, degree: e.target.value }))}
                      placeholder="e.g. Diploma in Civil Engineering"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground mb-1 block" style={{ fontWeight: 500 }}>Institution *</label>
                    <input
                      type="text"
                      value={newEdu.institution}
                      onChange={e => setNewEdu(p => ({ ...p, institution: e.target.value }))}
                      placeholder="e.g. University of Moratuwa"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground mb-1 block" style={{ fontWeight: 500 }}>Year *</label>
                    <input
                      type="number"
                      value={newEdu.year}
                      onChange={e => setNewEdu(p => ({ ...p, year: e.target.value }))}
                      placeholder="e.g. 2018"
                      className={inputClass}
                      min="1970"
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground mb-1 block" style={{ fontWeight: 500 }}>Type</label>
                    <select
                      value={newEdu.type}
                      onChange={e => setNewEdu(p => ({ ...p, type: e.target.value as EduType }))}
                      className={inputClass}
                    >
                      <option value="degree">Degree</option>
                      <option value="certification">Certification</option>
                      <option value="training">Training</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addEdu}
                    className="bg-maroon hover:bg-maroon-dark text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    Add Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingEdu(false); setNewEdu({ degree: '', institution: '', year: '', type: 'degree' }); }}
                    className="border border-border text-foreground hover:bg-muted px-4 py-2 rounded-lg text-sm transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Portfolio (technicians only) */}
        {currentUser.role === 'technician' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-maroon" />
                <h3 className="text-foreground" style={{ fontWeight: 600 }}>Portfolio Projects</h3>
              </div>
              {!addingProject && (
                <button
                  onClick={() => setAddingProject(true)}
                  className="flex items-center gap-1.5 text-sm text-maroon hover:text-maroon-dark border border-maroon/30 hover:border-maroon px-3 py-1.5 rounded-lg transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  <Plus className="w-4 h-4" /> Add Project
                </button>
              )}
            </div>

            {/* Existing projects */}
            <div className="space-y-4 mb-4">
              {portfolioItems.length === 0 && !addingProject && (
                <p className="text-muted-foreground text-sm text-center py-4">No portfolio projects yet. Click Add Project to showcase your work.</p>
              )}
              {portfolioItems.map(proj => (
                <div key={proj.id} className="flex gap-4 p-3 rounded-lg border border-border bg-muted/30 group">
                  <img
                    src={proj.image}
                    alt={proj.title}
                    className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=200&h=150&fit=crop'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>{proj.title}</p>
                      <button onClick={() => removeProject(proj.id)} className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{proj.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                      {proj.year && <span>{proj.year}</span>}
                      {proj.duration && <span>· {proj.duration}</span>}
                      {proj.value && <span className="text-gold" style={{ fontWeight: 500 }}>{proj.value}</span>}
                      {proj.category && <span className="bg-maroon-light text-maroon px-2 py-0.5 rounded-full">{proj.category}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new project form */}
            {addingProject && (
              <div className="border border-maroon/20 bg-maroon-light rounded-xl p-4 space-y-3">
                <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Add Portfolio Project</p>

                {/* Image upload */}
                <div>
                  <label className="text-xs text-foreground mb-1 block" style={{ fontWeight: 500 }}>Project Image</label>
                  <input ref={portfolioImgRef} type="file" accept="image/*" className="hidden" onChange={handlePortfolioImg} />
                  {newProjectImg ? (
                    <div className="relative w-full h-36 rounded-lg overflow-hidden border border-border">
                      <img src={newProjectImg} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewProjectImg('')}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => portfolioImgRef.current?.click()}
                      className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-maroon/40 transition-colors text-muted-foreground text-sm"
                    >
                      <Image className="w-4 h-4" /> Click to upload project image
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-foreground mb-1 block" style={{ fontWeight: 500 }}>Project Title *</label>
                    <input
                      type="text"
                      value={newProject.title}
                      onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. 3BHK Villa Construction"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-foreground mb-1 block" style={{ fontWeight: 500 }}>Description *</label>
                    <textarea
                      value={newProject.description}
                      onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                      placeholder="Describe the project scope and your contribution..."
                      className={`${inputClass} resize-none`}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground mb-1 block" style={{ fontWeight: 500 }}>Year</label>
                    <input
                      type="number"
                      value={newProject.year}
                      onChange={e => setNewProject(p => ({ ...p, year: e.target.value }))}
                      placeholder={String(new Date().getFullYear())}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground mb-1 block" style={{ fontWeight: 500 }}>Duration</label>
                    <input
                      type="text"
                      value={newProject.duration}
                      onChange={e => setNewProject(p => ({ ...p, duration: e.target.value }))}
                      placeholder="e.g. 3 months"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground mb-1 block" style={{ fontWeight: 500 }}>Project Value</label>
                    <input
                      type="text"
                      value={newProject.value}
                      onChange={e => setNewProject(p => ({ ...p, value: e.target.value }))}
                      placeholder="e.g. ₹12 Lakhs"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground mb-1 block" style={{ fontWeight: 500 }}>Category</label>
                    <input
                      type="text"
                      value={newProject.category}
                      onChange={e => setNewProject(p => ({ ...p, category: e.target.value }))}
                      placeholder="e.g. Residential"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addProject}
                    className="bg-maroon hover:bg-maroon-dark text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    Add Project
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingProject(false); setNewProject({ title: '', description: '', year: '', duration: '', value: '', category: '' }); setNewProjectImg(''); }}
                    className="border border-border text-foreground hover:bg-muted px-4 py-2 rounded-lg text-sm transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Account Info */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-foreground mb-4" style={{ fontWeight: 600 }}>Account</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-maroon" />
            <span>Member since June 2024</span>
          </div>
        </div>

        {editing && (
          <div className="flex gap-3">
            <button onClick={handleSave} className="flex-1 bg-maroon hover:bg-maroon-dark text-white py-3 rounded-xl transition-colors" style={{ fontWeight: 600 }}>
              Save Changes
            </button>
            <button onClick={() => setEditing(false)} className="px-5 py-3 border border-border text-foreground hover:bg-muted rounded-xl text-sm transition-colors" style={{ fontWeight: 500 }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}