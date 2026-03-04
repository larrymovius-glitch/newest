import { useNavigate } from 'react-router-dom';
import { Sparkles, Wand2, Video, History, FileText, Layers, Users, BarChart3, Calendar, Plus } from 'lucide-react';
import { useEffect } from 'react';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Create animated particles
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
      particle.style.opacity = Math.random() * 0.5 + 0.3;
      document.querySelector('.hero-section')?.appendChild(particle);
      
      setTimeout(() => particle.remove(), 5000);
    };

    const interval = setInterval(createParticle, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-section">
      <div className="hero-content">
        <div className="logo-section">
          <h1 className="logo-text" data-testid="app-logo">Affiliate Pro</h1>
          <p className="branding-text cursive-font" data-testid="branding-text">Another development by Movius</p>
        </div>
        
        <h2 className="hero-title" data-testid="hero-title">
          AI-Powered Video Generation
          <br />Made Simple
        </h2>
        
        <p className="hero-subtitle" data-testid="hero-subtitle">
          Create stunning tutorial and promotional videos in seconds with the power of Sora 2.
          No video editing skills required - just describe what you want.
        </p>
        
        <div className="cta-buttons">
          <button 
            className="cta-button pulse-glow" 
            data-testid="get-started-button"
            onClick={() => navigate('/generate')}
          >
            <Sparkles size={20} style={{ display: 'inline', marginRight: '8px' }} />
            Start Creating
          </button>
          
          <button 
            className="cta-button secondary" 
            data-testid="browse-templates-button"
            onClick={() => navigate('/templates')}
          >
            <FileText size={20} style={{ display: 'inline', marginRight: '8px' }} />
            Browse Templates
          </button>
        </div>
        
        <div className="features-grid">
          <div className="feature-card" data-testid="feature-text-to-video" onClick={() => navigate('/generate')} style={{ cursor: 'pointer' }}>
            <div className="feature-icon">
              <Wand2 size={40} color="#a78bfa" />
            </div>
            <h3 className="feature-title">Text to Video</h3>
            <p className="feature-description">
              Simply describe your video idea and watch AI bring it to life with professional quality.
            </p>
          </div>
          
          <div className="feature-card" data-testid="feature-templates" onClick={() => navigate('/templates')} style={{ cursor: 'pointer' }}>
            <div className="feature-icon">
              <FileText size={40} color="#a78bfa" />
            </div>
            <h3 className="feature-title">Pro Templates</h3>
            <p className="feature-description">
              Start with professionally crafted templates for tutorials, ads, and branding videos.
            </p>
          </div>
          
          <div className="feature-card" data-testid="feature-batch-generation" onClick={() => navigate('/batch')} style={{ cursor: 'pointer' }}>
            <div className="feature-icon">
              <Layers size={40} color="#a78bfa" />
            </div>
            <h3 className="feature-title">Batch Generation</h3>
            <p className="feature-description">
              Generate multiple videos at once and save time on your content creation workflow.
            </p>
          </div>
          
          <div className="feature-card" data-testid="feature-video-library" onClick={() => navigate('/library')} style={{ cursor: 'pointer' }}>
            <div className="feature-icon">
              <History size={40} color="#a78bfa" />
            </div>
            <h3 className="feature-title">Video Library</h3>
            <p className="feature-description">
              Access all your generated videos anytime. Download and use them wherever you need.
            </p>
          </div>
          
          <div className="feature-card" data-testid="feature-community" onClick={() => navigate('/gallery')} style={{ cursor: 'pointer' }}>
            <div className="feature-icon">
              <Users size={40} color="#f472b6" />
            </div>
            <h3 className="feature-title">Community Gallery</h3>
            <p className="feature-description">
              Share your creations and get inspired by videos from the community.
            </p>
          </div>
          
          <div className="feature-card" data-testid="feature-social-sharing" style={{ cursor: 'pointer' }} onClick={() => navigate('/analytics')}>
            <div className="feature-icon">
              <BarChart3 size={40} color="#f472b6" />
            </div>
            <h3 className="feature-title">Analytics Dashboard</h3>
            <p className="feature-description">
              Track views, engagement, and performance metrics for all your videos.
            </p>
          </div>
          
          <div className="feature-card" data-testid="feature-template-creator" style={{ cursor: 'pointer' }} onClick={() => navigate('/template-creator')}>
            <div className="feature-icon">
              <Plus size={40} color="#f472b6" />
            </div>
            <h3 className="feature-title">Template Creator</h3>
            <p className="feature-description">
              Save your best prompts as custom templates for quick reuse.
            </p>
          </div>
          
          <div className="feature-card" data-testid="feature-scheduled" style={{ cursor: 'pointer' }} onClick={() => navigate('/scheduled')}>
            <div className="feature-icon">
              <Calendar size={40} color="#60a5fa" />
            </div>
            <h3 className="feature-title">Scheduled Posts</h3>
            <p className="feature-description">
              Schedule videos to auto-post to social platforms at optimal times.
            </p>
          </div>
          
          <div className="feature-card" data-testid="feature-team" style={{ cursor: 'pointer' }} onClick={() => navigate('/team')}>
            <div className="feature-icon">
              <Users size={40} color="#60a5fa" />
            </div>
            <h3 className="feature-title">Team Collaboration</h3>
            <p className="feature-description">
              Invite team members and collaborate on video projects together.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
