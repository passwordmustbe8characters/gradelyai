// GradelyAI — Auth utilities

const TOKEN_KEY = 'gradelyToken'
const USER_KEY = 'gradelyUser'
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function loginUser(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');
  saveAuth(data.token, data.user);
  return data;
}

export function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  const saved = localStorage.getItem(USER_KEY)
  if (!saved) return null
  try {
    return JSON.parse(saved)
  } catch {
    return null
  }
}

export function isLoggedIn() {
  return !!getToken()
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ─── AUTH API ─────────────────────────────────────────────────────────────────

export async function register(name, email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Registration failed')
  saveAuth(data.token, data.user)
  return data
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  saveAuth(data.token, data.user)
  return data
}

export async function fetchMe() {
  const token = getToken()
  if (!token) throw new Error('No token')
  
  const BASE_URL = import.meta.env.VITE_API_URL || ''
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch user')
  const data = await res.json()
  return data.user
}

// ─── PROJECT API ──────────────────────────────────────────────────────────────

export async function saveProject(projectData) {
  const res = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(projectData)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to save project')
  return data.project
}

export async function updateProject(id, projectData) {
  const res = await fetch(`${BASE_URL}/api/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(projectData)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to update project')
  return data.project
}

export async function createProject(projectData) {
  const BASE_URL = import.meta.env.VITE_API_URL || ''
const res = await fetch(`${BASE_URL}/api/projects`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...authHeaders()
  },
  body: JSON.stringify(projectData)
})
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create project')
  }
  return res.json()
}

export async function fetchProjects() {
  const res = await fetch(`${BASE_URL}/api/projects`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch projects')
  return data.projects
}

export async function fetchProject(id) {
  const res = await fetch(`${BASE_URL}/api/projects/${id}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch project')
  return data.project
}

export async function deleteProject(id) {
  const res = await fetch(`${BASE_URL}/api/projects/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to delete project')
  return data
}

export async function saveTestSession(projectId, sessionData) {
  const res = await fetch(`${BASE_URL}/api/test-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ project_id: projectId, ...sessionData })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to save test session')
  return data.session
}

export async function fetchTestSessions(projectId) {
  const res = await fetch(`${BASE_URL}/api/test-sessions/${projectId}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch test sessions')
  return data.sessions
}