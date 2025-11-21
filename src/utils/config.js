// src/config.js
// Ensure the API base includes the /api prefix so frontend usersAPI('/users') maps to backend '/api/users'
export const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

export const SOURCES_OF_INCIDENT = [
  'Customer Complaint',
  'Internal Audit',
  'Management Review',
  'Product Testing',
  'Production Process',
  'Supplier Issue',
  'Employee Report',
  'Equipment Failure',
  'Quality Control',
  'Other'
];

export const ROOT_CAUSES = [
  'Procedural',
  'Omission',
  'Wrong Products used',
  'Item not conform to customer\'s request and drawings'
];