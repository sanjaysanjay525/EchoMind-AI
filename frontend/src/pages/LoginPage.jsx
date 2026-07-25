import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      if (user.role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-darkBg overflow-hidden flex flex-col">
      <div className="glow-bg bg-indigo-500 w-[400px] h-[400px] top-[10%] left-[20%]"></div>
      <div className="glow-bg bg-pink-500 w-[400px] h-[400px] bottom-[10%] right-[20%]"></div>

      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="glass-card max-w-md w-full p-8 rounded-3xl relative">
          <div className="text-center mb-8">
            <h2 className="font-display font-extrabold text-3xl text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400 text-sm">Sign in to resume your interview prep</p>
          </div>

          {error && (
            <div className="bg-pink-500/10 border border-pink-500/20 text-pink-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email Input */}
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

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full pl-11 pr-11 py-3.5 rounded-xl text-sm text-white placeholder-gray-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition duration-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:underline">
              Create one for free
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
