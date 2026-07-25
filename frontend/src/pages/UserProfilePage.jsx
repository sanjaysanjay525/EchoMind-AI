import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Save, AlertCircle, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function UserProfilePage() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile(name, password);
      setSuccess('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
          <header className="mb-8">
            <h1 className="font-display font-extrabold text-3xl text-white mb-2">Profile Settings</h1>
            <p className="text-gray-400 text-sm">Manage your name, email, and password configurations</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Account Card info */}
            <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4 h-fit">
              <div className="w-20 h-20 rounded-full bg-indigo-600/10 border-2 border-indigo-500/20 flex items-center justify-center text-indigo-400 font-display font-extrabold text-3xl shadow-lg shadow-indigo-500/5">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">{user?.name}</h3>
                <span className="text-sm text-gray-500 block mb-1">{user?.email}</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-mono uppercase">
                  {user?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Candidate'}
                </span>
              </div>
            </div>

            {/* Profile editor */}
            <div className="glass-card p-8 rounded-3xl md:col-span-2 relative">
              {error && (
                <div className="bg-pink-500/10 border border-pink-500/20 text-pink-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm mb-6">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm mb-6">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Email (Read Only) */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email Address (Non-editable)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm text-gray-500 cursor-not-allowed bg-white/2"
                    />
                  </div>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-600"
                      required
                    />
                  </div>
                </div>

                <div className="w-full h-px bg-white/5 my-2"></div>

                {/* Change Password Header */}
                <h4 className="font-display font-semibold text-white text-sm">Update Password (Optional)</h4>

                {/* Password */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-indigo hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-md shadow-indigo-500/10 text-sm mt-4 w-fit px-6"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
