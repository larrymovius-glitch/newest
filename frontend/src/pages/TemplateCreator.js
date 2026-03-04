import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TemplateCreator = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('sora-2');
  const [size, setSize] = useState('1280x720');
  const [duration, setDuration] = useState(4);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !prompt.trim()) {
      toast.error('Please fill in template name and prompt');
      return;
    }
    
    setSaving(true);
    
    try {
      await axios.post(`${API}/templates`, {
        name: name.trim(),
        category,
        prompt: prompt.trim(),
        model,
        size,
        duration: parseInt(duration)
      });
      
      toast.success('Template saved successfully! 🎉');
      setTimeout(() => navigate('/templates'), 1500);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
      setSaving(false);
    }
  };

  return (
    <div className="generator-container">
      <button 
        className="back-button" 
        data-testid="back-button"
        onClick={() => navigate('/templates')}
      >
        <ArrowLeft size={20} style={{ display: 'inline', marginRight: '8px' }} />
        Back to Templates
      </button>
      
      <div className="generator-header">
        <h1 className="hero-title" style={{ fontSize: '2.5rem' }} data-testid="creator-title">
          Create Custom Template
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.125rem' }} data-testid="creator-subtitle">
          Save your favorite prompts as reusable templates
        </p>
      </div>
      
      <div className="generator-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" data-testid="name-label">Template Name *</label>
            <input
              type="text"
              className="form-select"
              data-testid="name-input"
              placeholder="e.g., My Product Showcase"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              style={{ padding: '1rem' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" data-testid="category-label">Category</label>
            <select
              className="form-select"
              data-testid="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={saving}
            >
              <option value="Custom">Custom</option>
              <option value="Marketing">Marketing</option>
              <option value="Education">Education</option>
              <option value="Branding">Branding</option>
              <option value="Product">Product</option>
              <option value="Social Proof">Social Proof</option>
              <option value="Events">Events</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label" data-testid="prompt-label">Video Prompt *</label>
            <textarea
              className="form-textarea"
              data-testid="prompt-input"
              placeholder="Describe the video you want to generate... Be specific about style, mood, camera angles, etc."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={saving}
              rows={6}
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
                disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
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
            data-testid="save-template-button"
            disabled={saving}
            style={{ marginTop: '1.5rem' }}
          >
            {saving ? (
              <>
                <span className="loading-spinner"></span>
                <span style={{ marginLeft: '10px' }}>Saving...</span>
              </>
            ) : (
              <>
                <Save size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Save Template
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TemplateCreator;
