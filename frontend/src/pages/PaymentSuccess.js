import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, refreshUser } = useAuth();
  const [status, setStatus] = useState('checking');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId || !token) return;

    const check = async () => {
      try {
        const res = await axios.get(`${API}/checkout/status/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.payment_status === 'paid') {
          setStatus('success');
          await refreshUser();
        } else {
          setStatus('pending');
          setTimeout(check, 3000);
        }
      } catch {
        setStatus('error');
      }
    };
    check();
  }, [sessionId, token]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '2rem' }}>
      <div className="generator-card" style={{ maxWidth: '500px', textAlign: 'center' }} data-testid="payment-result">
        {status === 'checking' || status === 'pending' ? (
          <>
            <Loader2 size={48} color="#a78bfa" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Processing Payment...</h2>
            <p style={{ color: '#64748b' }}>Please wait while we confirm your payment.</p>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle2 size={56} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e', marginBottom: '0.5rem' }}>Payment Successful!</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Your plan has been upgraded. Enjoy all the features!</p>
            <button className="generate-button" data-testid="go-create-btn" onClick={() => navigate('/quick-create')}>
              Start Creating Videos
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.5rem' }}>Something Went Wrong</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>We couldn't verify your payment. Please contact support.</p>
            <button className="generate-button" onClick={() => navigate('/pricing')}>Back to Pricing</button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
