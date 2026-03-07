import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLAN_ICONS = { free: Zap, pro: Crown, lifetime: Star };
const PLAN_COLORS = { free: '#64748b', pro: '#a78bfa', lifetime: '#f59e0b' };

const Pricing = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    axios.get(`${API}/plans`).then(res => setPlans(res.data.plans)).catch(() => {});
  }, []);

  const handleSubscribe = async (planId) => {
    if (!user) { navigate('/auth'); return; }
    if (planId === 'free') return;
    if (user.plan === planId) { toast.info('You\'re already on this plan'); return; }
    
    setLoading(planId);
    try {
      const res = await axios.post(`${API}/checkout/create?plan_id=${planId}`, {}, {
        headers: { Authorization: `Bearer ${token}`, Origin: window.location.origin }
      });
      window.location.href = res.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start checkout');
      setLoading(null);
    }
  };

  return (
    <div className="library-container">
      <div className="generator-header">
        <h1 className="hero-title" style={{ fontSize: '2.5rem' }} data-testid="pricing-title">
          Simple, Fair Pricing
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.125rem' }} data-testid="pricing-subtitle">
          Start free. Upgrade when you're ready.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', maxWidth: '1000px', margin: '0 auto', padding: '0 2rem' }}>
        {plans.map(plan => {
          const Icon = PLAN_ICONS[plan.id] || Zap;
          const color = PLAN_COLORS[plan.id] || '#64748b';
          const isCurrent = user?.plan === plan.id;
          const isPopular = plan.id === 'lifetime';

          return (
            <div key={plan.id} className="generator-card" data-testid={`plan-card-${plan.id}`}
              style={{
                position: 'relative', textAlign: 'center',
                border: isPopular ? '2px solid #f59e0b' : undefined,
                transform: isPopular ? 'scale(1.05)' : undefined
              }}>
              {isPopular && (
                <div style={{
                  position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                  background: '#f59e0b', color: '#0f172a', padding: '4px 16px', borderRadius: '50px',
                  fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap'
                }} data-testid="best-value-badge">
                  BEST VALUE
                </div>
              )}

              <Icon size={32} color={color} style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                {plan.name}
              </h3>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b' }}>
                  ${plan.price}
                </span>
                {plan.period && (
                  <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{plan.period}</span>
                )}
              </div>

              <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                {plan.features.map((feature, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Check size={16} color={color} />
                    <span style={{ fontSize: '0.9rem', color: '#475569' }}>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                className="generate-button"
                data-testid={`subscribe-${plan.id}`}
                disabled={isCurrent || loading === plan.id}
                onClick={() => handleSubscribe(plan.id)}
                style={{
                  width: '100%',
                  background: isCurrent ? '#94a3b8' : (plan.id === 'lifetime' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : undefined),
                  opacity: plan.id === 'free' ? 0.6 : 1
                }}
              >
                {isCurrent ? 'Current Plan' : (loading === plan.id ? 'Redirecting...' : (plan.id === 'free' ? 'Free Forever' : `Get ${plan.name}`))}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pricing;
