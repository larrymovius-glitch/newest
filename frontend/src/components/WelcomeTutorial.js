import { useState, useEffect } from 'react';
import { X, Play, ChevronRight, ChevronLeft, Sparkles, Package, Video, Store, CheckCircle2 } from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    id: 1,
    title: "Welcome to EZ AD Creator",
    subtitle: "Your path to earning from home",
    description: "This app helps you create professional video ads for products you want to promote. No experience needed - we'll guide you every step of the way.",
    icon: Sparkles,
    color: "#a78bfa",
    tips: [
      "You don't need any video editing skills",
      "AI creates the videos for you",
      "Start earning by sharing your videos"
    ]
  },
  {
    id: 2,
    title: "Step 1: Add Your Product",
    subtitle: "What do you want to promote?",
    description: "First, tell us about a product you want to sell. This could be anything - health supplements, gadgets, clothing, or services. You'll need an affiliate link (the special link that tracks your sales).",
    icon: Package,
    color: "#10b981",
    tips: [
      "Get affiliate links from Amazon, ClickBank, or other programs",
      "Pick products you believe in",
      "You can add as many products as you want"
    ]
  },
  {
    id: 3,
    title: "Step 2: Create Your Video",
    subtitle: "AI does the hard work",
    description: "Just describe what you want to show in your video. Our AI (powered by Sora 2) will create a professional video for you in minutes. No cameras, no editing software needed.",
    icon: Video,
    color: "#f59e0b",
    tips: [
      "Be specific about what you want to see",
      "Use our templates for quick ideas",
      "Videos are ready in just a few minutes"
    ]
  },
  {
    id: 4,
    title: "Step 3: Share & Earn",
    subtitle: "Your videos work for you",
    description: "Download your videos and share them on social media, YouTube, or anywhere people can see them. When someone clicks your link and buys, you earn a commission!",
    icon: Store,
    color: "#f472b6",
    tips: [
      "Share on TikTok, Instagram, Facebook, YouTube",
      "The more you share, the more you can earn",
      "Your videos are yours forever"
    ]
  }
];

export const WelcomeTutorial = ({ onClose, forceShow = false }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen the tutorial
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial || forceShow) {
      setIsVisible(true);
    }
  }, [forceShow]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <div className="tutorial-overlay" data-testid="welcome-tutorial">
      <div className="tutorial-modal">
        {/* Close button */}
        <button 
          className="tutorial-close" 
          onClick={handleSkip}
          data-testid="tutorial-close"
          aria-label="Close tutorial"
        >
          <X size={24} />
        </button>

        {/* Progress dots */}
        <div className="tutorial-progress">
          {TUTORIAL_STEPS.map((_, idx) => (
            <button
              key={idx}
              className={`tutorial-dot ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
              onClick={() => setCurrentStep(idx)}
              aria-label={`Go to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="tutorial-content">
          <div className="tutorial-icon" style={{ background: `${step.color}20`, color: step.color }}>
            <Icon size={48} />
          </div>

          <h2 className="tutorial-title">{step.title}</h2>
          <p className="tutorial-subtitle" style={{ color: step.color }}>{step.subtitle}</p>
          
          <p className="tutorial-description">{step.description}</p>

          <div className="tutorial-tips">
            {step.tips.map((tip, idx) => (
              <div key={idx} className="tutorial-tip">
                <CheckCircle2 size={18} style={{ color: step.color, flexShrink: 0 }} />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="tutorial-nav">
          <button 
            className="tutorial-nav-btn secondary"
            onClick={handlePrev}
            disabled={currentStep === 0}
            data-testid="tutorial-prev"
          >
            <ChevronLeft size={20} />
            Back
          </button>

          <button 
            className="tutorial-nav-btn primary"
            onClick={handleNext}
            data-testid="tutorial-next"
          >
            {isLastStep ? (
              <>
                <Play size={20} />
                Get Started!
              </>
            ) : (
              <>
                Next
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>

        {/* Skip link */}
        <button 
          className="tutorial-skip"
          onClick={handleSkip}
          data-testid="tutorial-skip"
        >
          Skip tutorial
        </button>
      </div>
    </div>
  );
};

export default WelcomeTutorial;
