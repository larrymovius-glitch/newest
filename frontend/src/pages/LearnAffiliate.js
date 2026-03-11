import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, ChevronRight, ChevronLeft, Lightbulb, Link2, Video, 
  Share2, DollarSign, ShoppingBag, CheckCircle, ExternalLink,
  HelpCircle, BookOpen, Target, TrendingUp
} from 'lucide-react';

const TUTORIAL_SECTIONS = [
  {
    id: 'intro',
    title: "What is Affiliate Marketing?",
    icon: Lightbulb,
    color: "#f59e0b",
    content: {
      headline: "Earn Money by Sharing Products You Love",
      description: "Affiliate marketing is simple: you share a special link to a product. When someone buys through your link, you earn a commission (usually 5-50% of the sale). No inventory, no shipping, no customer service - just share and earn!",
      example: "Example: You share a $50 health supplement. Someone buys it through your link. You earn $15 commission. Share it 10 times a day, get 2 sales = $30/day = $900/month!",
      tips: [
        "You don't need to buy the product first",
        "You don't handle shipping or returns",
        "You can promote multiple products at once",
        "The more you share, the more you earn"
      ]
    }
  },
  {
    id: 'links',
    title: "Where to Get Affiliate Links",
    icon: Link2,
    color: "#a78bfa",
    content: {
      headline: "Getting Your Special Links",
      description: "Affiliate links are special URLs that track sales back to you. Many companies offer affiliate programs. Here are the most popular places to get started:",
      example: "",
      sources: [
        { name: "Amazon Associates", url: "https://affiliate-program.amazon.com", desc: "Millions of products, trusted brand" },
        { name: "ClickBank", url: "https://www.clickbank.com", desc: "Digital products, high commissions (50-75%)" },
        { name: "ShareASale", url: "https://www.shareasale.com", desc: "Thousands of brands and products" },
        { name: "CJ Affiliate", url: "https://www.cj.com", desc: "Major retailers like Home Depot, GoPro" },
        { name: "Rakuten", url: "https://rakutenadvertising.com", desc: "Big brands like Walmart, Best Buy" }
      ],
      tips: [
        "Sign up is usually free",
        "Once approved, you get unique links for any product",
        "Copy your link and paste it when adding products here"
      ]
    }
  },
  {
    id: 'create',
    title: "Creating Your Video Ad",
    icon: Video,
    color: "#10b981",
    content: {
      headline: "Let AI Create Stunning Videos",
      description: "This is where the magic happens! Just describe what you want to show, and our AI creates a professional video. No filming, no editing - just type and generate.",
      example: "",
      steps: [
        { step: 1, text: "Go to Quick Create", action: "Click 'Quick Create' in the menu" },
        { step: 2, text: "Add your product", action: "Enter product name, description, and paste your affiliate link" },
        { step: 3, text: "Describe your video", action: "Tell the AI what you want: 'Show a person feeling energetic after taking vitamins'" },
        { step: 4, text: "Generate & wait", action: "AI creates your video in 2-5 minutes" },
        { step: 5, text: "Download", action: "Save your video to share anywhere" }
      ],
      tips: [
        "Be specific in descriptions for better results",
        "Use templates for quick ideas",
        "Try different styles until you find what works"
      ]
    }
  },
  {
    id: 'share',
    title: "Sharing & Making Money",
    icon: Share2,
    color: "#f472b6",
    content: {
      headline: "Share Everywhere, Earn Everywhere",
      description: "Your video is ready! Now share it on social media with your affiliate link. When people watch, click, and buy - you earn money!",
      example: "",
      platforms: [
        { name: "TikTok", tip: "Short, catchy videos perform best. Post 2-3 times daily." },
        { name: "Instagram Reels", tip: "Use trending sounds and hashtags" },
        { name: "Facebook", tip: "Share in groups related to your product" },
        { name: "YouTube Shorts", tip: "Great for product demos and reviews" },
        { name: "Pinterest", tip: "Excellent for lifestyle and home products" }
      ],
      tips: [
        "Always include your affiliate link in bio or description",
        "Be consistent - post daily for best results",
        "Engage with comments to boost visibility",
        "Track which videos get the most clicks"
      ]
    }
  },
  {
    id: 'success',
    title: "Tips for Success",
    icon: TrendingUp,
    color: "#3b82f6",
    content: {
      headline: "Turn This Into Real Income",
      description: "Affiliate marketing is a real business. Here's how successful people make it work:",
      example: "",
      successTips: [
        { title: "Pick products you believe in", desc: "Your enthusiasm shows and builds trust" },
        { title: "Focus on solving problems", desc: "Show how the product helps, not just features" },
        { title: "Be consistent", desc: "Post every day, even when results are slow at first" },
        { title: "Test and learn", desc: "Try different products and video styles" },
        { title: "Build an audience", desc: "Same people will buy from you again and again" },
        { title: "Don't give up", desc: "It takes 30-90 days to see real results" }
      ],
      tips: []
    }
  }
];

const LearnAffiliate = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(0);

  const section = TUTORIAL_SECTIONS[activeSection];
  const Icon = section.icon;

  const nextSection = () => {
    if (activeSection < TUTORIAL_SECTIONS.length - 1) {
      setActiveSection(activeSection + 1);
    }
  };

  const prevSection = () => {
    if (activeSection > 0) {
      setActiveSection(activeSection - 1);
    }
  };

  return (
    <div className="learn-page">
      <div className="learn-header">
        <div className="learn-badge">
          <BookOpen size={18} />
          <span>Free Training</span>
        </div>
        <h1 className="learn-title">Learn Affiliate Marketing</h1>
        <p className="learn-subtitle">Everything you need to know to start earning</p>
      </div>

      {/* Progress */}
      <div className="learn-progress">
        {TUTORIAL_SECTIONS.map((s, idx) => {
          const SIcon = s.icon;
          return (
            <button
              key={s.id}
              className={`learn-progress-item ${idx === activeSection ? 'active' : ''} ${idx < activeSection ? 'completed' : ''}`}
              onClick={() => setActiveSection(idx)}
              style={{ '--accent-color': s.color }}
            >
              <div className="learn-progress-icon">
                <SIcon size={20} />
              </div>
              <span>{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="learn-content">
        <div className="learn-card" style={{ '--accent-color': section.color }}>
          <div className="learn-card-header">
            <div className="learn-card-icon" style={{ background: `${section.color}20`, color: section.color }}>
              <Icon size={32} />
            </div>
            <div>
              <h2>{section.content.headline}</h2>
              <p className="learn-step-indicator">Step {activeSection + 1} of {TUTORIAL_SECTIONS.length}</p>
            </div>
          </div>

          <p className="learn-description">{section.content.description}</p>

          {section.content.example && (
            <div className="learn-example">
              <Target size={18} />
              <p>{section.content.example}</p>
            </div>
          )}

          {/* Sources for affiliate links */}
          {section.content.sources && (
            <div className="learn-sources">
              <h3>Popular Affiliate Programs:</h3>
              {section.content.sources.map((source, idx) => (
                <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="learn-source-item">
                  <div>
                    <strong>{source.name}</strong>
                    <p>{source.desc}</p>
                  </div>
                  <ExternalLink size={18} />
                </a>
              ))}
            </div>
          )}

          {/* Steps */}
          {section.content.steps && (
            <div className="learn-steps">
              <h3>How to do it:</h3>
              {section.content.steps.map((step) => (
                <div key={step.step} className="learn-step-item">
                  <div className="learn-step-number" style={{ background: section.color }}>{step.step}</div>
                  <div>
                    <strong>{step.text}</strong>
                    <p>{step.action}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Platforms */}
          {section.content.platforms && (
            <div className="learn-platforms">
              <h3>Where to share:</h3>
              {section.content.platforms.map((platform, idx) => (
                <div key={idx} className="learn-platform-item">
                  <strong>{platform.name}</strong>
                  <p>{platform.tip}</p>
                </div>
              ))}
            </div>
          )}

          {/* Success tips */}
          {section.content.successTips && (
            <div className="learn-success-tips">
              {section.content.successTips.map((tip, idx) => (
                <div key={idx} className="learn-success-item">
                  <CheckCircle size={20} style={{ color: section.color }} />
                  <div>
                    <strong>{tip.title}</strong>
                    <p>{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          {section.content.tips && section.content.tips.length > 0 && (
            <div className="learn-tips">
              <h3><Lightbulb size={18} /> Pro Tips:</h3>
              <ul>
                {section.content.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="learn-nav">
          <button 
            className="learn-nav-btn secondary" 
            onClick={prevSection}
            disabled={activeSection === 0}
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          {activeSection === TUTORIAL_SECTIONS.length - 1 ? (
            <button 
              className="learn-nav-btn primary"
              onClick={() => navigate('/quick-create')}
            >
              <Play size={20} />
              Start Creating!
            </button>
          ) : (
            <button 
              className="learn-nav-btn primary"
              onClick={nextSection}
            >
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnAffiliate;
