import api from './api';

const debtService = {
  getAll: (params) => api.get('/debts', { params }),
  getStatistics: () => api.get('/debts/statistics'),
  getHistory: (id) => api.get(`/debts/${id}/history`),
  recordPayment: (data) => api.post('/debts/payment', data),
  getAppointments: (debtId) => api.get(`/debts/${debtId}/appointments`),
  createAppointment: (data) => api.post('/debts/appointments', data),
  completeAppointment: (id) => api.put(`/debts/appointments/${id}/complete`),
  deleteAppointment: (id) => api.delete(`/debts/appointments/${id}`),
};

export default debtService;
