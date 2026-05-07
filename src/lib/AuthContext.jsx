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
      setTimeout(() => setLoading(false), 0)
      return
    }

    fetchMe()
      .then(u => {
        setTimeout(() => {
          setUser(u)
          setLoading(false)
        }, 0)
      })
      .catch(() => {
        logoutFn()
        setTimeout(() => {
          setUser(null)
          setLoading(false)
        }, 0)
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
    } catch {
      logout()
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}