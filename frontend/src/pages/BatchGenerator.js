import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Trash2, Layers } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BatchGenerator = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([
    { prompt: '', model: 'sora-2', size: '1280x720', duration: 4 }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchId, setBatchId] = useState(null);

  const addVideo = () => {
    setVideos([...videos, { prompt: '', model: 'sora-2', size: '1280x720', duration: 4 }]);
  };

  const removeVideo = (index) => {
    if (videos.length > 1) {
      setVideos(videos.filter((_, i) => i !== index));
    }
  };

  const updateVideo = (index, field, value) => {
    const updated = [...videos];
    updated[index][field] = value;
    setVideos(updated);
  };

  const handleBatchGenerate = async (e) => {
    e.preventDefault();
    
    const validVideos = videos.filter(v => v.prompt.trim());
    if (validVideos.length === 0) {
      alert('Please add at least one video with a description');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const response = await axios.post(`${API}/videos/batch-generate`, {
        videos: validVideos.map(v => ({ ...v, duration: parseInt(v.duration) }))
      });
      
      setBatchId(response.data.video_ids);
      alert(`Batch generation started for ${response.data.video_ids.length} videos!`);
      setTimeout(() => navigate('/library'), 2000);
    } catch (error) {
      console.error('Error batch generating videos:', error);
      alert('Failed to start batch generation. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="generator-container">
      <div className="generator-header">
        <h1 className="hero-title" style={{ fontSize: '2.5rem' }} data-testid="batch-title">
          Batch Video Generation
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.125rem' }} data-testid="batch-subtitle">
          Generate multiple videos at once and save time
        </p>
      </div>
      
      <div className="batch-container">
        <div className="batch-header">
          <div className="batch-count">
            <Layers size={24} color="#667eea" />
            <span>{videos.length} Video{videos.length !== 1 ? 's' : ''} in Queue</span>
          </div>
          <button
            type="button"
            className="add-video-button"
            data-testid="add-video-button"
            onClick={addVideo}
            disabled={isGenerating}
          >
            <Plus size={20} style={{ marginRight: '6px' }} />
            Add Another Video
          </button>
        </div>

        <form onSubmit={handleBatchGenerate}>
          <div className="batch-videos-list">
            {videos.map((video, index) => (
              <div key={index} className="batch-video-card" data-testid={`batch-video-${index}`}>
                <div className="batch-video-header">
                  <h3>Video {index + 1}</h3>
                  {videos.length > 1 && (
                    <button
                      type="button"
                      className="remove-video-button"
                      data-testid={`remove-video-${index}`}
                      onClick={() => removeVideo(index)}
                      disabled={isGenerating}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Video Description</label>
                  <textarea
                    className="form-textarea"
                    data-testid={`prompt-input-${index}`}
                    placeholder="Describe this video..."
                    value={video.prompt}
                    onChange={(e) => updateVideo(index, 'prompt', e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
                
                <div className="batch-options-grid">
                  <div className="form-group">
                    <label className="form-label">Quality</label>
                    <select
                      className="form-select"
                      value={video.model}
                      onChange={(e) => updateVideo(index, 'model', e.target.value)}
                      disabled={isGenerating}
                    >
                      <option value="sora-2">Standard</option>
                      <option value="sora-2-pro">Pro</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Resolution</label>
                    <select
                      className="form-select"
                      value={video.size}
                      onChange={(e) => updateVideo(index, 'size', e.target.value)}
                      disabled={isGenerating}
                    >
                      <option value="1280x720">HD</option>
                      <option value="1792x1024">Widescreen</option>
                      <option value="1024x1792">Portrait</option>
                      <option value="1024x1024">Square</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <select
                      className="form-select"
                      value={video.duration}
                      onChange={(e) => updateVideo(index, 'duration', e.target.value)}
                      disabled={isGenerating}
                    >
                      <option value="4">4 seconds</option>
                      <option value="8">8 seconds</option>
                      <option value="12">12 seconds</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button
            type="submit"
            className="generate-button"
            data-testid="batch-generate-button"
            disabled={isGenerating}
            style={{ marginTop: '2rem' }}
          >
            {isGenerating ? (
              <>
                <span className="loading-spinner"></span>
                <span style={{ marginLeft: '10px' }}>Starting Batch Generation...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Generate All Videos ({videos.filter(v => v.prompt.trim()).length})
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BatchGenerator;