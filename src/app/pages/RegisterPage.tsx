import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HardHat,
  User,
  Wrench,
  Eye,
  EyeOff,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
} from 'lucide-react';

import { SPECIALTIES } from '../types';
import { registerUser } from '../../firebase/authService';

type Role = 'user' | 'technician';

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  age: string;
  address: string;
  city: string;
  specialty: string;
  yearsExperience: string;
  bio: string;
}

export function RegisterPage() {
  const [role, setRole] = useState<Role>('user');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    age: '',
    address: '',
    city: '',
    specialty: '',
    yearsExperience: '',
    bio: '',
  });

  const update = (field: keyof RegisterForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateStepTwo = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.city.trim()) {
      alert('Please fill all required fields');
      return false;
    }

    if (!form.password || form.password.length < 8) {
      alert('Password must be at least 8 characters');
      return false;
    }

    if (form.age && Number(form.age) < 1) {
      alert('Please enter a valid age');
      return false;
    }

    return true;
  };

  const validateTechnicianFields = () => {
    if (!form.specialty || !form.yearsExperience || !form.bio.trim()) {
      alert('Please complete all professional details');
      return false;
    }

    if (Number(form.yearsExperience) < 1) {
      alert('Years of experience must be at least 1');
      return false;
    }

    return true;
  };

  const handleContinueFromStepTwo = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStepTwo()) return;

    if (role === 'user') {
      handleRegister(e);
      return;
    }

    setStep(3);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStepTwo()) return;

    if (role === 'technician' && !validateTechnicianFields()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        bio: form.bio.trim(),
        age: form.age.trim(),
        yearsExperience: form.yearsExperience.trim(),
      };

      await registerUser(role, payload);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.code === 'auth/email-already-in-use') {
        alert('Email already exists');
      } else if (error.code === 'auth/invalid-email') {
        alert('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        alert('Password is too weak');
      } else {
        alert(error.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg border border-border bg-input-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon transition-colors text-sm';

  const labelClass = 'block text-sm text-foreground mb-1.5';

  return (
    <div className="min-h-screen bg-maroon-light flex items-center justify-center py-12 px-4">
      <button
        onClick={() => (step === 1 ? navigate(-1) : setStep((s) => s - 1))}
        className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-maroon hover:text-maroon-dark transition-colors text-sm"
        style={{ fontWeight: 500 }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-maroon rounded-xl flex items-center justify-center">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-maroon font-bold text-xl">Labour</span>
              <span className="text-gold font-bold text-xl">X</span>
            </div>
          </Link>

          <h1 className="text-foreground text-2xl font-bold">Create Your Account</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Join Sri Lanka&apos;s premier construction marketplace
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {step === 1 && (
            <div>
              <p className="text-foreground mb-4 text-center font-semibold">
                I want to join as...
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`p-5 rounded-xl border-2 transition-all ${
                    role === 'user'
                      ? 'border-maroon bg-maroon-light'
                      : 'border-border hover:border-maroon/50'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${
                      role === 'user' ? 'bg-maroon' : 'bg-muted'
                    } flex items-center justify-center mx-auto mb-3 transition-colors`}
                  >
                    <User
                      className={`w-6 h-6 ${
                        role === 'user' ? 'text-white' : 'text-muted-foreground'
                      }`}
                    />
                  </div>

                  <p className="text-foreground text-sm font-semibold">Client / Homeowner</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Find professionals & post projects
                  </p>

                  {role === 'user' && (
                    <div className="mt-2 flex justify-center">
                      <CheckCircle className="w-4 h-4 text-maroon" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRole('technician')}
                  className={`p-5 rounded-xl border-2 transition-all ${
                    role === 'technician'
                      ? 'border-maroon bg-maroon-light'
                      : 'border-border hover:border-maroon/50'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${
                      role === 'technician' ? 'bg-maroon' : 'bg-muted'
                    } flex items-center justify-center mx-auto mb-3 transition-colors`}
                  >
                    <Wrench
                      className={`w-6 h-6 ${
                        role === 'technician' ? 'text-white' : 'text-muted-foreground'
                      }`}
                    />
                  </div>

                  <p className="text-foreground text-sm font-semibold">Professional</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Showcase skills & get hired
                  </p>

                  {role === 'technician' && (
                    <div className="mt-2 flex justify-center">
                      <CheckCircle className="w-4 h-4 text-maroon" />
                    </div>
                  )}
                </button>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-maroon hover:bg-maroon-dark text-white py-3 rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                Continue as {role === 'user' ? 'Client' : 'Professional'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleContinueFromStepTwo}>
              <div className="flex items-center gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div>
                  <h2 className="text-foreground font-semibold">Personal Information</h2>
                  <p className="text-muted-foreground text-xs">
                    Step {step} of {role === 'user' ? 2 : 3}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="John Doe"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>City *</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                      placeholder="Colombo"
                      className={inputClass}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Email Address *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone Number *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="+94 77 123 4567"
                    className={inputClass}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Age</label>
                    <input
                      type="number"
                      value={form.age}
                      onChange={(e) => update('age', e.target.value)}
                      placeholder="35"
                      className={inputClass}
                      min="1"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Address</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => update('address', e.target.value)}
                      placeholder="Your address"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      placeholder="Min 8 characters"
                      className={`${inputClass} pr-10`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-maroon hover:bg-maroon-dark disabled:opacity-60 text-white py-3 rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  {loading
                    ? 'Creating account...'
                    : role === 'user'
                    ? 'Create Account'
                    : 'Continue'}
                  {!loading && role === 'technician' && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          )}

          {step === 3 && role === 'technician' && (
            <form onSubmit={handleRegister}>
              <div className="flex items-center gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div>
                  <h2 className="text-foreground font-semibold">Professional Details</h2>
                  <p className="text-muted-foreground text-xs">Step 3 of 3</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Specialty / Trade *</label>
                  <select
                    value={form.specialty}
                    onChange={(e) => update('specialty', e.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">Select your specialty</option>
                    {SPECIALTIES.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Years of Experience *</label>
                  <input
                    type="number"
                    value={form.yearsExperience}
                    onChange={(e) => update('yearsExperience', e.target.value)}
                    placeholder="e.g. 8"
                    className={inputClass}
                    required
                    min="1"
                    max="50"
                  />
                </div>

                <div>
                  <label className={labelClass}>Professional Bio *</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => update('bio', e.target.value)}
                    placeholder="Describe your expertise, skills, and what makes your work stand out..."
                    className={`${inputClass} resize-none`}
                    rows={4}
                    required
                  />
                </div>

                <div className="p-3 rounded-lg bg-gold-light border border-gold/20 text-sm text-muted-foreground">
                  ✓ You can add portfolio projects, certifications, and more from your
                  dashboard after registration.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-maroon hover:bg-maroon-dark disabled:opacity-60 text-white py-3 rounded-xl transition-colors font-semibold"
                >
                  {loading ? 'Creating account...' : 'Create Professional Account'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-maroon hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}