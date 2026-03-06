import { NavLink, useLocation } from 'react-router-dom';
import { Video, Wand2, FolderOpen, LayoutGrid, Users, BarChart3, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Video },
  { path: '/generate', label: 'Create Video', icon: Wand2 },
  { path: '/library', label: 'My Videos', icon: FolderOpen },
  { path: '/templates', label: 'Templates', icon: LayoutGrid },
  { path: '/gallery', label: 'Community', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHome = location.pathname === '/';

  if (isHome) return null;

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
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <button
          className="navbar-mobile-toggle"
          data-testid="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="navbar-mobile-menu" data-testid="mobile-menu">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </>
  );
};
