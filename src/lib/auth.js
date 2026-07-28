// GradelyAI — Auth utilities

const TOKEN_KEY = 'gradelyToken'
const USER_KEY = 'gradelyUser'
const BASE_URL = import.meta.env.VITE_API_URL || '';

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

// Sweeps every gradely*-prefixed key out of both storages. Mobile Safari can
// keep a tab's sessionStorage alive across app-switches for a long time
// (unlike a real tab close), so leftover data from earlier testing can sit
// near the per-origin quota indefinitely — silently breaking unrelated writes
// (like saving a fresh login token) with no obvious cause to the person
// hitting it. Self-healing this automatically means nobody has to be told to
// go clear site data by hand.
function clearAppStorage() {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const staleKeys = []
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i)
        if (key && key.startsWith('gradely')) staleKeys.push(key)
      }
      staleKeys.forEach(k => store.removeItem(k))
    } catch {
      // storage inaccessible entirely (private-mode edge cases, etc.) — nothing to clean up
    }
  }
}

function safeSetItem(store, key, value) {
  try {
    store.setItem(key, value)
    return true
  } catch {
    // Likely QuotaExceededError from accumulated stale data — wipe it and retry once
    clearAppStorage()
    try {
      store.setItem(key, value)
      return true
    } catch {
      return false
    }
  }
}

export function saveAuth(token, user) {
  safeSetItem(localStorage, TOKEN_KEY, token)
  safeSetItem(localStorage, USER_KEY, JSON.stringify(user))
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
  clearAppStorage()
}

export function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ─── AUTH API ─────────────────────────────────────────────────────────────────

// Mobile networks (cellular handoffs, momentary drops, iOS backgrounding an
// in-flight request) fail a fetch at the network layer often enough that a
// single blip shouldn't force the student to re-type their password and hit
// submit again. Only retries on an actual network-level failure (fetch()
// throwing — Safari reports this as "Load failed") — an HTTP error response
// (wrong password, etc.) is a real answer from the server and never retried.
async function fetchWithRetry(url, options, retries = 1) {
  try {
    return await fetch(url, options)
  } catch (err) {
    if (retries <= 0) throw err
    await new Promise(r => setTimeout(r, 800))
    return fetchWithRetry(url, options, retries - 1)
  }
}

export async function register(name, email, password) {
  // Starting a new session is a natural boundary to sweep out any stale
  // leftover data before it can interfere with anything — cheaper to prevent
  // than to wait for a quota error to happen and retry after the fact.
  clearAppStorage()
  let res
  try {
    res = await fetchWithRetry(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })
  } catch {
    throw new Error('Could not reach the server. Please check your connection and try again.')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Registration failed')
  saveAuth(data.token, data.user)
  return data
}

export async function login(email, password) {
  clearAppStorage()
  let res
  try {
    res = await fetchWithRetry(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
  } catch {
    throw new Error('Could not reach the server. Please check your connection and try again.')
  }
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