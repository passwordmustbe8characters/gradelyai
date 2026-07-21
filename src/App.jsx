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
import Gallery from './pages/Gallery' // <-- ADD THIS
import ProjectDetails from './pages/ProjectDetails'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import About from './pages/About'
import Humanizer from './pages/Humanizer'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/auth" state={{ redirect: window.location.pathname }} />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/project/:id" element={<ProjectDetails />} />
      <Route path="/gallery" element={<Gallery />} /> {/* <-- ADD THIS */}
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/start" element={<Intake />} />
      <Route path="/generate" element={<Generate />} />
      <Route path="/build" element={<Navigate to="/dashboard" replace />} />
      <Route path="/results" element={<Results />} />
      <Route path="/flashcards" element={<Flashcards />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/humanizer" element={<Humanizer />} />
      <Route path="/about" element={<About />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
    </Routes>
  )
}