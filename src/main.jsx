import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { queryClient } from './lib/queryClient.js'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#181818',
            color: '#e8e8e8',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: "'Syne', sans-serif",
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#2dc653', secondary: '#111' } },
          error:   { iconTheme: { primary: '#e94560', secondary: '#111' } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
)
