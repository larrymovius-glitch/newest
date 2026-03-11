import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Video, Download, Wand2, Crown, Lock, Check,
  Zap, Copy, Share2, ShoppingBag, Star, Play
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QUICK_PROMPTS = [
  "Professional product showcase with dramatic lighting and smooth camera movement",
  "Energetic social media ad with bold text overlays and fast cuts",
  "Lifestyle video showing happy customer using the product",
  "Before and after transformation with side-by-side comparison",
  "Unboxing experience with close-up details and excitement",
  "Testimonial style with authentic feel and emotional connection"
];

const AnyAdPro = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [progress, setProgress] = useState(0);

  // Check if user has AnyAdPro access
  const hasAccess = user?.anyadpro_access || user?.plan === 'anyadpro' || user?.plan === 'anyadpro_lifetime';

  const handleGenerate = async () => {
    if (!productName.trim() || !videoPrompt.trim()) {
      toast.error('Please enter product name and video description');
      return;
    }

    setGenerating(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 90));
    }, 2000);

    try {
      const fullPrompt = `Create a professional advertisement video for "${productName}". ${description ? `Product details: ${description}.` : ''} Video style: ${videoPrompt}`;
      
      const response = await axios.post(`${API}/videos/generate`, {
        prompt: fullPrompt,
        model: 'sora-2',
        size: '1280x720',
        duration: 4
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Poll for completion
      const videoId = response.data.id;
      let video = response.data;
      
      while (video.status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const statusRes = await axios.get(`${API}/videos/${videoId}`);
        video = statusRes.data;
      }

      clearInterval(progressInterval);
      setProgress(100);

      if (video.status === 'completed') {
        setGeneratedVideo(video);
        toast.success('Your ad is ready!');
      } else {
        toast.error('Video generation failed. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate video');
    }

    clearInterval(progressInterval);
    setGenerating(false);
  };

  const handleDownload = () => {
    if (generatedVideo) {
      window.open(`${BACKEND_URL}${generatedVideo.video_url}`, '_blank');
      toast.success('Downloading your ad!');
    }
  };

  const handleUpgrade = async (planType) => {
    try {
      const response = await axios.post(`${API}/checkout/create?plan_id=${planType}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      window.location.href = response.data.url;
    } catch (error) {
      toast.error('Failed to start checkout');
    }
  };

  const applyQuickPrompt = (prompt) => {
    setVideoPrompt(prompt);
    toast.success('Prompt added!');
  };

  // Show upgrade screen if no access
  if (!hasAccess) {
    return (
      <div className="anyadpro-page">
        <div className="anyadpro-upgrade">
          <div className="anyadpro-upgrade-badge">
            <Crown size={24} />
            <span>Bonus Feature</span>
          </div>
          
          <h1 className="anyadpro-upgrade-title">
            <span className="anyadpro-gradient">AnyAdPro</span>
          </h1>
          
          <p className="anyadpro-upgrade-subtitle">
            Create ads for ANY product you want to sell — not just affiliates!
          </p>

          <div className="anyadpro-features">
            <div className="anyadpro-feature">
              <ShoppingBag size={24} />
              <div>
                <h3>Sell Anything</h3>
                <p>Your own products, services, local business — anything!</p>
              </div>
            </div>
            <div className="anyadpro-feature">
              <Video size={24} />
              <div>
                <h3>Pro-Quality Ads</h3>
                <p>Same AI power, designed for direct sales</p>
              </div>
            </div>
            <div className="anyadpro-feature">
              <Download size={24} />
              <div>
                <h3>Download & Use</h3>
                <p>No watermarks, no restrictions — it's yours</p>
              </div>
            </div>
            <div className="anyadpro-feature">
              <Zap size={24} />
              <div>
                <h3>Quick Prompts</h3>
                <p>Pre-made styles to get you started fast</p>
              </div>
            </div>
          </div>

          <div className="anyadpro-pricing">
            <div className="anyadpro-plan">
              <h3>Monthly</h3>
              <div className="anyadpro-price">
                <span className="amount">$4.99</span>
                <span className="period">/month</span>
              </div>
              <ul>
                <li><Check size={16} /> Unlimited ad creation</li>
                <li><Check size={16} /> All video styles</li>
                <li><Check size={16} /> Download & share</li>
                <li><Check size={16} /> Cancel anytime</li>
              </ul>
              <button className="anyadpro-btn" onClick={() => handleUpgrade('anyadpro')}>
                Get Monthly Access
              </button>
            </div>

            <div className="anyadpro-plan featured">
              <div className="anyadpro-plan-badge">Best Value</div>
              <h3>Lifetime</h3>
              <div className="anyadpro-price">
                <span className="amount">$19</span>
                <span className="period">one-time</span>
              </div>
              <ul>
                <li><Check size={16} /> Everything in Monthly</li>
                <li><Check size={16} /> Pay once, use forever</li>
                <li><Check size={16} /> Future updates included</li>
                <li><Check size={16} /> Priority support</li>
              </ul>
              <button className="anyadpro-btn primary" onClick={() => handleUpgrade('anyadpro_lifetime')}>
                <Star size={18} />
                Get Lifetime Access
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="anyadpro-page">
      <div className="anyadpro-header">
        <div className="anyadpro-badge-unlocked">
          <Crown size={18} />
          <span>AnyAdPro Unlocked</span>
        </div>
        <h1 className="anyadpro-title">Create Ads for Any Product</h1>
        <p className="anyadpro-subtitle">Sell your own products, services, or anything you want!</p>
      </div>

      <div className="anyadpro-container">
        {/* Left: Form */}
        <div className="anyadpro-form-section">
          <div className="anyadpro-card">
            <h2><ShoppingBag size={20} /> What are you selling?</h2>
            
            <div className="anyadpro-field">
              <label>Product / Service Name *</label>
              <input
                type="text"
                placeholder="e.g., Handmade Candles, Web Design Services, My Bakery"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div className="anyadpro-field">
              <label>Description (optional)</label>
              <textarea
                placeholder="Tell us about your product - features, benefits, what makes it special..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="anyadpro-field">
              <label><Wand2 size={16} /> Video Style *</label>
              <textarea
                placeholder="Describe how you want your ad to look..."
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                rows={3}
              />
            </div>

            {/* Quick prompts */}
            <div className="anyadpro-quick-prompts">
              <p>Quick styles (click to use):</p>
              <div className="anyadpro-prompts-grid">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button 
                    key={idx} 
                    className="anyadpro-prompt-btn"
                    onClick={() => applyQuickPrompt(prompt)}
                  >
                    {prompt.substring(0, 40)}...
                  </button>
                ))}
              </div>
            </div>

            <button 
              className="anyadpro-generate-btn"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <div className="spinner-small" />
                  Creating Your Ad...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Ad Video
                </>
              )}
            </button>

            {generating && (
              <div className="anyadpro-progress">
                <div className="anyadpro-progress-bar" style={{ width: `${progress}%` }} />
                <p>{progress < 100 ? 'AI is creating your ad...' : 'Almost done!'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="anyadpro-preview-section">
          <div className="anyadpro-card">
            <h2><Video size={20} /> Your Ad</h2>
            
            {generatedVideo ? (
              <div className="anyadpro-video-ready">
                <video
                  src={`${BACKEND_URL}${generatedVideo.video_url}`}
                  controls
                  className="anyadpro-video"
                />
                
                <div className="anyadpro-actions">
                  <button className="anyadpro-action-btn primary" onClick={handleDownload}>
                    <Download size={18} />
                    Download Video
                  </button>
                  <button className="anyadpro-action-btn" onClick={() => {
                    navigator.clipboard.writeText(`${BACKEND_URL}${generatedVideo.video_url}`);
                    toast.success('Link copied!');
                  }}>
                    <Copy size={18} />
                    Copy Link
                  </button>
                </div>

                <div className="anyadpro-tips">
                  <h3>Now share it:</h3>
                  <ul>
                    <li>Post on TikTok, Instagram, Facebook</li>
                    <li>Add to your website or store</li>
                    <li>Send to customers via email/text</li>
                    <li>Use in paid ads (Facebook Ads, Google Ads)</li>
                  </ul>
                </div>

                <button 
                  className="anyadpro-new-btn"
                  onClick={() => {
                    setGeneratedVideo(null);
                    setProductName('');
                    setDescription('');
                    setVideoPrompt('');
                  }}
                >
                  <Sparkles size={18} />
                  Create Another Ad
                </button>
              </div>
            ) : (
              <div className="anyadpro-empty-preview">
                <Play size={48} />
                <p>Your video will appear here</p>
                <span>Fill in the details and click Generate</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnyAdPro;
