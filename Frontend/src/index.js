// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Global Alert override to dispatch custom MUI Toast alerts instead of blocky browser alert windows
window.alert = (message) => {
  if (message === undefined || message === null) return;
  const msgStr = typeof message === 'object' ? JSON.stringify(message) : String(message);
  
  let severity = 'info';
  const msgLower = msgStr.toLowerCase();
  
  if (msgStr.includes('✅') || msgLower.includes('thành công') || msgLower.includes('thành công!')) {
    severity = 'success';
  } else if (msgStr.includes('❌') || msgLower.includes('lỗi') || msgLower.includes('thất bại') || msgLower.includes('không thể') || msgLower.includes('failed') || msgLower.includes('error')) {
    severity = 'error';
  } else if (msgStr.includes('⚠️') || msgLower.includes('cảnh báo') || msgLower.includes('lưu ý') || msgLower.includes('chưa') || msgLower.includes('yêu cầu') || msgLower.includes('vui lòng')) {
    severity = 'warning';
  }
  
  // Clean up prefix icons if they are already in the message
  const cleanMessage = msgStr
    .replace(/^✅\s*/, '')
    .replace(/^❌\s*/, '')
    .replace(/^⚠️\s*/, '')
    .replace(/^🎉\s*/, '');

  const event = new CustomEvent('global-alert', { 
    detail: { message: cleanMessage, severity } 
  });
  window.dispatchEvent(event);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
