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
import Groq from 'groq-sdk'



// ⬇️ THE BULLETPROOF FIX: Force Node to load the legacy package correctly ⬇️
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse-new')
// ⬆️ END FIX ⬆️


dotenv.config()

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

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

// ============================================
// MICRO-HUMANIZER CLASS (Pure Node.js, no AI)
// ============================================



// ─── GRADELYAI: MASTER PIPELINE PRODUCTION ROUTES ─────────────────────────────

/**
 * 1. THE MICRO-HUMANIZER (Replaces T5 Colab Engine)
 * Uses programmatic post-processing instead of slow AI rewriting.
 */
app.post('/api/humanize', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: "Text field is strictly required." });
    }

    // 1. The AI Vocabulary Swapper (Same as before)
    const vocabSwaps = {
      "crucial": "key", "furthermore": "also", "moreover": "additionally",
      "delve": "explore", "intricate": "complex", "vital": "important",
      "underscore": "highlight", "utilize": "use", "pivotal": "major",
      "significant": "major", "numerous": "many", "various": "different",
      "facilitate": "help", "leverage": "use", "robust": "strong",
      "comprehensive": "full", "essential": "needed", "paramount": "top",
      "ensure": "make sure", "therefore": "so", "consequently": "as a result",
      "additionally": "also", "notably": "especially", "subsequently": "later",
      "fundamental": "basic", "intriguing": "interesting", "navigate": "handle",
      "foster": "encourage", "enhance": "improve", "optimize": "improve",
      "streamline": "simplify", "innovative": "new", "revolutionize": "change",
      "transformative": "changing", "groundbreaking": "new", "holistic": "full",
      "paradigm": "model", "synergy": "teamwork", "domain": "area",
      "realm": "area", "endeavor": "effort", "cornerstone": "foundation",
      "imperative": "must", "profound": "deep", "elucidate": "explain",
      "delineate": "outline", "expound": "explain", "accentuate": "highlight",
      "amalgamation": "mix", "synthesis": "mix", "convergence": "meeting",
      "ecosystem": "system", "trajectory": "path", "catalyst": "spark",
      "underpin": "support", "substantiate": "prove", "corroborate": "confirm",
      "marginalized": "ignored", "prerequisite": "requirement",
      "encompass": "include", "incorporate": "add", "proactive": "active",
      "evaluate": "check", "assess": "check", "analyze": "study", "examine": "look at"
    };

    let humanizedText = text;
    
    // Apply vocabulary swaps (case-insensitive)
    for (const [aiWord, humanWord] of Object.entries(vocabSwaps)) {
      const regex = new RegExp(`\\b${aiWord}\\b`, 'gi');
      humanizedText = humanizedText.replace(regex, (match) => {
        return match[0].toUpperCase() === match[0] ? humanWord[0].toUpperCase() + humanWord.slice(1) : humanWord;
      });
    }

    // 2. Safe Conversational Pivot Injector (Every 5th sentence)
    const sentences = humanizedText.split(/(?<=[.!?])\s+/);
    const humanizedSentences = [];

    for (let i = 0; i < sentences.length; i++) {
      let sentence = sentences[i];

      // Only inject a pivot every 5th sentence to avoid crumpling
      if (i > 0 && i % 5 === 4) {
        const pivots = ["Look, ", "The reality is, ", "In practice, ", "Simply put, ", "Basically, "];
        const randomPivot = pivots[Math.floor(Math.random() * pivots.length)];
        sentence = randomPivot + sentence.charAt(0).toLowerCase() + sentence.slice(1);
      }

      humanizedSentences.push(sentence);
    }

    humanizedText = humanizedSentences.join(' ');

    // 3. Final Clean up
    humanizedText = humanizedText.replace(/\s+([,.])/g, '$1');

    return res.status(200).json({
      success: true,
      data: humanizedText
    });

  } catch (error) {
    console.error("Micro-Humanizer Error:", error);
    return res.status(500).json({ success: false, error: "Humanizer processing failure." });
  }
});

// ============================================
// GROQ + TOPIC SENTENCE DICTATOR
// ============================================
app.post('/api/socratic-generate', requireAuth, async (req, res) => {
  const { messages, projectInfo, chapterStructure } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, error: 'Messages array is required' });
  }
  
  try {
    // STEP 1: Extract the student's last message (their topic sentence)
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const studentTopicSentence = lastUserMessage?.content || '';
    
    // STEP 2: Check if student actually provided enough content
    const wordCount = studentTopicSentence.trim().split(/\s+/).length;
    const isSubstantial = wordCount >= 12;  // Minimum 12 words
    
    // STEP 3: If message is too short, ask for more detail (not a draft)
    if (!isSubstantial && !studentTopicSentence.toLowerCase().includes('yes') && !studentTopicSentence.toLowerCase().includes('no')) {
      return res.json({
        success: true,
        message: `Can you give me a bit more detail? Write at least 12-15 words explaining your main point about ${projectInfo?.topic || 'this topic'}. For example: "The main problem with ${projectInfo?.topic || 'this topic'} is that..."`,
        isShortResponse: true
      });
    }
    
    // STEP 4: Check if this is a conversational response (yes/no/ok)
    const isConversational = ['yes', 'no', 'ok', 'okay', 'sure', 'got it', 'thanks', 'next', 'continue'].some(word => 
      studentTopicSentence.toLowerCase().trim() === word || studentTopicSentence.toLowerCase().trim() === `${word}.`
    );
    
    if (isConversational) {
      // Just acknowledge and ask next question
      return res.json({
        success: true,
        message: "Great! Let's move to the next section. " + getNextQuestionPrompt(chapterStructure, messages),
        isConversational: true
      });
    }
    
    // STEP 5: Generate supporting text using Groq
    // The system prompt forces the AI to use the student's exact words as the FIRST sentence
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an academic writing assistant that helps students build their projects.

CRITICAL RULE - YOU MUST FOLLOW THIS EXACTLY:
The student has provided their core argument. You MUST start your response with THEIR EXACT WORDS as the first sentence.

Student's exact words: "${studentTopicSentence}"

YOUR RESPONSE MUST:
1. Begin with: "${studentTopicSentence}" (copy it exactly, word for word)
2. Then write 3-5 supporting sentences that provide evidence, examples, or explanation
3. Do NOT change the student's wording in the first sentence
4. Do NOT add your own topic sentence
5. Keep supporting sentences clear and academic but not robotic

FORBIDDEN WORDS (never use these): crucial, furthermore, moreover, delve, robust, leverage, utilize, pivotal, underscore, notably, consequently, accordingly, nevertheless

EXAMPLE OF CORRECT RESPONSE:
[Student's exact words]. Supporting sentence one. Supporting sentence two. Supporting sentence three.

Now write your response starting with the student's exact words.`
        },
        {
          role: "user",
          content: `My main point is: ${studentTopicSentence}\n\nPlease write 3-5 supporting sentences for my section: ${chapterStructure?.currentSection?.title || 'current section'}`
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });
    
    let aiResponse = completion.choices[0].message.content;
    
    // STEP 6: Verify the response starts with the student's exact words
    // If not, force it
    if (!aiResponse.toLowerCase().startsWith(studentTopicSentence.toLowerCase().substring(0, 50))) {
      aiResponse = `${studentTopicSentence} ${aiResponse}`;
    }
    
    // STEP 7: Light cleanup (remove double spaces, fix punctuation)
    aiResponse = aiResponse.replace(/\s+/g, ' ').trim();
    aiResponse = aiResponse.replace(/\s+([.!?])/g, '$1');
    
    // STEP 8: Check if this completes the chapter
    const allSectionsComplete = checkAllSectionsComplete(chapterStructure, messages);
    
    let followUp = "";
    if (allSectionsComplete) {
      followUp = "\n\n[CHAPTER_1_COMPLETE] 🎉 Chapter 1 is complete! Click 'Save & Review' to see your work. To continue with Chapters 2-5, you'll need to unlock the full project.";
    } else {
      followUp = `\n\n✅ Section ${chapterStructure?.currentSection?.title || 'this section'} is ready! Shall we move to the next section?`;
    }
    
    res.json({
      success: true,
      message: aiResponse + followUp,
      studentTopicSentence: studentTopicSentence,
      wordCount: wordCount,
      isSubstantial: isSubstantial
    });
    
  } catch (error) {
    console.error('Groq API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      fallback: "I had trouble generating that section. Could you rephrase your main point and try again?"
    });
  }
});

// Helper function: Get next question prompt
function getNextQuestionPrompt(chapterStructure, messages) {
  const sections = chapterStructure?.sections || [];
  const completedCount = messages.filter(m => m.role === 'assistant' && m.content.includes('section is ready')).length;
  
  if (completedCount < sections.length) {
    const nextSection = sections[completedCount];
    return `Tell me in your own words: what is the main point you want to make in ${nextSection?.title || 'the next section'}?`;
  }
  
  return "Would you like to review what we've written so far?";
}

// Helper function: Check if all sections are complete
function checkAllSectionsComplete(chapterStructure, messages) {
  const totalSections = chapterStructure?.sections?.length || 5;
  const completedIndicators = messages.filter(m => 
    m.role === 'assistant' && 
    (m.content.includes('section is ready') || m.content.includes('Section complete'))
  ).length;
  
  return completedIndicators >= totalSections;
}


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
  sql: 'INSERT INTO users (name, email, password, onboarded, is_admin) VALUES (?, ?, ?, 0, 0)',
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
   const safeUser = { 
  ...user, 
  onboarded: user.onboarded === 1,
  is_admin: user.is_admin === 1
}
delete safeUser.password

    res.json({ user: safeUser, token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── AUTH: Me ─────────────────────────────────────────────────────────────────

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
   const result = await db.execute({ sql: 'SELECT id, name, email, created_at, onboarded, is_admin FROM users WHERE id = ?', args: [req.user.id] })
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' })
  res.json({ user: { ...result.rows[0], onboarded: result.rows[0].onboarded === 1 } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── ONBOARDING: Mark complete ────────────────────────────────────────────────
app.post('/api/auth/onboarded', requireAuth, async (req, res) => {
  try {
    await db.execute({
      sql: 'UPDATE users SET onboarded = 1 WHERE id = ?',
      args: [req.user.id]
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── NEW PROJECT: Reset session but keep user onboarded ───────────────────────
app.post('/api/auth/new-project', requireAuth, async (req, res) => {
  try {
    res.json({ success: true, message: 'Start new project flow' })
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