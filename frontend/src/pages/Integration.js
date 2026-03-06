import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Shield, Link2, Store, Video, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Integration = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [appName, setAppName] = useState('');
  const [permissions, setPermissions] = useState(['read_products', 'read_videos']);
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchKeys = async () => {
    try {
      const response = await axios.get(`${API}/integration/keys`);
      setKeys(response.data.keys);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching keys:', error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!appName.trim()) {
      toast.error('App name is required');
      return;
    }
    try {
      const response = await axios.post(`${API}/integration/keys`, {
        app_name: appName,
        permissions
      });
      toast.success('API key created! Copy it now — it won\'t be shown again in full.');
      setAppName('');
      setShowForm(false);
      fetchKeys();
    } catch (error) {
      toast.error('Failed to create key');
    }
  };

  const handleRevoke = async (keyId) => {
    if (!window.confirm('Revoke this API key? Any app using it will lose access.')) return;
    try {
      await axios.delete(`${API}/integration/keys/${keyId}`);
      toast.success('API key revoked');
      fetchKeys();
    } catch (error) {
      toast.error('Failed to revoke key');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const togglePermission = (perm) => {
    setPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const ALL_PERMISSIONS = [
    { key: 'read_products', label: 'Read Products', desc: 'View product catalog' },
    { key: 'write_products', label: 'Write Products', desc: 'Create and update products' },
    { key: 'read_videos', label: 'Read Videos', desc: 'View generated videos' },
  ];

  const storeUrl = `${BACKEND_URL}/api/store/feed`;

  return (
    <div className="library-container">
      <div className="generator-header">
        <h1 className="hero-title" style={{ fontSize: '2.5rem' }} data-testid="integration-title">
          <Key size={40} style={{ display: 'inline', marginRight: '1rem', verticalAlign: 'middle' }} />
          Integration Settings
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.125rem' }} data-testid="integration-subtitle">
          Connect Affiliate Pro and your store to this app
        </p>
      </div>

      {/* Quick Start Guide */}
      <div style={{ maxWidth: '900px', margin: '0 auto 2rem', padding: '0 2rem' }}>
        <div className="generator-card" data-testid="quickstart-card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
            How It Works (3 Easy Steps)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ minWidth: '36px', height: '36px', borderRadius: '50%', background: '#a78bfa', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>1</div>
              <div>
                <p style={{ fontWeight: 600, color: '#1e293b' }}>Create an API key below</p>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>One key for Affiliate Pro, one for your store</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ minWidth: '36px', height: '36px', borderRadius: '50%', background: '#a78bfa', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>2</div>
              <div>
                <p style={{ fontWeight: 600, color: '#1e293b' }}>Tell the other agent to connect</p>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Give the agent the API key and the endpoint URLs shown below</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ minWidth: '36px', height: '36px', borderRadius: '50%', background: '#a78bfa', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>3</div>
              <div>
                <p style={{ fontWeight: 600, color: '#1e293b' }}>Products flow automatically</p>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Products you publish here will appear in your store. Videos you create will be available to Affiliate Pro.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoint URLs */}
      <div style={{ maxWidth: '900px', margin: '0 auto 2rem', padding: '0 2rem' }}>
        <div className="generator-card" data-testid="endpoints-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
            <Link2 size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            Endpoint URLs (give these to the other agents)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Store Feed (public)', url: `${BACKEND_URL}/api/store/feed`, icon: Store, desc: 'For amhere4utoday.com — gets all published products' },
              { label: 'Products API (secured)', url: `${BACKEND_URL}/api/external/products`, icon: Key, desc: 'For Affiliate Pro — read/write products (needs API key in X-API-Key header)' },
              { label: 'Videos API (secured)', url: `${BACKEND_URL}/api/external/videos`, icon: Video, desc: 'For Affiliate Pro — read completed videos (needs API key in X-API-Key header)' },
            ].map((ep, i) => (
              <div key={i} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} data-testid={`endpoint-${i}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                    <ep.icon size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    {ep.label}
                  </span>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa' }}
                    onClick={() => copyToClipboard(ep.url, `ep-${i}`)}
                    data-testid={`copy-endpoint-${i}`}
                  >
                    {copiedKey === `ep-${i}` ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <code style={{ fontSize: '0.8rem', color: '#667eea', wordBreak: 'break-all' }}>{ep.url}</code>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{ep.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* API Keys Section */}
      <div style={{ maxWidth: '900px', margin: '0 auto 2rem', padding: '0 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0' }}>
            <Shield size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            API Keys
          </h3>
          <button
            className="cta-button"
            data-testid="create-key-button"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={18} style={{ marginRight: '6px' }} />
            New Key
          </button>
        </div>

        {showForm && (
          <div className="generator-card" style={{ marginBottom: '1.5rem' }} data-testid="create-key-form">
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">App Name</label>
                <input
                  className="form-select"
                  data-testid="key-app-name-input"
                  placeholder="e.g., Affiliate Pro or Store"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Permissions</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ALL_PERMISSIONS.map(perm => (
                    <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={permissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                        data-testid={`perm-${perm.key}`}
                      />
                      <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{perm.label}</span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>— {perm.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="generate-button" data-testid="generate-key-button">
                Generate API Key
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading...</p>
        ) : keys.length === 0 ? (
          <div className="generator-card" style={{ textAlign: 'center' }}>
            <Key size={40} color="#475569" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#64748b' }}>No API keys yet. Create one to connect your other apps.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {keys.map(key => (
              <div key={key.id} className="generator-card" data-testid={`key-card-${key.id}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>{key.app_name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <code style={{ fontSize: '0.85rem', color: '#667eea', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                      {key.api_key}
                    </code>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa' }}
                      onClick={() => copyToClipboard(key.api_key, key.id)}
                      data-testid={`copy-key-${key.id}`}
                    >
                      {copiedKey === key.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    Permissions: {key.permissions?.join(', ')}
                  </p>
                </div>
                <button
                  className="download-button"
                  data-testid={`revoke-key-${key.id}`}
                  style={{ background: '#ef4444', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  onClick={() => handleRevoke(key.id)}
                >
                  <Trash2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Integration;
