import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Lightbulb, TrendingUp, Shuffle, Zap, Download, FolderOpen, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TRENDING_STYLES = [
  {
    title: "Dynamic Product Showcase",
    description: "Fast-paced, energetic reveals with smooth camera movements",
    example: "Dynamic showcase of our affiliate dashboard with smooth zoom transitions, modern UI elements floating in, vibrant colors, and energetic pacing"
  },
  {
    title: "Minimalist Tutorial",
    description: "Clean, simple animations with clear step-by-step visuals",
    example: "Step-by-step tutorial showing affiliate link creation process, minimalist white background, clean text overlays, gentle transitions, professional and easy to follow"
  },
  {
    title: "Cinematic Brand Story",
    description: "High-quality visuals with emotional storytelling",
    example: "Cinematic video showing entrepreneur's journey using affiliate platform, golden hour lighting, inspiring music vibes, slow-motion success moments, emotional and motivating"
  },
  {
    title: "Social Media Quick Hit",
    description: "Attention-grabbing, vertical format for maximum engagement",
    example: "15-second attention-grabbing ad for mobile, quick cuts, bold text overlays, 'Make Money Now' hook, vibrant colors, optimized for Instagram Reels and TikTok"
  },
  {
    title: "Explainer Animation",
    description: "Animated graphics explaining complex concepts simply",
    example: "Animated explainer showing how affiliate commissions work, colorful icons, smooth transitions between steps, friendly and approachable tone, easy to understand"
  },
  {
    title: "Testimonial Style",
    description: "Real-world success scenarios with authentic feel",
    example: "Realistic scene of person celebrating affiliate earnings on laptop, natural lighting, genuine excitement, relatable home office setup, authentic and trustworthy feel"
  }
];

const VIDEO_TYPES = [
  {
    type: "Tutorial",
    tips: "Focus on clear step-by-step instructions, use screen recordings style, add helpful annotations",
    examples: [
      "Professional tutorial demonstrating affiliate link setup, clean screen recording style, pointer highlights, step numbers, easy to follow pace",
      "How-to guide for beginners, friendly instructor vibe, bright studio lighting, clear explanations with visual aids"
    ]
  },
  {
    type: "Advertisement",
    tips: "Start with a hook, showcase benefits quickly, end with strong call-to-action",
    examples: [
      "High-energy ad starting with 'Tired of low commissions?', showcase platform benefits in 5 seconds, end with 'Join Now' CTA, modern and sleek",
      "Problem-solution ad format, show frustrated marketer then happy affiliate earning, fast cuts, upbeat background music feel"
    ]
  },
  {
    type: "Product Demo",
    tips: "Highlight key features, show real use cases, maintain professional quality",
    examples: [
      "Complete platform walkthrough, smooth navigation between features, highlight analytics dashboard, professional corporate style",
      "Feature spotlight video focusing on real-time earnings tracker, close-ups on numbers growing, exciting and dynamic"
    ]
  },
  {
    type: "Social Proof",
    tips: "Show real results, use statistics, build trust and credibility",
    examples: [
      "Success story montage, show earnings screenshots, happy affiliates, growth charts, trustworthy and inspiring tone",
      "Before and after comparison, struggling marketer vs successful affiliate, dramatic transformation, motivational"
    ]
  }
];

const QUICK_TIPS = [
  "Be specific about camera angles, lighting, and movement for better results",
  "Include mood and tone keywords (energetic, calm, professional, playful)",
  "Mention specific visual elements you want (charts, icons, text overlays)",
  "Describe the pacing (fast-paced, slow-motion, smooth transitions)",
  "Add context about the target audience for more relevant content",
  "Use trending visual styles: neon accents, glass morphism, 3D elements",
  "Specify the emotion you want viewers to feel (excited, inspired, curious)",
  "Include action words (zooming, floating, revealing, transforming)"
];

const Generator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('sora-2');
  const [size, setSize] = useState('1280x720');
  const [duration, setDuration] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [videoStatus, setVideoStatus] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [currentTip, setCurrentTip] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (location.state?.template) {
      const template = location.state.template;
      setPrompt(template.prompt);
      setModel(template.model);
      setSize(template.size);
      setDuration(template.duration);
      setShowSuggestions(false);
    }
  }, [location]);

  const applyExample = (examplePrompt) => {
    setPrompt(examplePrompt);
    setShowSuggestions(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generateRandomIdea = () => {
    const randomStyle = TRENDING_STYLES[Math.floor(Math.random() * TRENDING_STYLES.length)];
    setPrompt(randomStyle.example);
    setShowSuggestions(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % QUICK_TIPS.length);
    }, 5000);
    return () => clearInterval(tipInterval);
  }, []);

  // Timer for generation progress
  useEffect(() => {
    if (isGenerating) {
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isGenerating]);

  const checkVideoStatus = async (id) => {
    try {
      const response = await axios.get(`${API}/videos/${id}`);
      const video = response.data;
      setVideoStatus(video.status);
      
      if (video.status === 'completed') {
        setVideoUrl(`${BACKEND_URL}${video.video_url}`);
        setIsGenerating(false);
      } else if (video.status === 'failed') {
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Error checking video status:', error);
    }
  };

  useEffect(() => {
    if (videoId && videoStatus !== 'completed' && videoStatus !== 'failed') {
      const interval = setInterval(() => {
        checkVideoStatus(videoId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [videoId, videoStatus]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      alert('Please enter a video description');
      return;
    }
    setIsGenerating(true);
    setVideoId(null);
    setVideoStatus(null);
    setVideoUrl(null);
    
    try {
      const response = await axios.post(`${API}/videos/generate`, {
        prompt,
        model,
        size,
        duration: parseInt(duration)
      });
      setVideoId(response.data.id);
      setVideoStatus(response.data.status);
    } catch (error) {
      console.error('Error generating video:', error);
      alert('Failed to start video generation. Please try again.');
      setIsGenerating(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getEstimatedTime = () => {
    const base = duration === 4 ? 120 : duration === 8 ? 240 : 360;
    return model === 'sora-2-pro' ? base * 1.5 : base;
  };

  const getProgressPercent = () => {
    if (videoStatus === 'completed') return 100;
    if (videoStatus === 'failed') return 0;
    const est = getEstimatedTime();
    return Math.min(95, (elapsedTime / est) * 100);
  };

  const getProgressStep = () => {
    if (videoStatus === 'completed') return 3;
    if (elapsedTime < 10) return 0;
    if (elapsedTime < getEstimatedTime() * 0.5) return 1;
    return 2;
  };

  return (
    <div className="generator-container">
      <div className="generator-header">
        <h1 className="hero-title" style={{ fontSize: '2.5rem' }} data-testid="generator-title">
          Create Your Video
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.125rem' }} data-testid="generator-subtitle">
          Describe your video idea and let AI do the magic
        </p>
      </div>

      {/* AI Tips Banner */}
      <div className="ai-tip-banner" data-testid="ai-tip-banner">
        <Lightbulb size={20} color="#f59e0b" />
        <span className="ai-tip-text">{QUICK_TIPS[currentTip]}</span>
      </div>
      
      <div className="generator-layout">
        <div className="generator-main">
          <div className="generator-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Video Settings</h3>
              <button
                type="button"
                className="random-idea-button"
                data-testid="random-idea-button"
                onClick={generateRandomIdea}
              >
                <Shuffle size={18} style={{ marginRight: '6px' }} />
                Random Idea
              </button>
            </div>

            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label className="form-label" data-testid="prompt-label">Video Description</label>
                <textarea
                  className="form-textarea"
                  data-testid="prompt-input"
                  placeholder="Describe your video... e.g., 'A professional tutorial showing how to use our affiliate platform, with smooth transitions and modern graphics'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              
              <div className="options-grid">
                <div className="form-group">
                  <label className="form-label" data-testid="model-label">Quality</label>
                  <select
                    className="form-select"
                    data-testid="model-select"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={isGenerating}
                  >
                    <option value="sora-2">Standard (Sora 2)</option>
                    <option value="sora-2-pro">Pro Quality (Sora 2 Pro)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label" data-testid="size-label">Resolution</label>
                  <select
                    className="form-select"
                    data-testid="size-select"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    disabled={isGenerating}
                  >
                    <option value="1280x720">HD (1280x720)</option>
                    <option value="1792x1024">Widescreen (1792x1024)</option>
                    <option value="1024x1792">Portrait (1024x1792)</option>
                    <option value="1024x1024">Square (1024x1024)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label" data-testid="duration-label">Duration</label>
                  <select
                    className="form-select"
                    data-testid="duration-select"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    disabled={isGenerating}
                  >
                    <option value="4">4 seconds</option>
                    <option value="8">8 seconds</option>
                    <option value="12">12 seconds</option>
                  </select>
                </div>
              </div>
              
              <button
                type="submit"
                className="generate-button"
                data-testid="generate-button"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="loading-spinner"></span>
                    <span style={{ marginLeft: '10px' }}>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} style={{ display: 'inline', marginRight: '8px' }} />
                    Generate Video
                  </>
                )}
              </button>
            </form>
            
            {/* Progress Tracker */}
            {isGenerating && videoStatus === 'processing' && (
              <div className="progress-container" data-testid="progress-container">
                <div className="progress-header">
                  <span className="progress-title">Creating your video...</span>
                  <span className="progress-time" data-testid="elapsed-time">{formatTime(elapsedTime)} elapsed</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${getProgressPercent()}%` }} data-testid="progress-bar" />
                </div>
                <div className="progress-steps">
                  <div className={`progress-step ${getProgressStep() >= 0 ? 'active' : ''} ${getProgressStep() > 0 ? 'done' : ''}`}>
                    <span className="progress-dot" />
                    <span>Queued</span>
                  </div>
                  <div className={`progress-step ${getProgressStep() >= 1 ? 'active' : ''} ${getProgressStep() > 1 ? 'done' : ''}`}>
                    <span className="progress-dot" />
                    <span>Rendering</span>
                  </div>
                  <div className={`progress-step ${getProgressStep() >= 2 ? 'active' : ''} ${getProgressStep() > 2 ? 'done' : ''}`}>
                    <span className="progress-dot" />
                    <span>Finalizing</span>
                  </div>
                  <div className={`progress-step ${getProgressStep() >= 3 ? 'active' : ''}`}>
                    <span className="progress-dot" />
                    <span>Complete</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '1rem', textAlign: 'center' }}>
                  AI video generation typically takes 2-5 minutes. You can wait here or check your Library later.
                </p>
              </div>
            )}

            {videoStatus === 'failed' && (
              <div className="status-card" data-testid="status-card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                <p className="status-text" data-testid="status-text" style={{ color: '#ef4444' }}>
                  Video generation failed. Please try again with a different description.
                </p>
              </div>
            )}
            
            {videoUrl && (
              <div className="video-preview" data-testid="video-preview">
                <div className="status-card" data-testid="status-card" style={{ borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)', marginBottom: '1rem' }}>
                  <p className="status-text" style={{ color: '#22c55e', fontWeight: 600 }}>
                    <CheckCircle2 size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    Your video is ready!
                  </p>
                </div>
                <video
                  className="video-player"
                  data-testid="video-player"
                  controls
                  src={videoUrl}
                />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    className="download-button"
                    data-testid="download-button"
                    onClick={() => window.open(videoUrl, '_blank')}
                  >
                    <Download size={18} style={{ display: 'inline', marginRight: '6px' }} />
                    Download Video
                  </button>
                  <button
                    className="download-button"
                    data-testid="view-library-button"
                    style={{ background: '#667eea' }}
                    onClick={() => navigate('/library')}
                  >
                    <FolderOpen size={18} style={{ display: 'inline', marginRight: '6px' }} />
                    View Library
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Suggestions Sidebar */}
        {showSuggestions && (
          <div className="suggestions-sidebar" data-testid="suggestions-sidebar">
            <div className="suggestions-header">
              <TrendingUp size={24} color="#667eea" />
              <h3>Trending Styles</h3>
            </div>

            {TRENDING_STYLES.map((style, index) => (
              <div 
                key={index} 
                className="suggestion-card" 
                data-testid={`trending-style-${index}`}
              >
                <div className="suggestion-header">
                  <Zap size={18} color="#f59e0b" />
                  <h4>{style.title}</h4>
                </div>
                <p className="suggestion-description">{style.description}</p>
                <button
                  className="use-example-button"
                  data-testid={`use-example-${index}`}
                  onClick={() => applyExample(style.example)}
                >
                  Use This Style
                </button>
              </div>
            ))}

            <div className="suggestions-divider"></div>

            <div className="suggestions-header" style={{ marginTop: '2rem' }}>
              <Lightbulb size={24} color="#667eea" />
              <h3>Video Types</h3>
            </div>

            {VIDEO_TYPES.map((type, index) => (
              <div 
                key={index} 
                className="video-type-card" 
                data-testid={`video-type-${index}`}
              >
                <h4 className="video-type-title">{type.type}</h4>
                <p className="video-type-tips">{type.tips}</p>
                <div className="video-type-examples">
                  {type.examples.map((example, exIndex) => (
                    <button
                      key={exIndex}
                      className="example-chip"
                      data-testid={`example-chip-${index}-${exIndex}`}
                      onClick={() => applyExample(example)}
                    >
                      Example {exIndex + 1}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!showSuggestions && (
          <button
            className="show-suggestions-button"
            data-testid="show-suggestions-button"
            onClick={() => setShowSuggestions(true)}
          >
            <Lightbulb size={20} />
            Show Suggestions
          </button>
        )}
      </div>
    </div>
  );
};

export default Generator;