/**
 * API utility for making authenticated requests with automatic token handling
 * Automatically redirects to login on 401 Unauthorized errors
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://lead-gen-analytics-backend.onrender.com';

/**
 * Makes an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/dashboard/dashboard')
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise<any>} - Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');

  // Build headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - token is invalid or expired
    if (response.status === 401) {
      console.warn('Token expired or invalid - logging out');

      // Clear auth data
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');

      // Redirect to login
      window.location.href = '/authentication-login';

      throw new Error('Authentication failed - please log in again');
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // FastAPI 422 returns detail as an array - log the full detail for debugging
      console.error(`API ${response.status} on ${endpoint}:`, JSON.stringify(errorData.detail ?? errorData));
      const detail = Array.isArray(errorData.detail)
        ? errorData.detail.map(e => `${e.loc?.join('.')} - ${e.msg}`).join(', ')
        : errorData.detail;
      throw new Error(detail || `Request failed with status ${response.status}`);
    }

    // Return response data
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * GET request
 */
export const apiGet = (endpoint) => {
  return apiRequest(endpoint, { method: 'GET' });
};

/**
 * POST request
 */
export const apiPost = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * PUT request
 */
export const apiPut = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request
 */
export const apiDelete = (endpoint) => {
  return apiRequest(endpoint, { method: 'DELETE' });
};

/**
 * Check if user has a valid token
 */
export const hasValidToken = () => {
  const token = localStorage.getItem('access_token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};
