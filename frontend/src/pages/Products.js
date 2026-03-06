import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Link2, ExternalLink, Store, Eye, EyeOff, Trash2, Video, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', affiliate_link: '', price: '', category: 'General', image_url: ''
  });

  const fetchData = async () => {
    try {
      const [prodRes, vidRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/videos`)
      ]);
      setProducts(prodRes.data.products);
      setVideos(vidRes.data.videos.filter(v => v.status === 'completed'));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.affiliate_link) {
      toast.error('Product name and affiliate link are required');
      return;
    }
    try {
      await axios.post(`${API}/products`, {
        ...form,
        price: parseFloat(form.price) || 0
      });
      toast.success('Product added!');
      setForm({ name: '', description: '', affiliate_link: '', price: '', category: 'General', image_url: '' });
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create product');
    }
  };

  const handlePublish = async (productId, isListed) => {
    try {
      const endpoint = isListed ? 'unpublish' : 'publish';
      await axios.post(`${API}/products/${productId}/${endpoint}`);
      toast.success(isListed ? 'Removed from store' : 'Published to store!');
      fetchData();
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API}/products/${productId}`);
      toast.success('Product deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleLinkVideo = async (productId, videoId) => {
    try {
      await axios.post(`${API}/products/${productId}/link-video?video_id=${videoId}`);
      toast.success('Video linked to product!');
      setShowLinkModal(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to link video');
    }
  };

  const CATEGORIES = ['General', 'Health & Wellness', 'Tech & Software', 'Education', 'Fashion', 'Finance', 'Food & Drink', 'Home & Living'];

  return (
    <div className="library-container">
      <div className="generator-header">
        <h1 className="hero-title" style={{ fontSize: '2.5rem' }} data-testid="products-title">
          <Package size={40} style={{ display: 'inline', marginRight: '1rem', verticalAlign: 'middle' }} />
          Product Catalog
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.125rem' }} data-testid="products-subtitle">
          Manage your affiliate products and link promo videos
        </p>
        <button
          className="cta-button"
          style={{ marginTop: '1rem' }}
          data-testid="add-product-button"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={20} style={{ marginRight: '8px' }} />
          Add Product
        </button>
      </div>

      {/* Add Product Form */}
      {showForm && (
        <div style={{ maxWidth: '700px', margin: '0 auto 2rem', padding: '0 2rem' }}>
          <div className="generator-card" data-testid="add-product-form">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>
              New Affiliate Product
            </h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  className="form-select"
                  data-testid="product-name-input"
                  placeholder="e.g., Wellness Bundle Pro"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  data-testid="product-desc-input"
                  placeholder="What does this product do? Who is it for?"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="options-grid">
                <div className="form-group">
                  <label className="form-label">Affiliate Link *</label>
                  <input
                    className="form-select"
                    data-testid="product-link-input"
                    placeholder="https://..."
                    value={form.affiliate_link}
                    onChange={(e) => setForm({ ...form, affiliate_link: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input
                    className="form-select"
                    data-testid="product-price-input"
                    type="number"
                    step="0.01"
                    placeholder="29.99"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    data-testid="product-category-select"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Product Image URL (optional)</label>
                <input
                  className="form-select"
                  data-testid="product-image-input"
                  placeholder="https://example.com/product-image.jpg"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="generate-button" data-testid="save-product-button">
                  Save Product
                </button>
                <button type="button" className="download-button" style={{ background: '#64748b' }} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Cards */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '1.125rem' }}>Loading products...</p>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Package size={60} color="#475569" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.5rem', color: '#e2e8f0', marginBottom: '0.5rem' }}>No Products Yet</h3>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Add your first affiliate product and link promo videos to it.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
          {products.map(product => (
            <div key={product.id} className="generator-card" data-testid={`product-card-${product.id}`} style={{ position: 'relative' }}>
              {/* Status badge */}
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                {product.store_listed && (
                  <span style={{ background: '#10b981', color: 'white', padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600 }} data-testid={`product-listed-badge-${product.id}`}>
                    In Store
                  </span>
                )}
                <span style={{
                  background: product.status === 'active' ? '#3b82f6' : '#64748b',
                  color: 'white', padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600
                }}>
                  {product.status}
                </span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem', paddingRight: '120px' }}>
                {product.name}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
                {product.description || 'No description'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Link2 size={14} color="#a78bfa" />
                <a href={product.affiliate_link} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.8rem', color: '#a78bfa', textDecoration: 'none' }}>
                  {product.affiliate_link?.substring(0, 40)}...
                </a>
              </div>
              {product.price > 0 && (
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981', marginBottom: '0.75rem' }}>
                  ${product.price.toFixed(2)}
                </p>
              )}
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>
                {product.promo_video_ids?.length || 0} promo video(s) linked
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="download-button"
                  data-testid={`link-video-btn-${product.id}`}
                  style={{ background: '#667eea', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  onClick={() => setShowLinkModal(product.id)}
                >
                  <Video size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Link Video
                </button>
                <button
                  className="download-button"
                  data-testid={`publish-btn-${product.id}`}
                  style={{ background: product.store_listed ? '#f59e0b' : '#10b981', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  onClick={() => handlePublish(product.id, product.store_listed)}
                >
                  {product.store_listed ? <EyeOff size={14} style={{ display: 'inline', marginRight: '4px' }} /> : <Store size={14} style={{ display: 'inline', marginRight: '4px' }} />}
                  {product.store_listed ? 'Unpublish' : 'Publish to Store'}
                </button>
                <button
                  className="download-button"
                  data-testid={`delete-product-btn-${product.id}`}
                  style={{ background: '#ef4444', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link Video Modal */}
      {showLinkModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} data-testid="link-video-modal">
          <div className="generator-card" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Select a Video to Link</h3>
              <button onClick={() => setShowLinkModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#64748b" />
              </button>
            </div>
            {videos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: '#64748b', marginBottom: '1rem' }}>No completed videos yet.</p>
                <button className="cta-button" onClick={() => navigate('/generate')}>Create a Video First</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {videos.map(video => (
                  <div
                    key={video.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0'
                    }}
                    data-testid={`video-option-${video.id}`}
                  >
                    <div>
                      <p style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                        {video.prompt?.substring(0, 50)}...
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {video.size} | {video.duration}s
                      </p>
                    </div>
                    <button
                      className="download-button"
                      style={{ background: '#667eea', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                      data-testid={`select-video-${video.id}`}
                      onClick={() => handleLinkVideo(showLinkModal, video.id)}
                    >
                      Link
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
