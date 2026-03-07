import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthCallback = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const sessionIdMatch = hash.match(/session_id=([^&]+)/);
    
    if (!sessionIdMatch) {
      navigate('/auth');
      return;
    }

    const sessionId = sessionIdMatch[1];

    const exchangeSession = async () => {
      try {
        const res = await axios.post(`${API}/auth/google/callback`, { session_id: sessionId });
        localStorage.setItem('token', res.data.token);
        await refreshUser();
        navigate('/');
      } catch (error) {
        console.error('Google auth failed:', error);
        navigate('/auth');
      }
    };

    exchangeSession();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-spinner" style={{ width: '48px', height: '48px', margin: '0 auto 1.5rem', borderWidth: '4px' }}></div>
        <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
