import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User as UserIcon, AlertCircle, ShieldAlert } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ROLE_CANDIDATE');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      await register(name, email, password, role);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data || 'Failed to create account. Email might be in use.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-darkBg overflow-hidden flex flex-col">
      <div className="glow-bg bg-indigo-500 w-[400px] h-[400px] top-[10%] right-[20%]"></div>
      <div className="glow-bg bg-pink-500 w-[400px] h-[400px] bottom-[10%] left-[20%]"></div>

      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="glass-card max-w-md w-full p-8 rounded-3xl relative">
          <div className="text-center mb-8">
            <h2 className="font-display font-extrabold text-3xl text-white mb-2">Create Account</h2>
            <p className="text-gray-400 text-sm">Join EchoMind AI to start practicing</p>
          </div>

          {error && (
            <div className="bg-pink-500/10 border border-pink-500/20 text-pink-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-gray-600"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-gray-600"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-gray-600"
                  required
                />
              </div>
            </div>

            {/* Role Selection (For Demo Testing ease) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Account Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('ROLE_CANDIDATE')}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition duration-200 ${
                    role === 'ROLE_CANDIDATE'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ROLE_ADMIN')}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition duration-200 flex items-center justify-center gap-2 ${
                    role === 'ROLE_ADMIN'
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-indigo hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-lg shadow-indigo-500/20 text-sm mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:underline">
              Log In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
