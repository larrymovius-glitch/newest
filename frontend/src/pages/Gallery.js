import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Video, TrendingUp, Share2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Gallery = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGallery();
    const interval = setInterval(fetchGallery, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchGallery = async () => {
    try {
      const response = await axios.get(`${API}/gallery`);
      setVideos(response.data.videos);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      setLoading(false);
    }
  };

  const handleLike = async (videoId) => {
    try {
      const response = await axios.post(`${API}/videos/${videoId}/like`);
      setVideos(videos.map(v => 
        v.id === videoId ? { ...v, likes: response.data.likes } : v
      ));
      toast.success('Liked!');
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleShare = async (videoId) => {
    const shareUrl = `${window.location.origin}/gallery?video=${videoId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this AI-generated video!',
          text: 'Created with Affiliate Pro Video Generator',
          url: shareUrl
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="library-container">
      <div className="generator-header">
        <h1 className="hero-title" style={{ fontSize: '2.5rem' }} data-testid="gallery-title">
          <TrendingUp size={40} style={{ display: 'inline', marginRight: '1rem', verticalAlign: 'middle' }} />
          Community Gallery
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.125rem' }} data-testid="gallery-subtitle">
          Discover amazing videos created by our community
        </p>
      </div>
      
      {loading ? (
        <div className="empty-state" data-testid="loading-state">
          <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ marginTop: '1rem' }}>Loading gallery...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state" data-testid="empty-state">
          <div className="empty-state-icon">
            <Video size={80} />
          </div>
          <h3>No shared videos yet</h3>
          <p>Be the first to share your creation!</p>
          <button 
            className="cta-button" 
            data-testid="create-and-share-button"
            style={{ marginTop: '2rem' }}
            onClick={() => navigate('/generate')}
          >
            Create & Share
          </button>
        </div>
      ) : (
        <div className="library-grid">
          {videos.map((video) => (
            <div key={video.id} className="gallery-card" data-testid={`gallery-card-${video.id}`}>
              <div className="gallery-card-thumbnail">
                <video
                  src={`${BACKEND_URL}${video.video_url}`}
                  className="gallery-video"
                  data-testid="gallery-video"
                  controls
                />
              </div>
              
              <div className="gallery-card-content">
                <p className="gallery-card-prompt" data-testid="gallery-prompt">{video.prompt}</p>
                <p className="gallery-card-meta" data-testid="gallery-meta">
                  {video.size} • {video.duration}s • {formatDate(video.created_at)}
                </p>
                
                <div className="gallery-card-actions">
                  <button
                    className="gallery-action-button"
                    data-testid="like-button"
                    onClick={() => handleLike(video.id)}
                  >
                    <Heart size={18} style={{ marginRight: '6px' }} />
                    {video.likes || 0}
                  </button>
                  
                  <button
                    className="gallery-action-button"
                    data-testid="share-button"
                    onClick={() => handleShare(video.id)}
                  >
                    <Share2 size={18} />
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

export default Gallery;