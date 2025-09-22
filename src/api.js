import { auth } from './firebase';

// Get the API base URL based on environment
export const getApiBase = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_BASE_URL || 'https://purfood-backend-ebyxtmvpf-ipaulsuns-projects.vercel.app';
  }
  return 'http://localhost:4000';
};

/**
 * A wrapper around fetch that automatically adds the Firebase auth token.
 * @param {string} url The URL to fetch (can be relative or absolute).
 * @param {object} options The options for the fetch request.
 * @returns {Promise<Response>} The fetch response.
 */
export const authenticatedFetch = async (url, options = {}) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is signed in.');
  }

  const token = await user.getIdToken();

  // Convert relative URLs to absolute URLs using the API base
  const fullUrl = url.startsWith('http') ? url : `${getApiBase()}${url}`;
  
  // Debug logging for API calls
  console.log('🚀 API Call:', {
    originalUrl: url,
    fullUrl,
    method: options.method || 'GET',
    hasAuth: !!token
  });

  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  return fetch(fullUrl, { ...options, headers });
};

/**
 * Simple fetch wrapper for non-authenticated requests
 * @param {string} url The URL to fetch (can be relative or absolute).
 * @param {object} options The options for the fetch request.
 * @returns {Promise<Response>} The fetch response.
 */
export const apiFetch = async (url, options = {}) => {
  // Convert relative URLs to absolute URLs using the API base
  const fullUrl = url.startsWith('http') ? url : `${getApiBase()}${url}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(fullUrl, { ...options, headers });
};
