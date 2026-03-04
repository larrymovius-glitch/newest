import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, Trash2, Mail } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Team = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get(`${API}/team`);
      setMembers(response.data.team_members);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching team:', error);
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API}/team/invite?name=${inviteName}&email=${inviteEmail}&role=${inviteRole}`);
      toast.success('Team member invited! 📧');
      setShowInvite(false);
      setInviteName('');
      setInviteEmail('');
      fetchTeamMembers();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('Failed to invite member');
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm('Remove this team member?')) return;
    
    try {
      await axios.delete(`${API}/team/${memberId}`);
      setMembers(members.filter(m => m.id !== memberId));
      toast.success('Member removed');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="library-container">
      <button className="back-button" onClick={() => navigate('/')}>
        <ArrowLeft size={20} style={{ marginRight: '8px' }} />
        Back to Home
      </button>
      
      <div className="generator-header">
        <h1 className="hero-title" style={{ fontSize: '2.5rem' }}>
          <Users size={40} style={{ display: 'inline', marginRight: '1rem', verticalAlign: 'middle' }} />
          Team Collaboration
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.125rem' }}>
          Manage team members and collaborate on videos
        </p>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <button
          className="add-video-button"
          onClick={() => setShowInvite(!showInvite)}
          style={{ marginBottom: '2rem' }}
        >
          <UserPlus size={20} style={{ marginRight: '8px' }} />
          Invite Team Member
        </button>

        {showInvite && (
          <div className="generator-card" style={{ marginBottom: '2rem' }}>
            <form onSubmit={handleInvite}>
              <h3 style={{ marginBottom: '1.5rem' }}>Invite New Member</h3>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-select"
                  placeholder="John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                  style={{ padding: '1rem' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-select"
                  placeholder="john@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  style={{ padding: '1rem' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="generate-button">
                <Mail size={20} style={{ marginRight: '8px' }} />
                Send Invitation
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
          </div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <Users size={80} color="#94a3b8" />
            <h3>No team members yet</h3>
            <p>Invite your first team member to collaborate</p>
          </div>
        ) : (
          <div className="library-grid">
            {members.map((member) => (
              <div key={member.id} className="video-card">
                <div className="video-card-content">
                  <h3 className="video-card-prompt">{member.name}</h3>
                  <p className="video-card-meta">{member.email}</p>
                  <span className="video-card-status status-completed" style={{ textTransform: 'capitalize' }}>
                    {member.role}
                  </span>
                  <p className="video-card-meta" style={{ marginTop: '0.5rem' }}>
                    Joined: {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                  <div className="video-card-actions" style={{ marginTop: '1rem' }}>
                    <button
                      className="action-button"
                      onClick={() => handleRemove(member.id)}
                    >
                      <Trash2 size={18} style={{ marginRight: '6px' }} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Team;
