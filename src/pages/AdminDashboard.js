import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { incidentsAPI, usersAPI } from '../utils/api';
import { ROOT_CAUSES } from '../utils/config';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('incidents'); // incidents, users
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIncident, setExpandedIncident] = useState(null);
  
  // User management states
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user',
    department: ''
  });
  const [userMessage, setUserMessage] = useState({ type: '', text: '' });

  // Acknowledge modal
  const [acknowledgingIncident, setAcknowledgingIncident] = useState(null);
  const [acknowledgeData, setAcknowledgeData] = useState({
    investigation_findings: '',
    root_cause: '',
    action_taken: '',
    further_action_plan: '',
    status: 'open'
  });

  useEffect(() => {
    if (activeTab === 'incidents') {
      fetchIncidents();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await incidentsAPI.getAll();
      setIncidents(response.data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const toggleIncidentDetails = (incidentId) => {
    setExpandedIncident(expandedIncident === incidentId ? null : incidentId);
  };

  // User Management Functions
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserMessage({ type: '', text: '' });

    try {
      await usersAPI.create(newUser);
      setUserMessage({ type: 'success', text: 'User created successfully!' });
      setNewUser({
        username: '',
        password: '',
        role: 'user',
        department: ''
      });
      fetchUsers();
      setTimeout(() => setShowCreateUser(false), 2000);
    } catch (error) {
      console.error('Error creating user:', error);
      setUserMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to create user'
      });
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setUserMessage({ type: '', text: '' });

    try {
      await usersAPI.update(editingUser.id, {
        username: editingUser.username,
        role: editingUser.role,
        department: editingUser.department,
        is_active: editingUser.is_active
      });
      setUserMessage({ type: 'success', text: 'User updated successfully!' });
      fetchUsers();
      setTimeout(() => setEditingUser(null), 2000);
    } catch (error) {
      console.error('Error updating user:', error);
      setUserMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update user'
      });
    }
  };

  const handleArchiveUser = async (userId) => {
    if (window.confirm('Are you sure you want to archive this user?')) {
      try {
        await usersAPI.archive(userId);
        alert('User archived successfully!');
        fetchUsers();
      } catch (error) {
        console.error('Error archiving user:', error);
        alert('Failed to archive user');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      try {
        await usersAPI.delete(userId);
        alert('User deleted successfully!');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(error.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const handleDeleteIncident = async (incidentId) => {
    if (window.confirm('Are you sure you want to delete this incident? This action cannot be undone.')) {
      try {
        await incidentsAPI.delete(incidentId);
        alert('Incident deleted successfully!');
        fetchIncidents();
      } catch (error) {
        console.error('Error deleting incident:', error);
        alert('Failed to delete incident');
      }
    }
  };

  const handleUserInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        [name]: type === 'checkbox' ? checked : value
      });
    } else {
      setNewUser({
        ...newUser,
        [name]: value
      });
    }
  };

  // Acknowledge Functions
  const openAcknowledgeForm = (incident) => {
    setAcknowledgingIncident(incident);
    setAcknowledgeData({
      investigation_findings: '',
      root_cause: '',
      action_taken: '',
      further_action_plan: '',
      status: incident.status
    });
  };

  const closeAcknowledgeForm = () => {
    setAcknowledgingIncident(null);
  };

  const handleAcknowledgeInputChange = (e) => {
    const { name, value } = e.target;
    setAcknowledgeData({ ...acknowledgeData, [name]: value });
  };

  const handleAcknowledgeSubmit = async (e) => {
    e.preventDefault();

    try {
      await incidentsAPI.acknowledge(acknowledgingIncident.id, acknowledgeData);
      alert('Incident acknowledged successfully!');
      closeAcknowledgeForm();
      fetchIncidents();
    } catch (error) {
      console.error('Error acknowledging incident:', error);
      alert('Failed to acknowledge incident');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open': return 'status-open';
      case 'in-progress': return 'status-in-progress';
      case 'closed': return 'status-closed';
      default: return '';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header admin-header">
        <div className="header-left">
          <h1>PANACHE - Admin Dashboard</h1>
          <p className="user-info">Welcome, {user.username} | Administrator</p>
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'incidents' ? 'active' : ''}`}
          onClick={() => setActiveTab('incidents')}
        >
          Incident Reports
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'incidents' ? (
          /* Incidents Tab */
          <div className="incidents-container">
            <div className="section-header">
              <h2>All Incident Reports</h2>
              <p className="section-subtitle">Total Incidents: {incidents.length}</p>
            </div>

            {loading ? (
              <p className="loading">Loading incidents...</p>
            ) : incidents.length === 0 ? (
              <p className="no-data">No incidents reported yet.</p>
            ) : (
              <div className="incidents-list">
                {incidents.map(incident => (
                  <div key={incident.id} className="incident-card">
                    <div className="incident-header" onClick={() => toggleIncidentDetails(incident.id)}>
                      <div className="incident-title">
                        <div>
                          <h3>{incident.subject}</h3>
                          <p className="incident-user">
                            Reported by: {incident.user?.username} | {incident.user?.department}
                          </p>
                        </div>
                        <span className={`status-badge ${getStatusBadgeClass(incident.status)}`}>
                          {incident.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="incident-meta">
                        <span>Incident Date: {new Date(incident.date_of_incident).toLocaleDateString()}</span>
                        <span>Submitted: {new Date(incident.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {expandedIncident === incident.id && (
                      <div className="incident-details">
                        <div className="details-grid">
                          <div className="detail-section">
                            <h4>Incident Information</h4>
                            <div className="detail-row">
                              <strong>Employee ID:</strong> {incident.user?.id}
                            </div>
                            <div className="detail-row">
                              <strong>Department:</strong> {incident.user?.department}
                            </div>
                            <div className="detail-row">
                              <strong>Date of Incident:</strong> {new Date(incident.date_of_incident).toLocaleDateString()}
                            </div>
                            <div className="detail-row">
                              <strong>Project Name:</strong> {incident.project_name || 'N/A'}
                            </div>
                            <div className="detail-row">
                              <strong>Sales/Work Order Number:</strong> {incident.sales_work_order_number || 'N/A'}
                            </div>

                            <div className="detail-row">
                              <strong>Submitted on behalf of:</strong> {incident.submitted_on_behalf_of || 'N/A'}
                            </div>
                            <div className="detail-row">
                              <strong>Source of Incident:</strong> {incident.source_of_incident}
                            </div>
                            <div className="detail-row">
                              <strong>Preliminary Investigation:</strong> {incident.preliminary_investigation ? 'Yes' : 'No'}
                            </div>
                          </div>

                          <div className="detail-section">
                            <h4>Details</h4>
                            <div className="detail-row">
                              <strong>Details of Mistake Committed and Findings:</strong>
                              <p>{incident.details_and_findings}</p>
                            </div>
                            {incident.suggestions && (
                              <div className="detail-row">
                                <strong>Employee Suggestions:</strong>
                                <p>{incident.suggestions}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ✅ ATTACHMENTS SECTION — NEW */}
                        {Array.isArray(incident.attachments) && incident.attachments.length > 0 && (
                          <div className="attachments-section">
                            <h4>Attachments</h4>
                            <div className="attachments-grid">
                              {incident.attachments.map((url, index) => {
                                const isVideo = /\.(mp4|mov|avi|webm)$/i.test(url);
                                const isImage = /\.(jpe?g|png|gif|webp|bmp)$/i.test(url);

                                return (
                                  <div key={index} className="attachment-item">
                                    {isImage ? (
                                      <img
                                        src={url}
                                        alt={`Attachment ${index + 1}`}
                                        className="attachment-preview"
                                        loading="lazy"
                                        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                                      />
                                    ) : isVideo ? (
                                      <video
                                        src={url}
                                        controls
                                        className="attachment-preview"
                                        loading="lazy"
                                        onError={(e) => console.warn('Failed to load video:', url, e)}
                                      />
                                    ) : (
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="attachment-fallback"
                                      >
                                        📎 File {index + 1}
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Responses */}
                        {incident.incident_responses && incident.incident_responses.length > 0 && (
                          <div className="responses-section">
                            <h4>Acknowledgment History</h4>
                            {incident.incident_responses.map(response => (
                              <div key={response.id} className="response-card">
                                {response.investigation_findings && (
                                  <div className="detail-row">
                                    <strong>Investigation Findings:</strong>
                                    <p>{response.investigation_findings}</p>
                                  </div>
                                )}
                                {response.root_cause && (
                                  <div className="detail-row">
                                    <strong>Root Cause:</strong> {response.root_cause}
                                  </div>
                                )}
                                {response.action_taken && (
                                  <div className="detail-row">
                                    <strong>Action Taken:</strong>
                                    <p>{response.action_taken}</p>
                                  </div>
                                )}
                                {response.further_action_plan && (
                                  <div className="detail-row">
                                    <strong>Further Action Plan:</strong>
                                    <p>{response.further_action_plan}</p>
                                  </div>
                                )}
                                <div className="detail-row">
                                  <small>Acknowledged: {new Date(response.acknowledged_at).toLocaleString()}</small>
                                </div>

                                {/* ✅ HR Attachments (optional future extension) */}
                                {Array.isArray(response.attachments) && response.attachments.length > 0 && (
                                  <div className="attachments-section">
                                    <h5>HR Evidence</h5>
                                    <div className="attachments-grid">
                                      {response.attachments.map((url, idx) => {
                                        const isVideo = /\.(mp4|mov|avi|webm)$/i.test(url);
                                        const isImage = /\.(jpe?g|png|gif|webp|bmp)$/i.test(url);
                                        return (
                                          <div key={`hr-${idx}`} className="attachment-item">
                                            {isImage ? (
                                              <img
                                                src={url}
                                                alt={`HR Attachment ${idx + 1}`}
                                                className="attachment-preview"
                                                onClick={() => window.open(url, '_blank')}
                                              />
                                            ) : isVideo ? (
                                              <video src={url} controls className="attachment-preview" />
                                            ) : (
                                              <a href={url} target="_blank" rel="noopener noreferrer" className="attachment-fallback">
                                                📎 HR File {idx + 1}
                                              </a>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Admin Actions */}
                        <div className="actions-section">
                          <button 
                            className="acknowledge-btn"
                            onClick={() => openAcknowledgeForm(incident)}
                          >
                            Acknowledge Incident
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteIncident(incident.id)}
                          >
                            Delete Incident
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Users Management Tab */
          <div className="users-container">
            <div className="section-header">
              <h2>User Management</h2>
              <button 
                className="create-user-btn"
                onClick={() => {
                  setShowCreateUser(!showCreateUser);
                  setEditingUser(null);
                  setUserMessage({ type: '', text: '' });
                }}
              >
                {showCreateUser ? 'View Users' : 'Create New User'}
              </button>
            </div>

            {showCreateUser || editingUser ? (
              <div className="user-form-container">
                <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>

                {userMessage.text && (
                  <div className={`message ${userMessage.type}`}>
                    {userMessage.text}
                  </div>
                )}

                <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="user-form">
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      name="username"
                      value={editingUser ? editingUser.username : newUser.username}
                      onChange={handleUserInputChange}
                      required
                    />
                  </div>

                  {!editingUser && (
                    <div className="form-group">
                      <label>Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={newUser.password}
                        onChange={handleUserInputChange}
                        required
                        minLength="6"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      name="role"
                      value={editingUser ? editingUser.role : newUser.role}
                      onChange={handleUserInputChange}
                      required
                    >
                      <option value="user">User (Employee)</option>
                      <option value="superuser">Superuser (HR)</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Department *</label>
                    <input
                      type="text"
                      name="department"
                      value={editingUser ? editingUser.department : newUser.department}
                      onChange={handleUserInputChange}
                      required
                      placeholder="e.g., Production, Quality, HR"
                    />
                  </div>

                  {editingUser && (
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={editingUser.is_active}
                          onChange={handleUserInputChange}
                        />
                        Active Account
                      </label>
                    </div>
                  )}

                  <div className="form-actions">
                    <button type="submit" className="submit-btn">
                      {editingUser ? 'Update User' : 'Create User'}
                    </button>
                    {editingUser && (
                      <button 
                        type="button" 
                        className="cancel-btn"
                        onClick={() => {
                          setEditingUser(null);
                          setUserMessage({ type: '', text: '' });
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              <div className="users-table-container">
                {loading ? (
                  <p className="loading">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="no-data">No users found.</p>
                ) : (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className={!u.is_active ? 'inactive-user' : ''}>
                          <td>{u.username}</td>
                          <td>
                            <span className={`role-badge role-${u.role}`}>
                              {u.role}
                            </span>
                          </td>
                          <td>{u.department}</td>
                          <td>
                            <span className={`active-badge ${u.is_active ? 'active' : 'inactive'}`}>
                              {u.is_active ? 'Active' : 'Archived'}
                            </span>
                          </td>
                          <td>{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="action-buttons">
                            <button 
                              className="edit-btn"
                              onClick={() => {
                                setEditingUser(u);
                                setShowCreateUser(false);
                                setUserMessage({ type: '', text: '' });
                              }}
                            >
                              Edit
                            </button>
                            {u.is_active && (
                              <button 
                                className="archive-btn"
                                onClick={() => handleArchiveUser(u.id)}
                              >
                                Archive
                              </button>
                            )}
                            <button 
                              className="delete-btn-small"
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Acknowledge Modal */}
      {acknowledgingIncident && (
        <div className="modal-overlay" onClick={closeAcknowledgeForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Acknowledge Incident</h3>
              <button className="close-btn" onClick={closeAcknowledgeForm}>×</button>
            </div>

            <form onSubmit={handleAcknowledgeSubmit} className="acknowledge-form">
              <div className="form-group">
                <label>Investigation Findings</label>
                <textarea
                  name="investigation_findings"
                  value={acknowledgeData.investigation_findings}
                  onChange={handleAcknowledgeInputChange}
                  rows="4"
                  placeholder="Describe the investigation findings..."
                />
              </div>

              <div className="form-group">
                <label>Root Cause *</label>
                <select
                  name="root_cause"
                  value={acknowledgeData.root_cause}
                  onChange={handleAcknowledgeInputChange}
                  required
                >
                  <option value="">Select root cause</option>
                  {ROOT_CAUSES.map(cause => (
                    <option key={cause} value={cause}>{cause}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Action Taken</label>
                <textarea
                  name="action_taken"
                  value={acknowledgeData.action_taken}
                  onChange={handleAcknowledgeInputChange}
                  rows="3"
                  placeholder="What action has been taken?"
                />
              </div>

              <div className="form-group">
                <label>Further Action Plan Required</label>
                <textarea
                  name="further_action_plan"
                  value={acknowledgeData.further_action_plan}
                  onChange={handleAcknowledgeInputChange}
                  rows="3"
                  placeholder="What further actions are needed?"
                />
              </div>

              <div className="form-group">
                <label>Status *</label>
                <div className="status-buttons">
                  <button
                    type="button"
                    className={`status-btn ${acknowledgeData.status === 'open' ? 'active' : ''}`}
                    onClick={() => setAcknowledgeData({ ...acknowledgeData, status: 'open' })}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className={`status-btn ${acknowledgeData.status === 'in-progress' ? 'active' : ''}`}
                    onClick={() => setAcknowledgeData({ ...acknowledgeData, status: 'in-progress' })}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    className={`status-btn ${acknowledgeData.status === 'closed' ? 'active' : ''}`}
                    onClick={() => setAcknowledgeData({ ...acknowledgeData, status: 'closed' })}
                  >
                    Closed
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeAcknowledgeForm}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Submit Acknowledgment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Overlay Styling (if not yet defined globally) */}
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #6c757d;
        }
        .acknowledge-form {
          padding: 20px;
        }
        .status-buttons {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }
        .status-btn {
          flex: 1;
          padding: 10px;
          border: 2px solid #ced4da;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .status-btn.active {
          border-color: #e74c3c;
          background: #fff5f5;
          color: #c0392b;
        }
        .modal-actions {
          display: flex;
          gap: 15px;
          margin-top: 20px;
        }
        .cancel-btn {
          flex: 1;
          padding: 12px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        .cancel-btn:hover {
          background: #5a6268;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;