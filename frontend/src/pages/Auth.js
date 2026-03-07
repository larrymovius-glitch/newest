import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, LogIn, UserPlus, Sparkles, Video, DollarSign, Zap, Star, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const BENEFITS = [
  { icon: Video, text: "AI creates stunning videos for you", color: "#a78bfa" },
  { icon: DollarSign, text: "Turn products into income", color: "#10b981" },
  { icon: Zap, text: "No skills needed - just describe", color: "#f59e0b" },
  { icon: Star, text: "Professional quality in minutes", color: "#f472b6" },
];

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
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="auth-page">
      {/* Animated background */}
      <div className="auth-bg-gradient"></div>
      <div className="auth-bg-orbs">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
        <div className="auth-orb auth-orb-3"></div>
      </div>

      <div className="auth-container">
        {/* Left side - Value proposition */}
        <div className="auth-hero" data-testid="auth-hero">
          <div className="auth-hero-content">
            <div className="auth-logo-badge">
              <Sparkles size={24} />
              <span>AI-Powered</span>
            </div>
            
            <h1 className="auth-hero-title">
              Turn Your Ideas Into
              <span className="auth-gradient-text"> Income</span>
            </h1>
            
            <p className="auth-hero-subtitle">
              Create professional video ads in seconds. No experience needed — our AI does the heavy lifting.
            </p>

            <div className="auth-benefits">
              {BENEFITS.map((benefit, idx) => (
                <div key={idx} className="auth-benefit" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="auth-benefit-icon" style={{ background: `${benefit.color}20`, color: benefit.color }}>
                    <benefit.icon size={20} />
                  </div>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>

            <div className="auth-social-proof">
              <div className="auth-avatars">
                <div className="auth-avatar" style={{ background: 'linear-gradient(135deg, #a78bfa, #f472b6)' }}>L</div>
                <div className="auth-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>M</div>
                <div className="auth-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>K</div>
              </div>
              <p>Join creators earning from home</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <div className="auth-form-section">
          <div className="auth-card" data-testid="auth-card">
            <div className="auth-card-header">
              <h2>{isLogin ? 'Welcome Back' : 'Start Creating'}</h2>
              <p>{isLogin ? 'Sign in to continue your journey' : 'Create your free account'}</p>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              className="auth-google-btn"
              data-testid="google-login-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="auth-divider">
              <span>or continue with email</span>
            </div>

            {/* Toggle tabs */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(true)}
                data-testid="login-tab"
              >
                <LogIn size={16} />
                Sign In
              </button>
              <button
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(false)}
                data-testid="register-tab"
              >
                <UserPlus size={16} />
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="auth-field">
                  <label><User size={14} /> Your Name</label>
                  <input
                    type="text"
                    placeholder="What should we call you?"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    data-testid="name-input"
                  />
                </div>
              )}
              
              <div className="auth-field">
                <label><Mail size={14} /> Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  data-testid="email-input"
                />
              </div>
              
              <div className="auth-field">
                <label><Lock size={14} /> Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  data-testid="password-input"
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading} data-testid="auth-submit">
                {loading ? (
                  <span className="auth-loading">Creating magic...</span>
                ) : isLogin ? (
                  <>
                    <LogIn size={18} />
                    Sign In & Create
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Create Free Account
                  </>
                )}
              </button>
            </form>

            {!isLogin && (
              <p className="auth-terms">
                <CheckCircle size={14} />
                Free forever plan • No credit card needed
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
