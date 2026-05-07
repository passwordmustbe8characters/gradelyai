import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import session from 'express-session'
import multer from 'multer'
import fs from 'fs'
import process from 'process'
import db from './database.js'

dotenv.config()

const app = express()
const upload = multer({ dest: 'uploads/' })

app.use(cors())
app.use(express.json())
app.use(session({
  secret: process.env.ADMIN_SESSION_SECRET || 'gradelyai-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}))

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gradely2025'
const JWT_SECRET = process.env.JWT_SECRET || 'gradelyai-jwt-secret-2025'
const OPENAI_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────

function requireAdmin(req, res, next) {
  if (req.session?.isAdmin) return next()
  res.status(401).json({ error: 'Unauthorized' })
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// ─── PROXY: OpenAI ────────────────────────────────────────────────────────────

app.post('/api/claude', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    })

    const text = await response.text()
    if (!text || text.trim() === '') {
      return res.status(500).json({ error: { message: 'Empty response from Claude' } })
    }

    try {
      const data = JSON.parse(text)
      if (!response.ok) return res.status(response.status).json(data)
      res.json(data)
    } catch {
      res.status(500).json({ error: { message: 'Invalid response from Claude' } })
    }
  } catch (err) {
    res.status(500).json({ error: { message: err.message } })
  }
})

// ─── PROXY: Semantic Scholar ──────────────────────────────────────────────────

app.get('/api/papers', async (req, res) => {
  const { query } = req.query
  if (!query) return res.json({ data: [] })

  const queries = [
    query.split(' ').slice(0, 4).join(' '),
    query,
  ]

  for (const q of queries) {
    try {
      const encoded = encodeURIComponent(q)
      const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encoded}&limit=15&fields=title,authors,year,journal,externalIds,publicationVenue,openAccessPdf`
      const response = await fetch(url)
      if (!response.ok) continue
      const data = await response.json()
      if (data.data && data.data.length > 0) return res.json({ data: data.data })
    } catch {
      continue
    }
  }

  res.json({ data: [] })
})

// ─── ADMIN: Login ─────────────────────────────────────────────────────────────

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true
    res.json({ success: true })
  } else {
    res.status(401).json({ error: 'Wrong password' })
  }
})

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy()
  res.json({ success: true })
})

app.get('/api/admin/check', (req, res) => {
  res.json({ isAdmin: !!req.session?.isAdmin })
})

// ─── GUIDES: Public ───────────────────────────────────────────────────────────

app.get('/api/guides', (req, res) => {
  const { university, department } = req.query
  
  let guides

  if (university && department) {
    // Try exact match first
    guides = db.prepare(`
      SELECT * FROM guides 
      WHERE university = ? AND department = ?
      ORDER BY year DESC
    `).all(university, department)

    // Fall back to university match
    if (guides.length === 0) {
      guides = db.prepare(`
        SELECT * FROM guides 
        WHERE university = ?
        ORDER BY year DESC
      `).all(university)
    }
  } else {
    guides = db.prepare('SELECT * FROM guides ORDER BY university, department').all()
  }

  res.json({ guides })
})

app.get('/api/guides/:id', (req, res) => {
  const guide = db.prepare('SELECT * FROM guides WHERE id = ?').get(req.params.id)
  if (!guide) return res.status(404).json({ error: 'Guide not found' })
  res.json({ guide })
})

// ─── GUIDES: Admin ────────────────────────────────────────────────────────────

app.get('/api/admin/guides', requireAdmin, (req, res) => {
  const guides = db.prepare('SELECT * FROM guides ORDER BY university, department').all()
  res.json({ guides })
})

app.post('/api/admin/guides', requireAdmin, (req, res) => {
  const { university, department, year, label, structure, writing_expectations } = req.body

  if (!university || !department || !label || !structure) {
    return res.status(400).json({ error: 'University, department, label and structure are required' })
  }

  const result = db.prepare(`
    INSERT INTO guides (university, department, year, label, structure, writing_expectations)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(university, department, year, label, structure, writing_expectations || '')

  const guide = db.prepare('SELECT * FROM guides WHERE id = ?').get(result.lastInsertRowid)
  res.json({ guide })
})

app.put('/api/admin/guides/:id', requireAdmin, (req, res) => {
  const { university, department, year, label, structure, writing_expectations } = req.body

  db.prepare(`
    UPDATE guides 
    SET university = ?, department = ?, year = ?, label = ?, 
        structure = ?, writing_expectations = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(university, department, year, label, structure, writing_expectations || '', req.params.id)

  const guide = db.prepare('SELECT * FROM guides WHERE id = ?').get(req.params.id)
  res.json({ guide })
})

app.delete('/api/admin/guides/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM guides WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// ─── GUIDES: PDF Upload ───────────────────────────────────────────────────────

app.post('/api/admin/guides/upload', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const { university, department, year, label } = req.body
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    let text = ''

    if (req.file.mimetype === 'application/pdf') {
  const pdfParseModule = await import('pdf-parse')
  const pdfParse = pdfParseModule.default || pdfParseModule
  const buffer = fs.readFileSync(req.file.path)
  const data = await pdfParse(buffer)
  text = data.text
    } else {
      text = fs.readFileSync(req.file.path, 'utf-8')
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path)

    // Use AI to extract clean structure from the guide
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [
          {
            role: 'system',
            content: `You are an academic document analyst. Extract the chapter and subsection structure from Nigerian university project guides. Return only the clean structure as plain text with chapter headings and numbered subsections. Also extract any writing expectations or formatting requirements mentioned.`
          },
          {
            role: 'user',
            content: `Extract the project structure and any writing/formatting requirements from this Nigerian university project guide:

${text.substring(0, 8000)}

Return in this format:
STRUCTURE:
[chapter and subsection structure here]

WRITING EXPECTATIONS:
[any formatting rules, writing style requirements, page limits, font requirements, etc.]`
          }
        ]
      })
    })

    const aiData = await aiResponse.json()
    const aiText = aiData.choices[0].message.content

    const structureMatch = aiText.match(/STRUCTURE:\n([\s\S]*?)(?=WRITING EXPECTATIONS:|$)/i)
    const expectationsMatch = aiText.match(/WRITING EXPECTATIONS:\n([\s\S]*?)$/i)

    const structure = structureMatch ? structureMatch[1].trim() : text.substring(0, 3000)
    const writing_expectations = expectationsMatch ? expectationsMatch[1].trim() : ''

    const result = db.prepare(`
      INSERT INTO guides (university, department, year, label, structure, writing_expectations)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      university || 'Unknown University',
      department || 'Unknown Department',
      year || new Date().getFullYear().toString(),
      label || `${university} ${department} — ${year}`,
      structure,
      writing_expectations
    )

    const guide = db.prepare('SELECT * FROM guides WHERE id = ?').get(result.lastInsertRowid)
    res.json({ guide })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── START ────────────────────────────────────────────────────────────────────

const PORT = 3001
// ─── AUTH: Register ───────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const result = db.prepare(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
    ).run(name, email.toLowerCase().trim(), hashed)

    const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(result.lastInsertRowid)
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' })

    res.json({ user, token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── AUTH: Login ──────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim())
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password' })
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' })
    const safeUser = { ...user }
    delete safeUser.password

    res.json({ user: safeUser, token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── AUTH: Me ─────────────────────────────────────────────────────────────────

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ user })
})

// ─── PROJECTS: Save ───────────────────────────────────────────────────────────

app.post('/api/projects', requireAuth, (req, res) => {
  const { title, university, department, project_type, status, is_paid, chapters, abstract, refs, structure, project_info } = req.body

  try {
    const result = db.prepare(`
      INSERT INTO projects (user_id, title, university, department, project_type, status, is_paid, chapters, abstract, refs, structure, project_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, title, university, department, project_type,
      status || 'in_progress', is_paid ? 1 : 0,
      JSON.stringify(chapters || []),
      abstract || '',
      JSON.stringify(refs || []),
      JSON.stringify(structure || {}),
      JSON.stringify(project_info || {})
    )

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)
    res.json({ project })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PROJECTS: Update ─────────────────────────────────────────────────────────

app.put('/api/projects/:id', requireAuth, (req, res) => {
  const { title, status, is_paid, chapters, abstract, refs, structure, project_info, flashcard_scores, defense_readiness } = req.body

  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
    if (!project) return res.status(404).json({ error: 'Project not found' })

    db.prepare(`
      UPDATE projects SET
        title = ?, status = ?, is_paid = ?,
        chapters = ?, abstract = ?, refs = ?,
        structure = ?, project_info = ?,
        flashcard_scores = ?, defense_readiness = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      title || project.title,
      status || project.status,
      is_paid !== undefined ? (is_paid ? 1 : 0) : project.is_paid,
      JSON.stringify(chapters) || project.chapters,
      abstract || project.abstract,
      JSON.stringify(refs) || project.refs,
      JSON.stringify(structure) || project.structure,
      JSON.stringify(project_info) || project.project_info,
      JSON.stringify(flashcard_scores) || project.flashcard_scores,
      defense_readiness || project.defense_readiness,
      req.params.id, req.user.id
    )

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
    res.json({ project: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PROJECTS: Get all for user ───────────────────────────────────────────────

app.get('/api/projects', requireAuth, (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT id, title, university, department, project_type, status, is_paid, defense_readiness, created_at, updated_at
      FROM projects WHERE user_id = ? ORDER BY updated_at DESC
    `).all(req.user.id)
    res.json({ projects })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PROJECTS: Get single ─────────────────────────────────────────────────────

app.get('/api/projects/:id', requireAuth, (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
    if (!project) return res.status(404).json({ error: 'Project not found' })

    // Parse JSON fields
    const parsed = {
      ...project,
      chapters: JSON.parse(project.chapters || '[]'),
      refs: JSON.parse(project.refs || '[]'),
      structure: JSON.parse(project.structure || '{}'),
      project_info: JSON.parse(project.project_info || '{}'),
      flashcard_scores: JSON.parse(project.flashcard_scores || 'null'),
    }

    res.json({ project: parsed })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PROJECTS: Delete ─────────────────────────────────────────────────────────

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  try {
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
    if (!project) return res.status(404).json({ error: 'Project not found' })
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── TEST SESSIONS: Save ──────────────────────────────────────────────────────

app.post('/api/test-sessions', requireAuth, (req, res) => {
  const { project_id, mode, score, total, got, almost, missed } = req.body

  try {
    const result = db.prepare(`
      INSERT INTO test_sessions (user_id, project_id, mode, score, total, got, almost, missed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, project_id, mode, score, total, got || 0, almost || 0, missed || 0)

    // Update project defense readiness
    db.prepare('UPDATE projects SET defense_readiness = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(score, project_id)

    const session = db.prepare('SELECT * FROM test_sessions WHERE id = ?').get(result.lastInsertRowid)
    res.json({ session })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── TEST SESSIONS: Get history ───────────────────────────────────────────────

app.get('/api/test-sessions/:project_id', requireAuth, (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT * FROM test_sessions 
      WHERE user_id = ? AND project_id = ? 
      ORDER BY created_at DESC
    `).all(req.user.id, req.params.project_id)
    res.json({ sessions })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`GradelyAI server running on http://localhost:${PORT}`)
})