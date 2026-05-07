import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import App from './App'
import './index.css'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
)