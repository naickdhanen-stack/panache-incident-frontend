// src/config.js
// Ensure the API base includes the /api prefix so frontend usersAPI('/users') maps to backend '/api/users'
export const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/api';

export const SOURCES_OF_INCIDENT = [
  'Drawing & design issues',
  'Wrong cutting list sent to production',
  'Management Review',
  'Wrong gluing',
  'Wrong site dimension taken by site supervisor',
  'Wrong item measurements taken by site supervisor',
  'Wrong timber used',
  'Assembly poorly done',
  'Poor finish of item',
  'Items missing with order',
  'Wrong item purchased',
  'Fittings missing ',
  'Items broken during transportation',
  'Commited delivery date and time not respected',
  'Other'
];

export const ROOT_CAUSES = [
  'Procedural',
  'Omission',
  'Wrong Products used',
  'Item not conform to customer\'s request and drawings'
];