import { auth } from './firebase';

/**
 * A wrapper around fetch that automatically adds the Firebase auth token.
 * @param {string} url The URL to fetch.
 * @param {object} options The options for the fetch request.
 * @returns {Promise<Response>} The fetch response.
 */
export const authenticatedFetch = async (url, options = {}) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is signed in.');
  }

  const token = await user.getIdToken();

  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  return fetch(url, { ...options, headers });
};
