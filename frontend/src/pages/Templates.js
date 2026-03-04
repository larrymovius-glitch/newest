import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Play } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Templates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(templates.map(t => t.category))];
  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const useTemplate = (template) => {
    navigate('/generate', { state: { template } });
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
        <h1 className="hero-title" style={{ fontSize: '2.5rem' }} data-testid="templates-title">
          Video Templates
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.125rem' }} data-testid="templates-subtitle">
          Start with professionally crafted templates
        </p>
      </div>

      <div className="template-categories" data-testid="template-categories">
        {categories.map(category => (
          <button
            key={category}
            className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
            data-testid={`category-${category}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      
      {loading ? (
        <div className="empty-state" data-testid="loading-state">
          <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ marginTop: '1rem' }}>Loading templates...</p>
        </div>
      ) : (
        <div className="templates-grid">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="template-card" data-testid={`template-card-${template.id}`}>
              <div className="template-thumbnail">
                <div className="template-icon">{template.thumbnail}</div>
                <div className="template-badge">{template.model === 'sora-2-pro' ? 'PRO' : 'STD'}</div>
              </div>
              
              <div className="template-content">
                <div className="template-category-tag" data-testid="template-category">{template.category}</div>
                <h3 className="template-name" data-testid="template-name">{template.name}</h3>
                <p className="template-prompt" data-testid="template-prompt">{template.prompt}</p>
                
                <div className="template-specs" data-testid="template-specs">
                  <span>{template.size.split('x')[0]}x{template.size.split('x')[1]}</span>
                  <span>•</span>
                  <span>{template.duration}s</span>
                </div>
                
                <button
                  className="use-template-button"
                  data-testid="use-template-button"
                  onClick={() => useTemplate(template)}
                >
                  <Play size={18} style={{ marginRight: '6px' }} />
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Templates;