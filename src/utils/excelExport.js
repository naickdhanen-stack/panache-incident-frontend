// src/utils/excelExport.js
import * as XLSX from 'xlsx';

/**
 * Export incidents to Excel file
 * @param {Array} incidents - Array of incident objects
 * @param {String} filename - Optional filename (defaults to incidents_export_[date].xlsx)
 */
export const exportIncidentsToExcel = (incidents, filename) => {
  if (!incidents || incidents.length === 0) {
    alert('No incidents to export');
    return;
  }

  // Prepare data for Excel
  const excelData = incidents.map(incident => ({
    'Incident ID': incident.id,
    'Subject': incident.subject,
    'Date of Incident': new Date(incident.date_of_incident).toLocaleDateString(),
    'Project Name': incident.project_name || 'N/A',
    'Sales Work Order Number': incident.sales_work_order_number || 'N/A',
    'Source of Incident': incident.source_of_incident,
    'Preliminary Investigation': incident.preliminary_investigation ? 'Yes' : 'No',
    'Details and Findings': incident.details_and_findings,
    'Suggestions': incident.suggestions || 'N/A',
    'Status': incident.status.toUpperCase(),
    'Submitted By': incident.user?.username || 'Unknown',
    'Department': incident.user?.department || 'N/A',
    'Submitted Date': new Date(incident.created_at).toLocaleDateString(),
    'Last Updated': new Date(incident.updated_at || incident.created_at).toLocaleDateString(),
    'Number of Attachments': incident.incident_attachments?.length || 0,
    'Has Response': incident.incident_responses?.length > 0 ? 'Yes' : 'No',
    'Root Cause': incident.incident_responses?.[0]?.root_cause || 'N/A',
    'Action Taken': incident.incident_responses?.[0]?.action_taken || 'N/A',
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const colWidths = [
    { wch: 10 },  // Incident ID
    { wch: 30 },  // Subject
    { wch: 15 },  // Date of Incident
    { wch: 25 },  // Project Name
    { wch: 25 },  // Sales Work Order Number
    { wch: 30 },  // Source of Incident
    { wch: 20 },  // Preliminary Investigation
    { wch: 50 },  // Details and Findings
    { wch: 40 },  // Suggestions
    { wch: 15 },  // Status
    { wch: 20 },  // Submitted By
    { wch: 20 },  // Department
    { wch: 15 },  // Submitted Date
    { wch: 15 },  // Last Updated
    { wch: 18 },  // Number of Attachments
    { wch: 15 },  // Has Response
    { wch: 25 },  // Root Cause
    { wch: 40 },  // Action Taken
  ];
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Incidents');

  // Generate filename
  const defaultFilename = `incidents_export_${new Date().toISOString().split('T')[0]}.xlsx`;
  const exportFilename = filename || defaultFilename;

  // Save file
  XLSX.writeFile(wb, exportFilename);
};

/**
 * Export filtered incidents based on sales work order number
 * @param {Array} incidents - Array of all incidents
 * @param {String} salesWorkOrderNumber - The sales work order number to filter by
 */
export const exportIncidentsBySalesOrder = (incidents, salesWorkOrderNumber) => {
  const filtered = incidents.filter(
    incident => incident.sales_work_order_number === salesWorkOrderNumber
  );

  if (filtered.length === 0) {
    alert(`No incidents found for Sales Work Order: ${salesWorkOrderNumber}`);
    return;
  }

  const filename = `incidents_${salesWorkOrderNumber}_${new Date().toISOString().split('T')[0]}.xlsx`;
  exportIncidentsToExcel(filtered, filename);
};