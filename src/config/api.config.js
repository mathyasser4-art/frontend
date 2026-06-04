// API Configuration
// Set REACT_APP_USE_LOCAL environment variable to 'true' for local development
// In production (Vercel), this will default to false
const USE_LOCAL = process.env.REACT_APP_USE_LOCAL === 'true';

const API_CONFIG = {
  local: 'http://localhost:54112',
  production: 'https://backend-production-6752.up.railway.app'
};

export const API_BASE_URL = USE_LOCAL ? API_CONFIG.local : API_CONFIG.production;

// Feature flag to show or hide pricing packages across the app.
// Set to false to hide, change to true to restore pricing.
export const SHOW_PRICING = false;

// Feature flag to enable custom question bank & worksheets creation.
// Set to false to hide, change to true to restore custom worksheets.
export const ENABLE_CUSTOM_QUESTION_BANK = true;

export default API_BASE_URL;