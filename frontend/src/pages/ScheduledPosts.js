import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Trash2, Clock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ScheduledPosts = () => {
  const navigate = useNavigate();
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    try {
      const response = await axios.get(`${API}/scheduled-posts`);
      setScheduledPosts(response.data.scheduled_posts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      setLoading(false);
    }
  };

  const handleCancel = async (scheduleId) => {
    if (!window.confirm('Cancel this scheduled post?')) return;
    
    try {
      await axios.delete(`${API}/scheduled-posts/${scheduleId}`);
      setScheduledPosts(scheduledPosts.filter(p => p.id !== scheduleId));
      toast.success('Scheduled post cancelled');
    } catch (error) {
      console.error('Error cancelling post:', error);
      toast.error('Failed to cancel post');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="library-container">
      <div className="generator-header">
        <h1 className="hero-title" style={{ fontSize: '2.5rem' }}>
          <Calendar size={40} style={{ display: 'inline', marginRight: '1rem', verticalAlign: 'middle' }} />
          Scheduled Posts
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.125rem' }}>
          Manage your automated social media posts
        </p>
      </div>
      
      {loading ? (
        <div className="empty-state">
          <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ marginTop: '1rem' }}>Loading scheduled posts...</p>
        </div>
      ) : scheduledPosts.length === 0 ? (
        <div className="empty-state">
          <Clock size={80} color="#94a3b8" />
          <h3>No scheduled posts</h3>
          <p>Schedule videos from your library to auto-post</p>
          <button className="cta-button" style={{ marginTop: '2rem' }} onClick={() => navigate('/library')}>
            Go to Library
          </button>
        </div>
      ) : (
        <div className="library-grid">
          {scheduledPosts.map((post) => (
            <div key={post.id} className="video-card">
              <div className="video-card-content">
                <h3 className="video-card-prompt">Scheduled for {formatDate(post.scheduled_time)}</h3>
                <p className="video-card-meta">
                  Platforms: {post.platforms.join(', ')}
                </p>
                <span className={`video-card-status status-${post.status}`}>
                  {post.status}
                </span>
                <div className="video-card-actions" style={{ marginTop: '1rem' }}>
                  <button
                    className="action-button"
                    onClick={() => handleCancel(post.id)}
                  >
                    <Trash2 size={18} style={{ marginRight: '6px' }} />
                    Cancel
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

export default ScheduledPosts;
