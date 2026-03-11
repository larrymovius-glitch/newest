import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Video, Wand2, FolderOpen, LayoutGrid, BarChart3, Menu, X, Package, Key, Zap, LogIn, LogOut, Shield, Crown, Star, Tag, BookOpen, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Video },
  { path: '/quick-create', label: 'Quick Create', icon: Zap },
  { path: '/anyadpro', label: 'AnyAdPro', icon: Sparkles, highlight: true },
  { path: '/generate', label: 'Create Video', icon: Wand2 },
  { path: '/library', label: 'My Videos', icon: FolderOpen },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/learn', label: 'Learn', icon: BookOpen },
  { path: '/templates', label: 'Templates', icon: LayoutGrid },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/integration', label: 'Connect', icon: Key },
];

const PLAN_COLORS = { free: '#64748b', pro: '#a78bfa', lifetime: '#f59e0b' };

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHome = location.pathname === '/';
  const isAuth = location.pathname === '/auth';

  if (isHome || isAuth) return null;

  return (
    <>
      <nav className="app-navbar" data-testid="app-navbar">
        <NavLink to="/" className="navbar-brand" data-testid="navbar-brand">
          <span className="navbar-brand-main">Affiliate Pro</span>
          <span className="navbar-brand-sub">EZ AD Creator</span>
        </NavLink>

        <div className="navbar-links">
          {NAV_ITEMS.filter(item => item.path !== '/').map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''} ${item.highlight ? 'highlight' : ''}`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
              {item.highlight && <span className="nav-badge">NEW</span>}
            </NavLink>
          ))}
          {user?.is_admin && (
            <NavLink to="/admin" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} data-testid="nav-admin">
              <Shield size={16} />
              <span>Admin</span>
            </NavLink>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <>
              <NavLink to="/pricing" style={{ textDecoration: 'none' }} data-testid="plan-badge">
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700,
                  background: `${PLAN_COLORS[user.plan] || '#64748b'}25`,
                  color: PLAN_COLORS[user.plan] || '#64748b',
                  border: `1px solid ${PLAN_COLORS[user.plan] || '#64748b'}40`
                }}>
                  {user.plan === 'lifetime' ? <Star size={12} /> : user.plan === 'pro' ? <Crown size={12} /> : <Tag size={12} />}
                  {user.plan.toUpperCase()}
                </span>
              </NavLink>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }} data-testid="user-email">{user.email}</span>
              <button onClick={logout} className="navbar-link" data-testid="logout-button" style={{ cursor: 'pointer', background: 'none', border: 'none' }}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/auth')} className="navbar-link" data-testid="login-button" style={{ cursor: 'pointer', background: 'rgba(167,139,250,0.2)', border: 'none', color: '#a78bfa' }}>
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>

        <button className="navbar-mobile-toggle" data-testid="mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="navbar-mobile-menu" data-testid="mobile-menu">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          {user?.is_admin && (
            <NavLink to="/admin" className="navbar-mobile-link" onClick={() => setMobileOpen(false)}>
              <Shield size={20} /><span>Admin</span>
            </NavLink>
          )}
          <NavLink to="/pricing" className="navbar-mobile-link" onClick={() => setMobileOpen(false)}>
            <Tag size={20} /><span>Pricing</span>
          </NavLink>
          {user ? (
            <button onClick={() => { logout(); setMobileOpen(false); }} className="navbar-mobile-link" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
              <LogOut size={20} /><span>Sign Out</span>
            </button>
          ) : (
            <NavLink to="/auth" className="navbar-mobile-link" onClick={() => setMobileOpen(false)}>
              <LogIn size={20} /><span>Sign In</span>
            </NavLink>
          )}
        </div>
      )}
    </>
  );
};
