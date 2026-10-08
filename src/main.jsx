import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './features/auth/context/AuthContext.jsx'
import RoleThemeBinder from './components/RoleThemeBinder.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => {
        const status = error?.response?.status
        const data = error?.response?.data
        const url = error?.config?.url
        // eslint-disable-next-line no-console
        console.error('[mutation error]', { url, status, data, message: error?.message })
        const detail = data?.error || data?.title || error?.message || 'Request failed'
        if (typeof window !== 'undefined' && status && status !== 401) {
          window.alert(`Request failed (${status}): ${detail}`)
        }
      },
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <RoleThemeBinder />
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
