import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Users, BookOpen, Star, Shield, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'interviews'

  const fetchAdminData = async () => {
    try {
      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data);

      const interviewsRes = await api.get('/admin/interviews');
      setInterviews(interviewsRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)));

      const analyticsRes = await api.get('/admin/analytics');
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error("Error loading admin dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete user.");
    }
  };

  const handleToggleRole = async (id, currentRole) => {
    const nextRole = currentRole === 'ROLE_ADMIN' ? 'ROLE_CANDIDATE' : 'ROLE_ADMIN';
    if (!window.confirm(`Change user role to ${nextRole === 'ROLE_ADMIN' ? 'Admin' : 'Candidate'}?`)) return;
    try {
      await api.put(`/admin/users/${id}/role`, null, { params: { role: nextRole } });
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert("Failed to update user role.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader text="Loading administrator panel..." />
        </div>
      </div>
    );
  }

  // Prep chart data
  const chartData = Object.entries(analytics?.domainDistribution || {}).map(([name, value]) => ({
    name,
    count: value,
  }));

  const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#10b981', '#f43f5e', '#f59e0b'];

  return (
    <div className="min-h-screen bg-darkBg flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
          <header className="mb-8">
            <h1 className="font-display font-extrabold text-3xl text-white mb-2">Administrator Panel</h1>
            <p className="text-gray-400 text-sm">System statistics, user tables, and practice records</p>
          </header>

          {/* Metrics grids */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Candidate Registrations</span>
                <span className="text-2xl font-bold text-white">{analytics?.totalUsers}</span>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Total Mock Runs</span>
                <span className="text-2xl font-bold text-white">{analytics?.totalInterviews}</span>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Global Avg Score</span>
                <span className="text-2xl font-bold text-white">{analytics?.averageScore}%</span>
              </div>
            </div>
          </section>

          {/* Charts section */}
          {chartData.length > 0 && (
            <section className="glass-card p-6 rounded-3xl mb-8">
              <h3 className="font-display font-bold text-lg text-white mb-4">Interviews by Domain</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} />
                    <YAxis stroke="#4b5563" fontSize={11} allowDecimals={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      contentStyle={{ background: '#15171e', borderColor: '#232630', borderRadius: '12px' }}
                      labelStyle={{ color: '#fff', fontSize: '12px' }}
                      itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="count" name="Sessions" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Tables and management tabs */}
          <section className="glass-card rounded-3xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/5 bg-white/2">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-4 text-sm font-semibold transition duration-150 ${
                  activeTab === 'users' ? 'border-b-2 border-b-indigo-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Manage Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('interviews')}
                className={`flex-1 py-4 text-sm font-semibold transition duration-150 ${
                  activeTab === 'interviews' ? 'border-b-2 border-b-indigo-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Global Interviews ({interviews.length})
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6">
              {activeTab === 'users' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-white/2 text-sm transition duration-150">
                          <td className="py-4 px-4 font-semibold text-white">{u.name}</td>
                          <td className="py-4 px-4 text-gray-400">{u.email}</td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-mono font-medium tracking-wide uppercase ${
                              u.role === 'ROLE_ADMIN' ? 'bg-purple-500/15 text-purple-400' : 'bg-indigo-500/15 text-indigo-400'
                            }`}>
                              {u.role === 'ROLE_ADMIN' ? 'Admin' : 'Candidate'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-400">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleRole(u.id, u.role)}
                              className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 font-semibold px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 transition duration-150"
                              title="Toggle admin/candidate status"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span>Toggle Role</span>
                            </button>
                            
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-xs bg-pink-500/10 hover:bg-pink-600 text-pink-400 hover:text-white px-3 py-1.5 rounded-lg border border-pink-500/20 hover:border-pink-600 transition duration-150 flex items-center gap-1.5"
                              title="Delete user account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Candidate ID</th>
                        <th className="py-3 px-4">Domain</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {interviews.map((i) => (
                        <tr key={i.id} className="hover:bg-white/2 text-sm transition duration-150">
                          <td className="py-4 px-4 text-gray-400 font-mono text-xs">{i.userId}</td>
                          <td className="py-4 px-4 font-semibold text-white">{i.domain}</td>
                          <td className="py-4 px-4 text-gray-400">{new Date(i.date).toLocaleDateString()}</td>
                          <td className="py-4 px-4 text-gray-400">
                            {i.duration ? `${Math.floor(i.duration / 60)}m ${i.duration % 60}s` : '---'}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                              i.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {i.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
