import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Email and password required'); return; }
    if (!isLogin && !name) { toast.error('Name is required'); return; }
    
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        await register(email, password, name);
        toast.success('Account created!');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Something went wrong');
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Affiliate Pro
            </span>
          </h1>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase' }}>EZ AD Creator</p>
        </div>

        <div className="generator-card" data-testid="auth-card">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            data-testid="google-login-button"
            style={{
              width: '100%', padding: '0.875rem', borderRadius: '12px', border: '2px solid #e2e8f0',
              background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: 600,
              color: '#1e293b', marginBottom: '1.5rem', transition: 'all 0.2s'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          <div style={{ display: 'flex', marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <button
              data-testid="login-tab"
              onClick={() => setIsLogin(true)}
              style={{
                flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                background: isLogin ? 'linear-gradient(135deg, #a78bfa, #f472b6)' : '#f8fafc',
                color: isLogin ? 'white' : '#64748b'
              }}
            >
              Sign In
            </button>
            <button
              data-testid="register-tab"
              onClick={() => setIsLogin(false)}
              style={{
                flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                background: !isLogin ? 'linear-gradient(135deg, #a78bfa, #f472b6)' : '#f8fafc',
                color: !isLogin ? 'white' : '#64748b'
              }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label"><User size={14} style={{ display: 'inline', marginRight: '6px' }} />Name</label>
                <input className="form-select" data-testid="name-input" placeholder="Your name"
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label"><Mail size={14} style={{ display: 'inline', marginRight: '6px' }} />Email</label>
              <input className="form-select" data-testid="email-input" type="email" placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label"><Lock size={14} style={{ display: 'inline', marginRight: '6px' }} />Password</label>
              <input className="form-select" data-testid="password-input" type="password" placeholder="Min 6 characters"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="generate-button" data-testid="auth-submit" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? 'Please wait...' : (isLogin ? (
                <><LogIn size={18} style={{ display: 'inline', marginRight: '8px' }} />Sign In</>
              ) : (
                <><UserPlus size={18} style={{ display: 'inline', marginRight: '8px' }} />Create Account</>
              ))}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
