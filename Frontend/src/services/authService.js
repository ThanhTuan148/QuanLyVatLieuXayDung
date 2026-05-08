// src/services/authService.js
import api from './api';
import storageHelper from './storageHelper';

const authService = {
  login: (username, password) => {
    return api.post('/auth/login', { username, password });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    storageHelper.clearGuestData(); // Ensure machine is clean for next user
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },

  getUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token') && !!localStorage.getItem('user');
  },

  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  changePassword: (userId, oldPassword, newPassword) => {
    return api.put(`/auth/${userId}/change-password`, { oldPassword, newPassword });
  },
};

export default authService;
