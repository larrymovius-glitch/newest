import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Eye, Heart, Share2, BarChart3 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [overviewRes, videosRes] = await Promise.all([
        axios.get(`${API}/analytics/overview`),
        axios.get(`${API}/videos`)
      ]);
      
      setOverview(overviewRes.data);
      setVideos(videosRes.data.videos.filter(v => v.status === 'completed'));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const getEngagementRate = (video) => {
    if (video.views === 0) return 0;
    return (((video.likes + video.shares * 2) / video.views) * 100).toFixed(2);
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
        <h1 className="hero-title" style={{ fontSize: '2.5rem' }} data-testid="analytics-title">
          <BarChart3 size={40} style={{ display: 'inline', marginRight: '1rem', verticalAlign: 'middle' }} />
          Video Analytics
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.125rem' }} data-testid="analytics-subtitle">
          Track performance and engagement metrics
        </p>
      </div>
      
      {loading ? (
        <div className="empty-state">
          <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ marginTop: '1rem' }}>Loading analytics...</p>
        </div>
      ) : (
        <>
          <div className="analytics-overview" data-testid="analytics-overview">
            <div className="analytics-card">
              <div className="analytics-icon" style={{ background: '#dbeafe' }}>
                <Eye size={32} color="#2563eb" />
              </div>
              <div className="analytics-content">
                <h3 className="analytics-value">{overview?.total_views || 0}</h3>
                <p className="analytics-label">Total Views</p>
              </div>
            </div>
            
            <div className="analytics-card">
              <div className="analytics-icon" style={{ background: '#fee2e2' }}>
                <Heart size={32} color="#dc2626" />
              </div>
              <div className="analytics-content">
                <h3 className="analytics-value">{overview?.total_likes || 0}</h3>
                <p className="analytics-label">Total Likes</p>
              </div>
            </div>
            
            <div className="analytics-card">
              <div className="analytics-icon" style={{ background: '#dcfce7' }}>
                <Share2 size={32} color="#16a34a" />
              </div>
              <div className="analytics-content">
                <h3 className="analytics-value">{overview?.total_shares || 0}</h3>
                <p className="analytics-label">Total Shares</p>
              </div>
            </div>
            
            <div className="analytics-card">
              <div className="analytics-icon" style={{ background: '#fef3c7' }}>
                <TrendingUp size={32} color="#ca8a04" />
              </div>
              <div className="analytics-content">
                <h3 className="analytics-value">{overview?.avg_engagement || 0}%</h3>
                <p className="analytics-label">Avg Engagement</p>
              </div>
            </div>
          </div>

          <div className="analytics-header">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Video Performance</h2>
          </div>

          <div className="analytics-table">
            {videos.length === 0 ? (
              <div className="empty-state">
                <p>No video data yet. Generate videos to see analytics!</p>
              </div>
            ) : (
              <table className="performance-table">
                <thead>
                  <tr>
                    <th>Video</th>
                    <th>Views</th>
                    <th>Likes</th>
                    <th>Shares</th>
                    <th>Engagement</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((video) => (
                    <tr key={video.id}>
                      <td className="video-title">{video.prompt.substring(0, 50)}...</td>
                      <td>{video.views}</td>
                      <td>{video.likes}</td>
                      <td>{video.shares}</td>
                      <td>
                        <span className="engagement-badge">
                          {getEngagementRate(video)}%
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${video.shared ? 'status-shared' : 'status-private'}`}>
                          {video.shared ? 'Public' : 'Private'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
