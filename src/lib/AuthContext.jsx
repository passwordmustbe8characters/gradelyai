/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { getUser, getToken, logout as logoutFn, fetchMe } from './auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      // schedule state update to avoid synchronous setState inside effect
      setTimeout(() => setLoading(false), 0)
      return
    }

    fetchMe()
      .then(u => {
        setUser(u)
        localStorage.setItem('user', JSON.stringify(u))
        setLoading(false)
      })
      .catch(() => {
        logoutFn()
        setUser(null)
        setLoading(false)
      })
  }, [])

  const logout = () => {
    logoutFn()
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const u = await fetchMe()
      setUser(u)
      localStorage.setItem('user', JSON.stringify(u))
    } catch {
      logout()
    }
  }

  const markOnboarded = async () => {
    const token = getToken()
    if (!token) return false
    
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${BASE_URL}/api/auth/onboarded`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        await refreshUser()
        return true
      }
    } catch {
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, refreshUser, markOnboarded }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}