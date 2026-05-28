import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Intake from './pages/Intake'
import Generate from './pages/Generate'
import Results from './pages/Results'
import Flashcards from './pages/Flashcards'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import { useAuth } from './lib/AuthContext'
// 1. Import the test client interface here
import HumanizerClient from './components/HumanizerClient'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/auth" state={{ redirect: window.location.pathname }} />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/start" element={<Intake />} />
      <Route path="/generate" element={<Generate />} />
      <Route path="/results" element={<Results />} />
      <Route path="/flashcards" element={<Flashcards />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      {/* 2. Safe isolated test route for our math engine */}
      <Route path="/humanizer-test" element={<HumanizerClient />} />
    </Routes>
  )
}