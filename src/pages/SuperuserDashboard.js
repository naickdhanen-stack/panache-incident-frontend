import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { incidentsAPI, usersAPI } from '../utils/api';
import { ROOT_CAUSES } from '../utils/config';
import './SuperuserDashboard.css';

const SuperuserDashboard = () => {
  const { user, logout } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIncident, setExpandedIncident] = useState(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [acknowledgingIncident, setAcknowledgingIncident] = useState(null);

  // Create user form state
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user',
    department: ''
  });
  const [userMessage, setUserMessage] = useState({ type: '', text: '' });

  // Acknowledge form state
  const [acknowledgeData, setAcknowledgeData] = useState({
    investigation_findings: '',
    root_cause: '',
    action_taken: '',
    further_action_plan: '',
    status: 'open'
  });

  useEffect(() => {
    fetchIncidents();
  }, []);

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

  const toggleIncidentDetails = (incidentId) => {
    setExpandedIncident(expandedIncident === incidentId ? null : incidentId);
  };

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
    } catch (error) {
      console.error('Error creating user:', error);
      setUserMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to create user'
      });
    }
  };

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

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
    setAcknowledgeData({
      investigation_findings: '',
      root_cause: '',
      action_taken: '',
      further_action_plan: '',
      status: 'open'
    });
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
      <header className="dashboard-header">
        <div className="header-left">
          <h1>PANACHE - HR Dashboard</h1>
          <p className="user-info">Welcome, {user.username} | {user.department}</p>
        </div>
        <div className="header-right">
          <button 
            className="create-user-btn"
            onClick={() => setShowCreateUser(!showCreateUser)}
          >
            {showCreateUser ? 'View Incidents' : 'Create User'}
          </button>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        {showCreateUser ? (
          /* Create User Form */
          <div className="create-user-container">
            <h2>Create New User</h2>

            {userMessage.text && (
              <div className={`message ${userMessage.type}`}>
                {userMessage.text}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="create-user-form">
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  name="username"
                  value={newUser.username}
                  onChange={handleUserInputChange}
                  required
                />
              </div>

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

              <div className="form-group">
                <label>Role *</label>
                <select
                  name="role"
                  value={newUser.role}
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
                  value={newUser.department}
                  onChange={handleUserInputChange}
                  required
                  placeholder="e.g., Production, Quality, HR"
                />
              </div>

              <button type="submit" className="submit-btn">
                Create User
              </button>
            </form>
          </div>
        ) : (
          /* Incidents List */
          <div className="incidents-container">
            <h2>All Incident Reports</h2>

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
                              <strong>Source of Incident:</strong> {incident.source_of_incident}
                            </div>
                            <div className="detail-row">
                              <strong>Mistake Committed:</strong> {incident.mistake_committed}
                            </div>
                            <div className="detail-row">
                              <strong>Preliminary Investigation Done:</strong> {incident.preliminary_investigation ? 'Yes' : 'No'}
                            </div>
                          </div>

                          <div className="detail-section">
                            <h4>Details</h4>
                            <div className="detail-row">
                              <strong>Details and Findings:</strong>
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

                        {/* Show existing responses */}
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
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Acknowledge Button */}
                        <div className="actions-section">
                          <button 
                            className="acknowledge-btn"
                            onClick={() => openAcknowledgeForm(incident)}
                          >
                            {incident.incident_responses && incident.incident_responses.length > 0 
                              ? 'Add Follow-up Response' 
                              : 'Acknowledge Incident'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
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
    </div>
  );
};

export default SuperuserDashboard;