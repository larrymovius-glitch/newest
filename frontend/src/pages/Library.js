import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, Video, Share2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Library = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    }
  };

  const handleDownload = (videoId) => {
    window.open(`${BACKEND_URL}/api/videos/${videoId}/download`, '_blank');
  };

  const handleShare = async (videoId, currentlyShared) => {
    try {
      await axios.post(`${API}/videos/${videoId}/share`, {
        share_to_gallery: !currentlyShared
      });
      
      setVideos(videos.map(v => 
        v.id === videoId ? { ...v, shared: !currentlyShared } : v
      ));
      
      if (!currentlyShared) {
        toast.success('Video shared to Community Gallery! \ud83c\udf89');
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
      <button 
        className="back-button" 
        data-testid="back-button"
        onClick={() => navigate('/')}
      >
        <ArrowLeft size={20} style={{ display: 'inline', marginRight: '8px' }} />
        Back to Home
      </button>
      
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
                        className={`action-button ${video.shared ? 'shared' : ''}`}
                        data-testid="share-video-button"
                        onClick={() => handleShare(video.id, video.shared)}
                      >
                        <Share2 size={18} style={{ display: 'inline', marginRight: '6px' }} />
                        {video.shared ? 'Shared' : 'Share'}
                      </button>
                    </>
                  )}
                  <button
                    className="action-button"
                    data-testid="delete-video-button"
                    onClick={() => handleDelete(video.id)}
                  >
                    <Trash2 size={18} style={{ display: 'inline', marginRight: '6px' }} />
                    Delete
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