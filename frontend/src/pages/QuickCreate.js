import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Sparkles, Package, Video, CheckCircle2, XCircle, RotateCcw, Store, Download, Lightbulb, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QUICK_PROMPTS = [
  { label: 'Product Showcase', prompt: 'Professional product showcase video with elegant lighting, smooth camera movements, modern minimalist background, highlighting product features with sleek text overlays' },
  { label: 'Social Media Ad', prompt: 'Fast-paced social media ad with bold colors, quick transitions, attention-grabbing hook, energetic vibe, optimized for short-form content' },
  { label: 'Testimonial Style', prompt: 'Authentic testimonial-style video, person using product happily, natural lighting, warm tones, relatable setting, builds trust and credibility' },
  { label: 'How-To Guide', prompt: 'Step-by-step tutorial video, clear instructions with visual annotations, professional screen recording style, friendly and easy to follow' },
];

const CATEGORIES = ['General', 'Health & Wellness', 'Tech & Software', 'Education', 'Fashion', 'Finance', 'Food & Drink', 'Home & Living'];

const QuickCreate = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=product, 2=video, 3=generating, 4=review
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isNewProduct, setIsNewProduct] = useState(true);

  // Product fields
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productLink, setProductLink] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('General');

  // Video fields
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(4);
  const [size, setSize] = useState('1280x720');
  const [notifyEmail, setNotifyEmail] = useState('');

  // Generation state
  const [videoId, setVideoId] = useState(null);
  const [videoStatus, setVideoStatus] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [productId, setProductId] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/products`).then(res => setProducts(res.data.products)).catch(() => {});
  }, []);

  // Timer
  useEffect(() => {
    if (step === 3) {
      setElapsedTime(0);
      timerRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  // Poll video status
  useEffect(() => {
    if (!videoId || videoStatus === 'completed' || videoStatus === 'failed') return;
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/videos/${videoId}`);
        setVideoStatus(res.data.status);
        if (res.data.status === 'completed') {
          setVideoUrl(`${BACKEND_URL}${res.data.video_url}`);
          setStep(4);
        } else if (res.data.status === 'failed') {
          setStep(4);
        }
      } catch (e) { console.error(e); }
    }, 5000);
    return () => clearInterval(interval);
  }, [videoId, videoStatus]);

  const handleNext = async () => {
    if (step === 1) {
      if (isNewProduct) {
        if (!productName.trim() || !productLink.trim()) {
          toast.error('Product name and affiliate link are required');
          return;
        }
        try {
          const res = await axios.post(`${API}/products`, {
            name: productName, description: productDesc,
            affiliate_link: productLink, price: parseFloat(productPrice) || 0,
            category: productCategory
          });
          setProductId(res.data.id);
          setSelectedProduct(res.data);
          toast.success('Product saved!');
        } catch (e) {
          toast.error('Failed to save product');
          return;
        }
      } else {
        if (!selectedProduct) {
          toast.error('Please select a product');
          return;
        }
        setProductId(selectedProduct.id);
      }
      setStep(2);
    } else if (step === 2) {
      if (!prompt.trim()) {
        toast.error('Please describe your video');
        return;
      }
      setStep(3);
      try {
        const res = await axios.post(`${API}/videos/generate`, {
          prompt, model: 'sora-2', size, duration: parseInt(duration),
          notify_email: notifyEmail || null
        });
        setVideoId(res.data.id);
        setVideoStatus(res.data.status);
      } catch (e) {
        toast.error('Failed to start video generation');
        setStep(2);
      }
    }
  };

  const handleApproveAndPublish = async () => {
    try {
      // Link video to product
      await axios.post(`${API}/products/${productId}/link-video?video_id=${videoId}`);
      // Publish to store
      await axios.post(`${API}/products/${productId}/publish`);
      toast.success('Video linked and product published to store!');
      navigate('/products');
    } catch (e) {
      toast.error('Failed to publish. You can try again from the Products page.');
    }
  };

  const handleRetry = () => {
    setVideoId(null);
    setVideoStatus(null);
    setVideoUrl(null);
    setStep(2);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="library-container">
      <div className="generator-header">
        <h1 className="hero-title" style={{ fontSize: '2.5rem' }} data-testid="quick-create-title">
          <Zap size={40} style={{ display: 'inline', marginRight: '1rem', verticalAlign: 'middle' }} />
          Quick Create
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.125rem' }} data-testid="quick-create-subtitle">
          Product + Video + Publish — all in one step
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ maxWidth: '700px', margin: '0 auto 2rem', padding: '0 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} data-testid="step-indicator">
          {[
            { num: 1, label: 'Product' },
            { num: 2, label: 'Video' },
            { num: 3, label: 'Creating' },
            { num: 4, label: 'Review' },
          ].map((s, i) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.9rem',
                background: step >= s.num ? 'linear-gradient(135deg, #a78bfa, #f472b6)' : '#334155',
                color: step >= s.num ? 'white' : '#64748b',
                transition: 'all 0.3s'
              }}>
                {step > s.num ? <CheckCircle2 size={18} /> : s.num}
              </div>
              <span style={{ fontSize: '0.85rem', color: step >= s.num ? '#e2e8f0' : '#64748b', fontWeight: step === s.num ? 600 : 400 }}>
                {s.label}
              </span>
              {i < 3 && <ChevronRight size={16} color="#475569" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Product */}
      {step === 1 && (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 2rem' }}>
          <div className="generator-card" data-testid="step-1-product">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>
              <Package size={22} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              Step 1: Your Product
            </h3>

            {/* Toggle: New or Existing */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button
                className={`download-button`}
                data-testid="new-product-toggle"
                style={{ background: isNewProduct ? '#a78bfa' : '#e2e8f0', color: isNewProduct ? 'white' : '#64748b', fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
                onClick={() => setIsNewProduct(true)}
              >
                New Product
              </button>
              <button
                className={`download-button`}
                data-testid="existing-product-toggle"
                style={{ background: !isNewProduct ? '#a78bfa' : '#e2e8f0', color: !isNewProduct ? 'white' : '#64748b', fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
                onClick={() => setIsNewProduct(false)}
              >
                Existing Product ({products.length})
              </button>
            </div>

            {isNewProduct ? (
              <>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input className="form-select" data-testid="qc-product-name" placeholder="e.g., Wellness Bundle Pro"
                    value={productName} onChange={e => setProductName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" data-testid="qc-product-desc" placeholder="What does this product do?"
                    rows={2} value={productDesc} onChange={e => setProductDesc(e.target.value)} />
                </div>
                <div className="options-grid">
                  <div className="form-group">
                    <label className="form-label">Affiliate Link *</label>
                    <input className="form-select" data-testid="qc-product-link" placeholder="https://..."
                      value={productLink} onChange={e => setProductLink(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price ($)</label>
                    <input className="form-select" data-testid="qc-product-price" type="number" step="0.01" placeholder="29.99"
                      value={productPrice} onChange={e => setProductPrice(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" data-testid="qc-product-category"
                      value={productCategory} onChange={e => setProductCategory(e.target.value)}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {products.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '1rem' }}>No products yet. Create a new one above.</p>
                ) : products.map(p => (
                  <div key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    data-testid={`select-product-${p.id}`}
                    style={{
                      padding: '1rem', borderRadius: '12px', cursor: 'pointer',
                      border: `2px solid ${selectedProduct?.id === p.id ? '#a78bfa' : '#e2e8f0'}`,
                      background: selectedProduct?.id === p.id ? 'rgba(167,139,250,0.05)' : '#f8fafc',
                      transition: 'all 0.2s'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{p.name}</span>
                      {p.price > 0 && <span style={{ fontWeight: 700, color: '#10b981' }}>${p.price.toFixed(2)}</span>}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{p.category}</p>
                  </div>
                ))}
              </div>
            )}

            <button className="generate-button" data-testid="step-1-next" style={{ marginTop: '1.5rem' }} onClick={handleNext}>
              Next: Describe Your Video
              <ChevronRight size={20} style={{ display: 'inline', marginLeft: '8px' }} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Video Description */}
      {step === 2 && (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 2rem' }}>
          <div className="generator-card" data-testid="step-2-video">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                <Video size={22} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                Step 2: Describe Your Video
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 600 }}>
                for "{selectedProduct?.name || productName}"
              </span>
            </div>

            {/* Quick prompt buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {QUICK_PROMPTS.map((qp, i) => (
                <button key={i}
                  className="download-button"
                  data-testid={`quick-prompt-${i}`}
                  style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', padding: '0.4rem 0.75rem', border: '1px solid #e2e8f0' }}
                  onClick={() => setPrompt(qp.prompt)}
                >
                  <Lightbulb size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {qp.label}
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Video Description</label>
              <textarea className="form-textarea" data-testid="qc-video-prompt"
                placeholder="Describe what you want your promo video to look like..."
                rows={4} value={prompt} onChange={e => setPrompt(e.target.value)} />
            </div>

            <div className="options-grid">
              <div className="form-group">
                <label className="form-label">Resolution</label>
                <select className="form-select" data-testid="qc-video-size" value={size} onChange={e => setSize(e.target.value)}>
                  <option value="1280x720">HD (1280x720)</option>
                  <option value="1792x1024">Widescreen</option>
                  <option value="1024x1792">Portrait</option>
                  <option value="1024x1024">Square</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <select className="form-select" data-testid="qc-video-duration" value={duration} onChange={e => setDuration(e.target.value)}>
                  <option value="4">4 seconds</option>
                  <option value="8">8 seconds</option>
                  <option value="12">12 seconds</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Email for Notification (optional)</label>
              <input className="form-select" data-testid="qc-notify-email" type="email"
                placeholder="your@email.com — we'll let you know when it's ready"
                value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} />
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Get an email the moment your video is done. No waiting around!
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="download-button" style={{ background: '#64748b' }} onClick={() => setStep(1)} data-testid="step-2-back">
                Back
              </button>
              <button className="generate-button" style={{ flex: 1 }} data-testid="step-2-generate" onClick={handleNext}>
                <Sparkles size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Generate Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Generating */}
      {step === 3 && (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 2rem' }}>
          <div className="generator-card" data-testid="step-3-generating" style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{ width: '48px', height: '48px', margin: '0 auto 1.5rem', borderWidth: '4px' }}></div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
              Creating Your Video...
            </h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              AI is building your promo video for <strong>{selectedProduct?.name || productName}</strong>
            </p>

            <div className="progress-container" style={{ background: 'rgba(241,245,249,0.8)', border: '1px solid #e2e8f0' }}>
              <div className="progress-header">
                <span className="progress-title" style={{ color: '#1e293b' }}>Processing</span>
                <span className="progress-time" style={{ color: '#64748b' }} data-testid="qc-elapsed">{formatTime(elapsedTime)}</span>
              </div>
              <div className="progress-bar-track" style={{ background: '#e2e8f0' }}>
                <div className="progress-bar-fill" style={{ width: `${Math.min(95, (elapsedTime / 180) * 100)}%` }} />
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.75rem' }}>
                This usually takes 2-5 minutes. You'll see your video as soon as it's ready.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 2rem' }}>
          <div className="generator-card" data-testid="step-4-review">
            {videoStatus === 'completed' && videoUrl ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <CheckCircle2 size={24} color="#22c55e" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>
                    Video Ready — Please Review
                  </h3>
                </div>

                <video controls src={videoUrl} data-testid="qc-video-player"
                  style={{ width: '100%', borderRadius: '12px', marginBottom: '1.5rem', background: '#000' }} />

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 500 }}>
                    Happy with this video? Click <strong>"Approve & Publish"</strong> to link it to
                    <strong> {selectedProduct?.name || productName}</strong> and list it in your store.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="generate-button" data-testid="approve-publish-button" style={{ flex: 1 }} onClick={handleApproveAndPublish}>
                    <Store size={20} style={{ display: 'inline', marginRight: '8px' }} />
                    Approve & Publish to Store
                  </button>
                  <button className="download-button" data-testid="qc-download-button" style={{ background: '#10b981' }}
                    onClick={() => window.open(videoUrl, '_blank')}>
                    <Download size={18} style={{ display: 'inline', marginRight: '4px' }} />
                    Download
                  </button>
                  <button className="download-button" data-testid="retry-button" style={{ background: '#f59e0b' }} onClick={handleRetry}>
                    <RotateCcw size={18} style={{ display: 'inline', marginRight: '4px' }} />
                    Retry
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <XCircle size={24} color="#ef4444" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>
                    Video Generation Failed
                  </h3>
                </div>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                  Something went wrong. This can happen occasionally. Try again with a slightly different description.
                </p>
                <button className="generate-button" data-testid="retry-after-fail-button" onClick={handleRetry}>
                  <RotateCcw size={20} style={{ display: 'inline', marginRight: '8px' }} />
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickCreate;
