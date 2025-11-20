import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [role, setRole] = useState("");

  const [formData, setFormData] = useState({
    complaint_id: "",
    details_and_findings: "",
    investigation_date: "",
    investigation_findings: ""
  });

  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setComplaints(data);
  };

  useEffect(() => {
    fetchComplaints();
    const storedRole = localStorage.getItem("role");
    if (storedRole) setRole(storedRole);
  }, []);

  const handleSelectComplaint = (id) => {
    const complaint = complaints.find((c) => c.id === id);
    setSelectedComplaint(complaint);
    setShowForm(true);
    setFormData({
      complaint_id: complaint.id,
      details_and_findings: complaint.details_and_findings || "",
      investigation_date: "",
      investigation_findings: ""
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateComplaint = async () => {
    const { error } = await supabase
      .from("complaints")
      .update({
        details_and_findings: formData.details_and_findings,
        investigation_date: formData.investigation_date,
        investigation_findings: formData.investigation_findings,
        status: "investigated"
      })
      .eq("id", formData.complaint_id);

    if (!error) {
      fetchComplaints();
      alert("Investigation details submitted!");
      setShowForm(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Admin Dashboard</h1>

      <button className="filter-button" onClick={() => setShowFilter(!showFilter)}>
        Filter
      </button>

      <button className="logout-button" onClick={() => setLogoutConfirm(true)}>
        Log Out
      </button>

      <div className="complaints-list">
        {complaints.map((complaint) => (
          <div
            key={complaint.id}
            className="complaint-card"
            onClick={() => handleSelectComplaint(complaint.id)}
          >
            <p><strong>ID:</strong> {complaint.id}</p>
            <p><strong>Subject:</strong> {complaint.subject}</p>
            <p><strong>Status:</strong> {complaint.status}</p>
          </div>
        ))}
      </div>

      {showForm && selectedComplaint && (
        <div className="modal">
          <div className="modal-content">
            <h2>Investigation Form</h2>

            <label>Details of Mistake Committed and Findings *</label>
            <textarea
              name="details_and_findings"
              value={formData.details_and_findings}
              onChange={handleInputChange}
              required
              rows="5"
              placeholder="Explain the mistake committed and your findings..."
            ></textarea>

            <label>Investigation Date *</label>
            <input
              type="date"
              name="investigation_date"
              value={formData.investigation_date}
              onChange={handleInputChange}
              required
            />

            <label>Investigation Actions Taken *</label>
            <textarea
              name="investigation_findings"
              value={formData.investigation_findings}
              onChange={handleInputChange}
              required
              rows="4"
              placeholder="What actions were taken during investigation?"
            ></textarea>

            <button onClick={updateComplaint} className="submit-btn">
              Submit
            </button>

            <button onClick={() => setShowForm(false)} className="cancel-btn">
              Close
            </button>
          </div>
        </div>
      )}

      {logoutConfirm && (
        <div className="modal confirm-modal">
          <div className="modal-content">
            <p>Are you sure you want to log out?</p>
            <button onClick={logout} className="logout-confirm-btn">
              Yes, Log Out
            </button>
            <button
              onClick={() => setLogoutConfirm(false)}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
