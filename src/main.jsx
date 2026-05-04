import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          containerStyle={{ top: 52 }}
          toastOptions={{
            style: {
              background: '#0d0d0f',
              color: '#e0e0e0',
              border: '1px solid #1a1a1f',
              borderRadius: '14px',
              fontSize: '13px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              boxShadow: '0 8px 32px rgba(0,0,0,.6)',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#4ade80', secondary: '#0d0d0f' },
              style: { borderColor: 'rgba(74,222,128,.2)' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#0d0d0f' },
              style: { borderColor: 'rgba(248,113,113,.2)' },
            },
            duration: 3000,
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
