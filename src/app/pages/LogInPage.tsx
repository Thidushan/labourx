import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HardHat,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Wrench,
  ArrowLeft
} from 'lucide-react';

import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

export function LoginPage() {
  const [role, setRole] = useState<'user' | 'technician'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ✅ FIXED BACK BUTTON LOGIC
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');

    const cleanedEmail = email.trim().toLowerCase();
    const cleanedPassword = password.trim();

    if (!cleanedEmail || !cleanedPassword) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanedEmail,
        cleanedPassword
      );

      const firebaseUser = userCredential.user;

      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        setError('User profile not found. Please contact support or register again.');
        return;
      }

      const userData = userSnap.data();
      const actualRole = userData.role as 'user' | 'technician' | undefined;

      if (!actualRole) {
        await signOut(auth);
        setError('User role is missing. Please contact support.');
        return;
      }

      if (actualRole !== role) {
        await signOut(auth);
        setError(
          `This account is registered as ${
            actualRole === 'user' ? 'Client' : 'Professional'
          }. Please select the correct role and try again.`
        );
        return;
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);

      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-maroon-light flex items-center justify-center py-12 px-4">

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-maroon hover:text-maroon-dark transition-colors text-sm"
        style={{ fontWeight: 500 }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="w-full max-w-md">

        {/* Logo */}
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
          <h1 className="text-foreground text-xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sign in to your account to continue
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">

          {/* Role Toggle */}
          <div className="flex rounded-xl border border-border overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm ${
                role === 'user'
                  ? 'bg-maroon text-white'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <User className="w-4 h-4" />
              Client
            </button>

            <button
              type="button"
              onClick={() => setRole('technician')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm ${
                role === 'technician'
                  ? 'bg-maroon text-white'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Professional
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm mb-1.5 font-medium">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg border"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm mb-1.5 font-medium">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-maroon text-white py-3 rounded-xl"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-maroon">
              Create one
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}