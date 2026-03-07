import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Trash2, Video, Share2, X, Facebook, Instagram, Youtube, Link2, Check, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// TikTok icon component
const TikTokIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// X/Twitter icon
const XIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const SOCIAL_PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: '#000000', bg: '#00f2ea' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#ffffff', bg: '#1877f2' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#ffffff', bg: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#ffffff', bg: '#ff0000' },
  { id: 'twitter', name: 'X', icon: XIcon, color: '#ffffff', bg: '#000000' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: '#ffffff', bg: '#25d366' },
];

const ShareModal = ({ video, onClose }) => {
  const [copied, setCopied] = useState(false);
  const videoUrl = `${BACKEND_URL}/api/videos/${video.id}/download`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(videoUrl);
    setCopied(true);
    toast.success('Video link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSocialShare = (platform) => {
    const text = encodeURIComponent(`Check out this AI-generated video: ${video.prompt.substring(0, 100)}...`);
    const url = encodeURIComponent(videoUrl);
    
    let shareUrl = '';
    switch (platform.id) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      case 'tiktok':
      case 'instagram':
      case 'youtube':
        // These platforms require native app sharing - show instructions
        toast.info(`Download your video first, then upload directly to ${platform.name}!`);
        return;
      default:
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleDownloadForSharing = () => {
    window.open(videoUrl, '_blank');
    toast.success('Video downloading! Upload it to your favorite platform.');
  };

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()} data-testid="share-modal">
        <button className="share-modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        <h2 className="share-modal-title">Share Your Video</h2>
        <p className="share-modal-subtitle">Share to social media or copy the link</p>
        
        {/* Video Preview */}
        <div className="share-modal-preview">
          <video
            src={`${BACKEND_URL}${video.video_url}`}
            controls
            style={{ width: '100%', borderRadius: '12px' }}
          />
        </div>

        {/* Social Platforms */}
        <div className="share-social-grid">
          {SOCIAL_PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            return (
              <button
                key={platform.id}
                className="share-social-btn"
                style={{ 
                  background: platform.bg,
                  color: platform.color
                }}
                onClick={() => handleSocialShare(platform)}
                data-testid={`share-${platform.id}`}
              >
                <Icon size={24} />
                <span>{platform.name}</span>
              </button>
            );
          })}
        </div>

        {/* Download for TikTok/Instagram/YouTube */}
        <div className="share-download-section">
          <p className="share-download-tip">
            For TikTok, Instagram & YouTube: Download first, then upload
          </p>
          <button className="share-download-btn" onClick={handleDownloadForSharing}>
            <Download size={20} />
            Download Video
          </button>
        </div>

        {/* Copy Link */}
        <div className="share-link-section">
          <div className="share-link-input">
            <Link2 size={18} />
            <span>{videoUrl.substring(0, 40)}...</span>
          </div>
          <button 
            className={`share-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopyLink}
          >
            {copied ? <Check size={18} /> : <Link2 size={18} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Library = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareVideo, setShareVideo] = useState(null);

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${API}/videos`);
      setVideos(response.data.videos);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/videos/${videoId}`);
      setVideos(videos.filter(v => v.id !== videoId));
      toast.success('Video deleted');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    }
  };

  const handleDownload = (videoId) => {
    window.open(`${BACKEND_URL}/api/videos/${videoId}/download`, '_blank');
  };

  const handleShareToGallery = async (videoId, currentlyShared) => {
    try {
      await axios.post(`${API}/videos/${videoId}/share`, {
        share_to_gallery: !currentlyShared
      });
      
      setVideos(videos.map(v => 
        v.id === videoId ? { ...v, shared: !currentlyShared } : v
      ));
      
      if (!currentlyShared) {
        toast.success('Video shared to Community Gallery!');
      } else {
        toast.success('Video removed from gallery');
      }
    } catch (error) {
      console.error('Error sharing video:', error);
      toast.error('Failed to share video');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="library-container">
      {/* Share Modal */}
      {shareVideo && (
        <ShareModal video={shareVideo} onClose={() => setShareVideo(null)} />
      )}

      <div className="generator-header">
        <h1 className="hero-title" style={{ fontSize: '2.5rem' }} data-testid="library-title">
          Your Video Library
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.125rem' }} data-testid="library-subtitle">
          All your generated videos in one place
        </p>
      </div>
      
      {loading ? (
        <div className="empty-state" data-testid="loading-state">
          <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ marginTop: '1rem' }}>Loading videos...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state" data-testid="empty-state">
          <div className="empty-state-icon">
            <Video size={80} />
          </div>
          <h3>No videos yet</h3>
          <p>Start creating your first video!</p>
          <button 
            className="cta-button" 
            data-testid="create-first-video-button"
            style={{ marginTop: '2rem' }}
            onClick={() => navigate('/generate')}
          >
            Create Video
          </button>
        </div>
      ) : (
        <div className="library-grid">
          {videos.map((video) => (
            <div key={video.id} className="video-card" data-testid={`video-card-${video.id}`}>
              <div className="video-card-thumbnail">
                {video.status === 'completed' ? (
                  <video
                    src={`${BACKEND_URL}${video.video_url}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%' 
                  }}>
                    <Video size={60} color="#667eea" />
                  </div>
                )}
              </div>
              
              <div className="video-card-content">
                <p className="video-card-prompt" data-testid="video-prompt">{video.prompt}</p>
                <p className="video-card-meta" data-testid="video-meta">
                  {video.size} • {video.duration}s • {video.model}
                </p>
                <p className="video-card-meta" data-testid="video-date">{formatDate(video.created_at)}</p>
                
                <span 
                  className={`video-card-status status-${video.status}`}
                  data-testid="video-status"
                >
                  {video.status}
                </span>
                
                <div className="video-card-actions">
                  {video.status === 'completed' && (
                    <>
                      <button
                        className="action-button primary"
                        data-testid="download-video-button"
                        onClick={() => handleDownload(video.id)}
                      >
                        <Download size={18} style={{ display: 'inline', marginRight: '6px' }} />
                        Download
                      </button>
                      <button
                        className="action-button share-social"
                        data-testid="share-social-button"
                        onClick={() => setShareVideo(video)}
                      >
                        <Share2 size={18} style={{ display: 'inline', marginRight: '6px' }} />
                        Share
                      </button>
                      <button
                        className={`action-button gallery-btn ${video.shared ? 'shared' : ''}`}
                        data-testid="share-gallery-button"
                        onClick={() => handleShareToGallery(video.id, video.shared)}
                        title={video.shared ? 'Remove from gallery' : 'Add to community gallery'}
                      >
                        {video.shared ? '✓ In Gallery' : '+ Gallery'}
                      </button>
                    </>
                  )}
                  <button
                    className="action-button delete-btn"
                    data-testid="delete-video-button"
                    onClick={() => handleDelete(video.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
