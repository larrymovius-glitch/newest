import { useNavigate } from 'react-router-dom';
import { Sparkles, Wand2, Video, History } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="hero-section">
      <div className="hero-content">
        <div className="logo-section">
          <h1 className="logo-text" data-testid="app-logo">Affiliate Pro</h1>
          <p className="branding-text" data-testid="branding-text">Movius software design</p>
        </div>
        
        <h2 className="hero-title" data-testid="hero-title">
          AI-Powered Video Generation
          <br />Made Simple
        </h2>
        
        <p className="hero-subtitle" data-testid="hero-subtitle">
          Create stunning tutorial and promotional videos in seconds with the power of Sora 2.
          No video editing skills required - just describe what you want.
        </p>
        
        <button 
          className="cta-button" 
          data-testid="get-started-button"
          onClick={() => navigate('/generate')}
        >
          <Sparkles size={20} style={{ display: 'inline', marginRight: '8px' }} />
          Start Creating
        </button>
        
        <div className="features-grid">
          <div className="feature-card" data-testid="feature-text-to-video">
            <div className="feature-icon">
              <Wand2 size={40} color="#667eea" />
            </div>
            <h3 className="feature-title">Text to Video</h3>
            <p className="feature-description">
              Simply describe your video idea and watch AI bring it to life with professional quality.
            </p>
          </div>
          
          <div className="feature-card" data-testid="feature-multiple-formats">
            <div className="feature-icon">
              <Video size={40} color="#667eea" />
            </div>
            <h3 className="feature-title">Multiple Formats</h3>
            <p className="feature-description">
              Choose from various resolutions and durations. Perfect for tutorials or ads.
            </p>
          </div>
          
          <div className="feature-card" data-testid="feature-video-library">
            <div className="feature-icon">
              <History size={40} color="#667eea" />
            </div>
            <h3 className="feature-title">Video Library</h3>
            <p className="feature-description">
              Access all your generated videos anytime. Download and use them wherever you need.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;