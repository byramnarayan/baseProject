/**
 * Auth Module
 * 
 * This module handles client-side authentication for the frontend.
 * It manages the JSON Web Token (JWT) stored in localStorage and 
 * provides a centralized way to fetch and cache the current user's data.
 */

// Cache variables to prevent redundant API calls
let currentUser = null;
let fetchPromise = null;

/**
 * Fetches the currently authenticated user based on the JWT token.
 * 
 * How it works:
 * 1. Checks if we already have the user in memory (currentUser). If so, returns it instantly.
 * 2. Checks if a network request is already happening (fetchPromise). If so, returns that promise 
 *    so multiple components waiting for the user don't trigger duplicate network requests.
 * 3. Checks localStorage for the 'access_token'. If none exists, returns null.
 * 4. Sends a request to '/api/users/me' with the token in the Authorization header.
 * 5. If valid, caches the user and returns it.
 * 6. If invalid (e.g., token expired), it removes the bad token and returns null.
 * 
 * @returns {Promise<Object|null>} The user object if authenticated, otherwise null.
 */
export async function getCurrentUser() {
  // 1. Check in-memory cache
  if (currentUser) {
    return currentUser;
  }

  // 2. Return in-progress fetch to prevent duplicate API calls
  if (fetchPromise) {
    return fetchPromise;
  }

  // 3. Get token from browser storage
  const token = localStorage.getItem("access_token");
  if (!token) {
    return null; // Not logged in
  }

  // 4. Start network request and store the promise
  fetchPromise = (async () => {
    try {
      const response = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`, // Pass the JWT token to the backend
        },
      });

      if (response.ok) {
        // 5. Token is valid, parse and cache user
        currentUser = await response.json();
        return currentUser;
      }

      // 6. Token is invalid or expired. Clear it out.
      localStorage.removeItem("access_token");
      return null;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    } finally {
      // Clean up the promise tracker once the request is totally finished
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Logs the current user out.
 * 
 * How it works:
 * 1. Deletes the JWT token from localStorage.
 * 2. Clears the in-memory cache of the user.
 * 3. Redirects the browser to the home page.
 */
export function logout() {
  localStorage.removeItem("access_token");
  currentUser = null;
  window.location.href = "/";
}

/**
 * Retrieves the raw JWT access token from localStorage.
 * 
 * @returns {string|null} The token string, or null if not found.
 */
export function getToken() {
  return localStorage.getItem("access_token");
}

/**
 * Saves a new JWT access token into localStorage.
 * Usually called right after a successful login.
 * 
 * @param {string} token - The JWT token to save.
 */
export function setToken(token) {
  localStorage.setItem("access_token", token);
}

/**
 * Forces the app to forget the currently cached user.
 * This is useful if the user updates their profile (like changing their username)
 * and you need the frontend to fetch the fresh data on the next getCurrentUser() call.
 */
export function clearUserCache() {
  currentUser = null;
}
