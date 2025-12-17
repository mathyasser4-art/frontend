// API Configuration
// Set USE_LOCAL to true for local development, false for production
const USE_LOCAL = true;

const API_CONFIG = {
  local: 'http://localhost:54112',
  production: 'https://abacus-2ntk.onrender.com'
};

export const API_BASE_URL = USE_LOCAL ? API_CONFIG.local : API_CONFIG.production;

export default API_BASE_URL;