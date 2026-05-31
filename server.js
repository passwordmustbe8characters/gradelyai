/* eslint-disable no-undef */
import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import multer from 'multer'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from './database.js'



// ⬇️ THE BULLETPROOF FIX: Force Node to load the legacy package correctly ⬇️
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse-new')
// ⬆️ END FIX ⬆️

dotenv.config()

const app = express()
const upload = multer({ dest: 'uploads/' })


app.use(express.json());

app.set('trust proxy', 1)

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://gradelyai-chi.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10mb' }))

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gradely2025'
const JWT_SECRET = process.env.JWT_SECRET || 'gradelyai-jwt-secret-2025'

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No admin token provided' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.isAdmin) {
      req.admin = decoded
      return next()
    }
    res.status(401).json({ error: 'Unauthorized: Not an admin' })
  } catch {
    res.status(401).json({ error: 'Invalid or expired admin token' })
  }
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

// ─── GRADELYAI: MASTER PIPELINE PRODUCTION ROUTES ─────────────────────────────

/**
 * 1. THE CHASSIS TEXT HUMANIZER & SUPERVISOR HIGHLIGHT REWRITER
 * POST /api/humanize -> Proxies to Colab T5 Engine with Paragraph Chunking
 */
app.post('/api/humanize', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: "Text field is strictly required." });
    }

    const HUMANIZER_API_URL = process.env.HUMANIZER_API_URL;
    if (!HUMANIZER_API_URL) {
      console.error("Missing HUMANIZER_API_URL env var");
      return res.status(500).json({ success: false, error: "Humanizer engine not configured." });
    }

    console.log(`[API] Processing humanizer run. Payload size: ${text.length} characters.`);

    // 1. Split text into paragraphs to preserve formatting and prevent crumpling!
    const paragraphs = text.split(/\n/).filter(p => p.trim() !== "");
    let finalHumanizedText = "";

    // 2. Process each paragraph individually
    for (const para of paragraphs) {
      try {
        const colabResponse = await fetch(HUMANIZER_API_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true' 
          },
          body: JSON.stringify({ text: para })
        });

        if (!colabResponse.ok) {
          console.error("Colab Engine Error on paragraph, keeping original.");
          finalHumanizedText += para + "\n\n"; // Fallback to original paragraph
          continue;
        }

        const colabData = await colabResponse.json();
        // Append the humanized paragraph and add a newline to separate them!
        finalHumanizedText += (colabData.humanized_text || para) + "\n\n";

      } catch (err) {
        console.error("Error processing paragraph:", err);
        finalHumanizedText += para + "\n"; // Fallback to original paragraph
      }
    }

    // 3. Return the properly formatted text
    return res.status(200).json({
      success: true,
      data: finalHumanizedText.trim() // Trim the very last extra newline
    });

  } catch (error) {
    console.error("Express API Error (Humanizer Proxy):", error);
    return res.status(500).json({ success: false, error: "Internal humanizer processing failure." });
  }
});

/**
 * 2. THE SUPERVISOR CORRECTION PERSISTENCE TRACKER
 * POST /api/projects/:id/persist-chapters
 */
app.post('/api/projects/:id/persist-chapters', requireAuth, async (req, res) => {
  const { chapters } = req.body;
  
  if (!chapters || !Array.isArray(chapters)) {
    return res.status(400).json({ success: false, error: "Valid chapters array required." });
  }

  try {
    // Failsafe validation guard: Verify the project belongs to the requesting user
    const existing = await db.execute({ 
      sql: 'SELECT id, is_paid FROM projects WHERE id = ? AND user_id = ?', 
      args: [req.params.id, req.user.id] 
    });
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project record context not found.' });
    }

    const projectRecord = existing.rows[0];

    // 3. THE CHAPTER 1 PAYWALL LOGIC GATE
    // If the account has not paid ₦5,000, reject any attempt to save text past Chapter 1
    if (!projectRecord.is_paid) {
      const hasRestrictedContent = chapters.some(ch => ch.number > 1 && ch.content && ch.content.trim().length > 0);
      if (hasRestrictedContent) {
        return res.status(402).json({ 
          success: false, 
          error: "Payment Required. Please unlock the full project path to modify Chapters 2-5." 
        });
      }
    }

    // Persist changes cleanly back to SQLite database columns
    await db.execute({
      sql: 'UPDATE projects SET chapters = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      args: [JSON.stringify(chapters), req.params.id, req.user.id]
    });

    return res.status(200).json({ success: true, message: "Project changes synchronized successfully." });

  } catch (error) {
    console.error("[Database Persistence Fault]:", error);
    return res.status(500).json({ success: false, error: "Failed to persist document modifications." });
  }
});

/**
 * 4. THE DEFENSE PREP PANELS & FLASHCARDS COMPILATION GATEWAY
 * POST /api/projects/:id/defense-prep
 */
app.post('/api/projects/:id/defense-prep', requireAuth, async (req, res) => {
  try {
    const existing = await db.execute({
      sql: 'SELECT chapters, project_info, is_paid FROM projects WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id]
    });

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const project = existing.rows[0];

    // Paywall Gate Verification Check
    if (!project.is_paid) {
      return res.status(402).json({ success: false, error: "Defense optimization features require premium access." });
    }

    const parsedChapters = JSON.parse(project.chapters || '[]');
    const parsedInfo = JSON.parse(project.project_info || '{}');
    
    // Stitch text context together cleanly
    const collectiveText = parsedChapters.map(c => c.content).join('\n\n');

    // Import the high-value Claude diagnostic tools directly from your ai.js schema setup
    const { generateStudentBreakdown, generateFlashcards, analyzeWeaknesses } = await import('./lib/ai.js');

    console.log(`[Defense Engine] Synthesizing evaluation assets for project: ${req.params.id}`);

    // Compute all three diagnostic layers simultaneously to minimize client processing requests
    const [breakdown, flashcards, weaknesses] = await Promise.all([
      generateStudentBreakdown(parsedInfo, collectiveText),
      generateFlashcards(parsedInfo, collectiveText),
      analyzeWeaknesses(parsedInfo, collectiveText)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        breakdown,
        flashcards,
        weaknesses
      }
    });

  } catch (error) {
    console.error("[Defense Prep Route Error]:", error);
    return res.status(500).json({ success: false, error: "Failed to compile defense training matrices." });
  }
});

// ─── PROXY: OpenAI ─────────────────────────────────────────────────
app.post('/api/ai', async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(req.body)
    })

    const text = await response.text()
    if (!text || text.trim() === '') {
      return res.status(500).json({ error: { message: 'Empty response from OpenAI' } })
    }

    try {
      const data = JSON.parse(text)
      if (!response.ok) return res.status(response.status).json(data)
      res.json(data)
    } catch {
      res.status(500).json({ error: { message: 'Invalid response from OpenAI' } })
    }
  } catch (err) {
    res.status(500).json({ error: { message: err.message } })
  }
})

// ─── PROXY: Semantic Scholar ──────────────────────────────────────────────────

app.get('/api/papers', async (req, res) => {
  const { query } = req.query
  if (!query) return res.json({ data: [] })

  const queries = [query.split(' ').slice(0, 4).join(' '), query]

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

// ─── ADMIN: Auth (Using JWT) ──────────────────────────────────────────────────

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ isAdmin: true }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ success: true, token })
  } else {
    res.status(401).json({ error: 'Wrong password' })
  }
})

app.post('/api/admin/logout', (req, res) => {
  res.json({ success: true })
})

app.get('/api/admin/check', requireAdmin, (req, res) => {
  res.json({ isAdmin: true })
})

// ─── GUIDES: Public ───────────────────────────────────────────────────────────

app.get('/api/guides', async (req, res) => {
  try {
    const { university, department } = req.query
    let result

    if (university && department) {
      result = await db.execute({
        sql: 'SELECT * FROM guides WHERE university = ? AND department = ? ORDER BY year DESC',
        args: [university, department]
      })
      if (result.rows.length === 0) {
        result = await db.execute({
          sql: 'SELECT * FROM guides WHERE university = ? ORDER BY year DESC',
          args: [university]
        })
      }
    } else {
      result = await db.execute('SELECT * FROM guides ORDER BY university, department')
    }
    res.json({ guides: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/guides/:id', async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM guides WHERE id = ?', args: [req.params.id] })
    if (result.rows.length === 0) return res.status(404).json({ error: 'Guide not found' })
    res.json({ guide: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GUIDES: Admin ────────────────────────────────────────────────────────────

app.get('/api/admin/guides', requireAdmin, async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM guides ORDER BY university, department')
    res.json({ guides: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/admin/guides', requireAdmin, async (req, res) => {
  const { university, department, year, label, structure, writing_expectations } = req.body
  if (!university || !department || !label || !structure) {
    return res.status(400).json({ error: 'University, department, label and structure are required' })
  }
  try {
    const result = await db.execute({
      sql: 'INSERT INTO guides (university, department, year, label, structure, writing_expectations) VALUES (?, ?, ?, ?, ?, ?)',
      args: [university, department, year, label, structure, writing_expectations || '']
    })
    const guide = await db.execute({ sql: 'SELECT * FROM guides WHERE id = ?', args: [result.lastInsertRowid] })
    res.json({ guide: guide.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/admin/guides/:id', requireAdmin, async (req, res) => {
  const { university, department, year, label, structure, writing_expectations } = req.body
  try {
    await db.execute({
      sql: 'UPDATE guides SET university = ?, department = ?, year = ?, label = ?, structure = ?, writing_expectations = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [university, department, year, label, structure, writing_expectations || '', req.params.id]
    })
    const result = await db.execute({ sql: 'SELECT * FROM guides WHERE id = ?', args: [req.params.id] })
    res.json({ guide: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/admin/guides/:id', requireAdmin, async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM guides WHERE id = ?', args: [req.params.id] })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GUIDES: PDF Upload ───────────────────────────────────────────────────────

app.post('/api/admin/guides/upload', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const { university, department, year, label } = req.body
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

   let text = ''
    if (req.file.mimetype === 'application/pdf') {
      const buffer = fs.readFileSync(req.file.path)
      
      let parseFunction = pdfParse
      if (typeof parseFunction !== 'function') parseFunction = pdfParse.default
      if (typeof parseFunction !== 'function') parseFunction = Object.values(pdfParse).find(val => typeof val === 'function')
      
      if (typeof parseFunction !== 'function') {
        console.error("PDF Library Object:", pdfParse)
        return res.status(500).json({ error: 'Server configuration error: PDF library failed to load.' })
      }

      const data = await parseFunction(buffer)
      text = data.text
    } else {
      text = fs.readFileSync(req.file.path, 'utf-8')
    }

    fs.unlinkSync(req.file.path)

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'gpt-40-mini',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Extract the project structure and writing requirements from this Nigerian university project guide:

${text.substring(0, 8000)}

Return in this format:
STRUCTURE:
[chapter and subsection structure]

WRITING EXPECTATIONS:
[formatting rules, font, spacing, citation style, page limits etc]`
        }]
      })
    })

    const aiData = await aiResponse.json()

    if (aiData.error) {
      console.error('Anthropic API Error:', aiData.error)
      return res.status(500).json({ error: `Anthropic API Error: ${aiData.error.message}` })
    }

    if (!aiData.content || !aiData.content[0]) {
      console.error('Unexpected AI Response:', aiData)
      return res.status(500).json({ error: 'AI returned an empty or unexpected response.' })
    }

    const aiText = aiData.content[0].text

    const structureMatch = aiText.match(/STRUCTURE:\n([\s\S]*?)(?=WRITING EXPECTATIONS:|$)/i)
    const expectationsMatch = aiText.match(/WRITING EXPECTATIONS:\n([\s\S]*?)$/i)

    const structure = structureMatch ? structureMatch[1].trim() : text.substring(0, 3000)
    const writing_expectations = expectationsMatch ? expectationsMatch[1].trim() : ''
    const finalLabel = label || `${university} ${department} — ${year}`

    const result = await db.execute({
      sql: 'INSERT INTO guides (university, department, year, label, structure, writing_expectations) VALUES (?, ?, ?, ?, ?, ?)',
      args: [
        university || 'Unknown University',
        department || 'Unknown Department',
        year || new Date().getFullYear().toString(),
        finalLabel,
        structure,
        writing_expectations
      ]
    })

    const guide = await db.execute({ sql: 'SELECT * FROM guides WHERE id = ?', args: [result.lastInsertRowid] })
    res.json({ guide: guide.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── AUTH: Register ───────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

  try {
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email.toLowerCase().trim()] })
    if (existing.rows.length > 0) return res.status(400).json({ error: 'An account with this email already exists' })

    const hashed = await bcrypt.hash(password, 10)
    const result = await db.execute({
      sql: 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      args: [name, email.toLowerCase().trim(), hashed]
    })

    const userResult = await db.execute({ sql: 'SELECT id, name, email, created_at FROM users WHERE id = ?', args: [result.lastInsertRowid] })
    const user = userResult.rows[0]
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' })

    res.json({ user, token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── AUTH: Login ──────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

  try {
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email.toLowerCase().trim()] })
    if (result.rows.length === 0) return res.status(401).json({ error: 'No account found with this email' })

    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Incorrect password' })

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' })
    const safeUser = { ...user }
    delete safeUser.password

    res.json({ user: safeUser, token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── AUTH: Me ─────────────────────────────────────────────────────────────────

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT id, name, email, created_at FROM users WHERE id = ?', args: [req.user.id] })
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' })
    res.json({ user: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PROJECTS: Save ───────────────────────────────────────────────────────────

app.post('/api/projects', requireAuth, async (req, res) => {
  const { title, university, department, project_type, status, is_paid, chapters, abstract, references, structure, project_info } = req.body
  try {
    const result = await db.execute({
      sql: 'INSERT INTO projects (user_id, title, university, department, project_type, status, is_paid, chapters, abstract, refs, structure, project_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        req.user.id, title, university, department, project_type,
        status || 'in_progress', is_paid ? 1 : 0,
        JSON.stringify(chapters || []),
        abstract || '',
        JSON.stringify(references || []),
        JSON.stringify(structure || {}),
        JSON.stringify(project_info || {})
      ]
    })
    const project = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [result.lastInsertRowid] })
    res.json({ project: project.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PROJECTS: Update ─────────────────────────────────────────────────────────

app.put('/api/projects/:id', requireAuth, async (req, res) => {
  const { title, status, is_paid, chapters, abstract, references, structure, project_info, flashcard_scores, defense_readiness } = req.body
  try {
    const existing = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ? AND user_id = ?', args: [req.params.id, req.user.id] })
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Project not found' })
    const p = existing.rows[0]

    await db.execute({
      sql: 'UPDATE projects SET title = ?, status = ?, is_paid = ?, chapters = ?, abstract = ?, refs = ?, structure = ?, project_info = ?, flashcard_scores = ?, defense_readiness = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      args: [
        title || p.title,
        status || p.status,
        is_paid !== undefined ? (is_paid ? 1 : 0) : p.is_paid,
        chapters ? JSON.stringify(chapters) : p.chapters,
        abstract || p.abstract,
        references ? JSON.stringify(references) : p.refs,
        structure ? JSON.stringify(structure) : p.structure,
        project_info ? JSON.stringify(project_info) : p.project_info,
        flashcard_scores ? JSON.stringify(flashcard_scores) : p.flashcard_scores,
        defense_readiness || p.defense_readiness,
        req.params.id, req.user.id
      ]
    })

    const updated = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [req.params.id] })
    res.json({ project: updated.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PROJECTS: Get all ────────────────────────────────────────────────────────

app.get('/api/projects', requireAuth, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT id, title, university, department, project_type, status, is_paid, defense_readiness, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC',
      args: [req.user.id]
    })
    res.json({ projects: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PROJECTS: Get single ─────────────────────────────────────────────────────

app.get('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ? AND user_id = ?', args: [req.params.id, req.user.id] })
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' })
    const project = result.rows[0]
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

app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const existing = await db.execute({ sql: 'SELECT id FROM projects WHERE id = ? AND user_id = ?', args: [req.params.id, req.user.id] })
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Project not found' })
    await db.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [req.params.id] })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── TEST SESSIONS ────────────────────────────────────────────────────────────

app.post('/api/test-sessions', requireAuth, async (req, res) => {
  const { project_id, mode, score, total, got, almost, missed } = req.body
  try {
    const result = await db.execute({
      sql: 'INSERT INTO test_sessions (user_id, project_id, mode, score, total, got, almost, missed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [req.user.id, project_id, mode, score, total, got || 0, almost || 0, missed || 0]
    })
    await db.execute({ sql: 'UPDATE projects SET defense_readiness = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', args: [score, project_id] })
    const session = await db.execute({ sql: 'SELECT * FROM test_sessions WHERE id = ?', args: [result.lastInsertRowid] })
    res.json({ session: session.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/test-sessions/:project_id', requireAuth, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM test_sessions WHERE user_id = ? AND project_id = ? ORDER BY created_at DESC',
      args: [req.user.id, req.params.project_id]
    })
    res.json({ sessions: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── START ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running open on port ${PORT}`);
});

// Triggering production deployment