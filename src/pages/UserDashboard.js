import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { incidentsAPI } from '../utils/api';
import { SOURCES_OF_INCIDENT, MISTAKES_COMMITTED } from '../utils/config';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [showComplaints, setShowComplaints] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIncident, setExpandedIncident] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    date_of_incident: '',
    project_name: '',
    source_of_incident: '',
    mistake_committed: '',
    preliminary_investigation: false,
    details_and_findings: '',
    suggestions: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (showComplaints) {
      fetchIncidents();
    }
  }, [showComplaints]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await incidentsAPI.getAll();
      setIncidents(response.data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setMessage({ type: 'error', text: 'Failed to load complaints' });
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    setAttachments(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const data = new FormData();
      
      // Append form fields
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });

      // Append files
      attachments.forEach(file => {
        data.append('attachments', file);
      });

      await incidentsAPI.create(data);

      setMessage({ type: 'success', text: 'Incident reported successfully!' });
      
      // Reset form
      setFormData({
        subject: '',
        date_of_incident: '',
        project_name: '',
        source_of_incident: '',
        mistake_committed: '',
        preliminary_investigation: false,
        details_and_findings: '',
        suggestions: ''
      });
      setAttachments([]);
      
      // Reset file input
      const fileInput = document.getElementById('attachments');
      if (fileInput) fileInput.value = '';

      // Refresh incidents if viewing
      if (showComplaints) {
        fetchIncidents();
      }
    } catch (error) {
      console.error('Error submitting incident:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to submit incident' 
      });
    }
    setSubmitting(false);
  };

  const toggleIncidentDetails = (incidentId) => {
    setExpandedIncident(expandedIncident === incidentId ? null : incidentId);
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
          <h1>PANACHE</h1>
          <p className="user-info">Welcome, {user.username} | {user.department}</p>
        </div>
        <div className="header-right">
          <button 
            className="view-complaints-btn"
            onClick={() => setShowComplaints(!showComplaints)}
          >
            {showComplaints ? 'Submit New Complaint' : 'View My Complaints'}
          </button>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        {!showComplaints ? (
          /* Submit Incident Form */
          <div className="incident-form-container">
            <h2>Report an Incident</h2>
            
            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="incident-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Date of Incident *</label>
                  <input
                    type="date"
                    name="date_of_incident"
                    value={formData.date_of_incident}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Project Name</label>
                  <input
                    type="text"
                    name="project_name"
                    value={formData.project_name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Source of Incident *</label>
                  <select
                    name="source_of_incident"
                    value={formData.source_of_incident}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select source</option>
                    {SOURCES_OF_INCIDENT.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mistake Committed by Employee *</label>
                  <select
                    name="mistake_committed"
                    value={formData.mistake_committed}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select mistake type</option>
                    {MISTAKES_COMMITTED.map(mistake => (
                      <option key={mistake} value={mistake}>{mistake}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="preliminary_investigation"
                      checked={formData.preliminary_investigation}
                      onChange={handleInputChange}
                    />
                    Was a preliminary investigation done?
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Details and Findings *</label>
                <textarea
                  name="details_and_findings"
                  value={formData.details_and_findings}
                  onChange={handleInputChange}
                  rows="5"
                  required
                  placeholder="Describe the incident in detail..."
                />
              </div>

              <div className="form-group">
                <label>Your Suggestions</label>
                <textarea
                  name="suggestions"
                  value={formData.suggestions}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="What do you suggest to prevent this in the future?"
                />
              </div>

              <div className="form-group">
                <label>Attach Photos/Videos (Optional)</label>
                <input
                  type="file"
                  id="attachments"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />
                {attachments.length > 0 && (
                  <p className="file-info">{attachments.length} file(s) selected</p>
                )}
              </div>

              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Incident Report'}
              </button>
            </form>
          </div>
        ) : (
          /* View Complaints */
          <div className="complaints-container">
            <h2>My Complaints</h2>

            {loading ? (
              <p className="loading">Loading complaints...</p>
            ) : incidents.length === 0 ? (
              <p className="no-data">No complaints submitted yet.</p>
            ) : (
              <div className="incidents-list">
                {incidents.map(incident => (
                  <div key={incident.id} className="incident-card">
                    <div className="incident-header" onClick={() => toggleIncidentDetails(incident.id)}>
                      <div className="incident-title">
                        <h3>{incident.subject}</h3>
                        <span className={`status-badge ${getStatusBadgeClass(incident.status)}`}>
                          {incident.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="incident-meta">
                        <span>Date: {new Date(incident.date_of_incident).toLocaleDateString()}</span>
                        <span>Submitted: {new Date(incident.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {expandedIncident === incident.id && (
                      <div className="incident-details">
                        <div className="detail-row">
                          <strong>Project:</strong> {incident.project_name || 'N/A'}
                        </div>
                        <div className="detail-row">
                          <strong>Source of Incident:</strong> {incident.source_of_incident}
                        </div>
                        <div className="detail-row">
                          <strong>Mistake Committed:</strong> {incident.mistake_committed}
                        </div>
                        <div className="detail-row">
                          <strong>Preliminary Investigation:</strong> {incident.preliminary_investigation ? 'Yes' : 'No'}
                        </div>
                        <div className="detail-row">
                          <strong>Details and Findings:</strong>
                          <p>{incident.details_and_findings}</p>
                        </div>
                        {incident.suggestions && (
                          <div className="detail-row">
                            <strong>Suggestions:</strong>
                            <p>{incident.suggestions}</p>
                          </div>
                        )}

                        {/* Show responses if any */}
                        {incident.incident_responses && incident.incident_responses.length > 0 && (
                          <div className="response-section">
                            <h4>HR Response</h4>
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;