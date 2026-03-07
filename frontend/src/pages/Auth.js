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
