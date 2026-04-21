import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9090';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }, //use json headers by default
});

// Attach JWT token to every request
api.interceptors.request.use( // Add auth token to headers
  (config) => { //why config and not request? Because axios uses "config" to refer to the request configuration object that contains all the details of the HTTP request being made, including headers, URL, method, etc. The interceptor function receives this config object as an argument, allowing you to modify it (e.g., by adding an Authorization header) before the request is sent out.
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error) 
);

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,//why response and not result? Because axios uses "response" to refer to the HTTP response object that is returned from the server after a request is made. The interceptor function receives this response object as an argument, allowing you to handle it (e.g., by checking for a 401 status code) before it is passed back to the calling code.
  (error) => {
    if (error.response?.status === 401) { // 401 Unauthorized means the token is invalid or expired, so we log out the user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on auth pages
      if (
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register')
      ) {
        window.location.href = '/login'; //force reload to clear state, since user is effectively logged out at this point
      }
    }
    return Promise.reject(error);
  }
);

export default api;
