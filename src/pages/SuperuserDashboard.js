import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { incidentsAPI, usersAPI } from '../utils/api';
import { ROOT_CAUSES } from '../utils/config';
import { exportIncidentsToExcel, exportIncidentsBySalesOrder } from '../utils/excelExport';
import './SuperuserDashboard.css';

const SuperuserDashboard = () => {
  const { user, logout } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIncident, setExpandedIncident] = useState(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [acknowledgingIncident, setAcknowledgingIncident] = useState(null);
  
  // Selection & Export states
  const [selectedIncidents, setSelectedIncidents] = useState(new Set());
  const [salesOrderFilter, setSalesOrderFilter] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  // Selection handlers
  const handleSelectIncident = (incidentId) => {
    const newSelected = new Set(selectedIncidents);
    if (newSelected.has(incidentId)) {
      newSelected.delete(incidentId);
    } else {
      newSelected.add(incidentId);
    }
    setSelectedIncidents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIncidents.size === incidents.length) {
      setSelectedIncidents(new Set());
    } else {
      setSelectedIncidents(new Set(incidents.map(i => i.id)));
    }
  };

  // Export handlers
  const handleExportSelected = () => {
    const selected = incidents.filter(i => selectedIncidents.has(i.id));
    if (selected.length === 0) {
      alert('Please select at least one incident to export');
      return;
    }
    exportIncidentsToExcel(selected);
    setShowExportMenu(false);
  };

  const handleExportAll = () => {
    exportIncidentsToExcel(incidents);
    setShowExportMenu(false);
  };

  const handleExportBySalesOrder = () => {
    const order = salesOrderFilter.trim();
    if (!order) {
      alert('Please enter a Sales Work Order Number');
      return;
    }
    exportIncidentsBySalesOrder(incidents, order);
    setSalesOrderFilter('');
    setShowExportMenu(false);
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

  // Get unique sales order numbers
  const uniqueSalesOrders = [...new Set(
    incidents
      .map(i => i.sales_work_order_number)
      .filter(Boolean)
  )].sort();

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
            <div className="section-header">
              <h2>All Incident Reports</h2>
              <div className="header-actions">
                <span className="selection-count">
                  {selectedIncidents.size > 0 && `${selectedIncidents.size} selected`}
                </span>
                <button 
                  className="export-btn"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                >
                  📊 Export to Excel
                </button>
              </div>
            </div>

            {/* Export Menu */}
            {showExportMenu && (
              <div className="export-menu">
                <h3>Export Options</h3>
                
                <div className="export-option">
                  <button 
                    className="export-option-btn"
                    onClick={handleExportAll}
                  >
                    📥 Export All Incidents ({incidents.length})
                  </button>
                </div>

                <div className="export-option">
                  <button 
                    className="export-option-btn"
                    onClick={handleExportSelected}
                    disabled={selectedIncidents.size === 0}
                  >
                    ✅ Export Selected ({selectedIncidents.size})
                  </button>
                </div>

                <div className="export-option">
                  <label>Filter by Sales Work Order:</label>
                  <div className="filter-group">
                    <input
                      type="text"
                      placeholder="Enter Sales Work Order Number"
                      value={salesOrderFilter}
                      onChange={(e) => setSalesOrderFilter(e.target.value)}
                      list="sales-orders"
                    />
                    <datalist id="sales-orders">
                      {uniqueSalesOrders.map(order => (
                        <option key={order} value={order} />
                      ))}
                    </datalist>
                    <button 
                      className="filter-export-btn"
                      onClick={handleExportBySalesOrder}
                    >
                      Export
                    </button>
                  </div>
                </div>

                <button 
                  className="close-menu-btn"
                  onClick={() => setShowExportMenu(false)}
                >
                  Close
                </button>
              </div>
            )}

            {/* Selection Controls */}
            {!loading && incidents.length > 0 && (
              <div className="selection-controls">
                <label className="select-all-label">
                  <input
                    type="checkbox"
                    checked={selectedIncidents.size === incidents.length && incidents.length > 0}
                    onChange={handleSelectAll}
                  />
                  Select All
                </label>
                {selectedIncidents.size > 0 && (
                  <button 
                    className="clear-selection-btn"
                    onClick={() => setSelectedIncidents(new Set())}
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <p className="loading">Loading incidents...</p>
            ) : incidents.length === 0 ? (
              <p className="no-data">No incidents reported yet.</p>
            ) : (
              <div className="incidents-list">
                {incidents.map(incident => (
                  <div key={incident.id} className={`incident-card ${selectedIncidents.has(incident.id) ? 'selected' : ''}`}>
                    <div className="incident-selection">
                      <input
                        type="checkbox"
                        checked={selectedIncidents.has(incident.id)}
                        onChange={() => handleSelectIncident(incident.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
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
                              <strong>Sales Work Order Number:</strong> {incident.sales_work_order_number || 'N/A'}
                            </div>
                            <div className="detail-row">
                              <strong>Source of Incident:</strong> {incident.source_of_incident}
                            </div>
                            <div className="detail-row">
                              <strong>Preliminary Investigation Done:</strong> {incident.preliminary_investigation ? 'Yes' : 'No'}
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

                        {/* Attachments */}
                        {Array.isArray(incident.incident_attachments) && incident.incident_attachments.length > 0 && (
                          <div className="attachments-section">
                            <h4>Attachments</h4>
                            <div className="attachments-grid">
                              {incident.incident_attachments.map((attachment, index) => {
                                const url = attachment.signed_url || attachment.file_url;
                                const isVideo = /\.(mp4|mov|avi|webm)$/i.test(url) || attachment.file_type?.startsWith('video/');
                                const isImage = /\.(jpe?g|png|gif|webp|bmp)$/i.test(url) || attachment.file_type?.startsWith('image/');

                                return (
                                  <div key={attachment.id || index} className="attachment-item">
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

      {/* Acknowledge Modal - Keep existing code */}
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

      {/* Add CSS for new features */}
      <style jsx>{`
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .header-actions {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        .selection-count {
          font-weight: 600;
          color: #3498db;
        }
        .export-btn {
          padding: 10px 20px;
          background: #27ae60;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }
        .export-btn:hover {
          background: #229954;
        }
        .export-menu {
          background: white;
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .export-menu h3 {
          margin: 0 0 15px 0;
          color: #2c3e50;
        }
        .export-option {
          margin-bottom: 15px;
        }
        .export-option label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #34495e;
        }
        .export-option-btn {
          width: 100%;
          padding: 12px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }
        .export-option-btn:hover:not(:disabled) {
          background: #2980b9;
        }
        .export-option-btn:disabled {
          background: #95a5a6;
          cursor: not-allowed;
        }
        .filter-group {
          display: flex;
          gap: 10px;
        }
        .filter-group input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
        }
        .filter-export-btn {
          padding: 10px 20px;
          background: #e67e22;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }
        .filter-export-btn:hover {
          background: #d35400;
        }
        .close-menu-btn {
          width: 100%;
          padding: 10px;
          background: #95a5a6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 10px;
        }
        .close-menu-btn:hover {
          background: #7f8c8d;
        }
        .selection-controls {
          display: flex;
          gap: 15px;
          align-items: center;
          margin-bottom: 15px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .select-all-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .select-all-label input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .clear-selection-btn {
          padding: 6px 12px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }
        .clear-selection-btn:hover {
          background: #c0392b;
        }
        .incident-card {
          position: relative;
          border: 2px solid transparent;
          transition: border-color 0.2s;
        }
        .incident-card.selected {
          border-color: #3498db;
          background: #f0f8ff;
        }
        .incident-selection {
          position: absolute;
          top: 15px;
          left: 15px;
          z-index: 10;
        }
        .incident-selection input {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
        .incident-header {
          padding-left: 50px;
        }
      `}</style>
    </div>
  );
};

export default SuperuserDashboard;