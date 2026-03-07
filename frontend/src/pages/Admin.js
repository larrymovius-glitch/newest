import { useState, useEffect } from 'react';
import { Shield, Users, DollarSign, Crown, Zap, Star, Trash2, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLAN_COLORS = { free: '#64748b', pro: '#a78bfa', lifetime: '#f59e0b' };
const PLAN_ICONS = { free: Zap, pro: Crown, lifetime: Star };

const Admin = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [usersRes, revenueRes] = await Promise.all([
        axios.get(`${API}/admin/users`, { headers }),
        axios.get(`${API}/admin/revenue`, { headers })
      ]);
      setUsers(usersRes.data.users);
      setRevenue(revenueRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load admin data');
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChangePlan = async (userId, plan) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/plan?plan=${plan}`, {}, { headers });
      toast.success(`Plan updated to ${plan}`);
      setOpenDropdown(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update plan');
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Delete user ${email}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`, { headers });
      toast.success('User deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleAdmin = async (userId) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/toggle-admin`, {}, { headers });
      toast.success('Admin status toggled');
      fetchData();
    } catch (error) {
      toast.error('Failed to update admin status');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-';

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading...</div>;

  return (
    <div className="library-container">
      <div className="generator-header">
        <h1 className="hero-title" style={{ fontSize: '2.5rem' }} data-testid="admin-title">
          <Shield size={40} style={{ display: 'inline', marginRight: '1rem', verticalAlign: 'middle' }} />
          Admin Dashboard
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.125rem' }}>
          Manage users, plans, and revenue
        </p>
      </div>

      {/* Revenue Cards */}
      {revenue && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto 2rem', padding: '0 2rem' }}>
          <div className="generator-card" data-testid="stat-revenue" style={{ textAlign: 'center' }}>
            <DollarSign size={28} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>${revenue.total_revenue}</p>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Revenue</p>
          </div>
          <div className="generator-card" data-testid="stat-users" style={{ textAlign: 'center' }}>
            <Users size={28} color="#a78bfa" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#a78bfa' }}>{revenue.total_users}</p>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Users</p>
          </div>
          <div className="generator-card" data-testid="stat-pro" style={{ textAlign: 'center' }}>
            <Crown size={28} color="#a78bfa" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#a78bfa' }}>{revenue.plan_distribution?.pro || 0}</p>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Pro Users</p>
          </div>
          <div className="generator-card" data-testid="stat-lifetime" style={{ textAlign: 'center' }}>
            <Star size={28} color="#f59e0b" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{revenue.plan_distribution?.lifetime || 0}</p>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Lifetime Users</p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>
          All Users ({users.length})
        </h3>
        <div className="generator-card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} data-testid="users-table">
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>USER</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>PLAN</th>
                <th style={{ textAlign: 'center', padding: '0.75rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>VIDEOS</th>
                <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>JOINED</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const PlanIcon = PLAN_ICONS[u.plan] || Zap;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }} data-testid={`user-row-${u.id}`}>
                    <td style={{ padding: '0.75rem' }}>
                      <p style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                        {u.name || 'No name'}
                        {u.is_admin && <span style={{ marginLeft: '0.5rem', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 700 }}>ADMIN</span>}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{u.email}</p>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600, background: `${PLAN_COLORS[u.plan]}20`, color: PLAN_COLORS[u.plan] }}>
                        <PlanIcon size={14} />
                        {u.plan}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.75rem', color: '#475569', fontSize: '0.9rem' }}>
                      {u.videos_this_month || 0}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                      {formatDate(u.created_at)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', position: 'relative' }}>
                        <div style={{ position: 'relative' }}>
                          <button
                            className="download-button"
                            data-testid={`change-plan-${u.id}`}
                            style={{ background: '#667eea', fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                            onClick={() => setOpenDropdown(openDropdown === u.id ? null : u.id)}
                          >
                            Change Plan <ChevronDown size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                          </button>
                          {openDropdown === u.id && (
                            <div style={{
                              position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: '4px',
                              background: 'white', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden', minWidth: '120px'
                            }}>
                              {['free', 'pro', 'lifetime'].map(plan => (
                                <button key={plan}
                                  data-testid={`set-plan-${plan}-${u.id}`}
                                  onClick={() => handleChangePlan(u.id, plan)}
                                  style={{
                                    display: 'block', width: '100%', padding: '0.5rem 1rem', border: 'none',
                                    background: u.plan === plan ? '#f1f5f9' : 'white', cursor: 'pointer',
                                    textAlign: 'left', fontSize: '0.85rem', fontWeight: u.plan === plan ? 700 : 400,
                                    color: PLAN_COLORS[plan]
                                  }}
                                >
                                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          className="download-button"
                          data-testid={`toggle-admin-${u.id}`}
                          style={{ background: u.is_admin ? '#f59e0b' : '#10b981', fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                          onClick={() => handleToggleAdmin(u.id)}
                        >
                          {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          className="download-button"
                          data-testid={`delete-user-${u.id}`}
                          style={{ background: '#ef4444', fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                          onClick={() => handleDeleteUser(u.id, u.email)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
