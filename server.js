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

console.log('=== SERVER STARTING ===');
console.log('GROQ_API_KEY from env:', process.env.GROQ_API_KEY ? 'KEY IS SET (length: ' + process.env.GROQ_API_KEY.length + ')' : 'KEY IS MISSING!');
console.log('OPENAI_API_KEY from env:', process.env.OPENAI_API_KEY ? 'SET' : 'MISSING');
console.log('========================');

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse-new')

dotenv.config()

console.log('GROQ_API_KEY loaded:', process.env.GROQ_API_KEY ? 'YES (length: ' + process.env.GROQ_API_KEY.length + ')' : 'NO - KEY MISSING!');


// ─── OPENAI HELPER ────────────────────────────────────────────────────────────
async function callOpenAI(system, user, maxTokens = 1500) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.7,
      max_tokens: maxTokens
    })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'OpenAI error')
  return data.choices[0].message.content
}

function serverSafeParseJSON(raw, fallback = null) {
  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch { return fallback }
}

const app = express()
const upload = multer({ dest: 'uploads/' })
const memoryUpload = multer({ storage: multer.memoryStorage() })

import { v2 as cloudinary } from 'cloudinary'
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

app.use(express.json());

app.set('trust proxy', 1)

app.use(cors({
 origin: 'https://getgradely.xyz',
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
class MicroHumanizer {
  constructor() {
    this.wordSwaps = {
      'crucial': 'key',
      'furthermore': 'also',
      'moreover': 'plus',
      'nevertheless': 'but',
      'consequently': 'so',
      'accordingly': 'thus',
      'delve': 'explore',
      'robust': 'solid',
      'leverage': 'use',
      'facilitate': 'help',
      'utilize': 'use',
      'pivotal': 'major',
      'underscore': 'show',
      'notably': 'especially',
      'tapestry': 'mix',
      'paradigm': 'model',
      'synergy': 'teamwork',
      'in addition': 'also',
      'on the other hand': 'but',
      'as a result': 'so',
      'however': 'but',
      'therefore': 'so'
    };
    this.pivots = [
      'Look, ',
      'The reality is, ',
      'Basically, ',
      'In practice, ',
      'Here\'s the thing: ',
      'Simply put, ',
      'What this means is '
    ];
  }
  
  humanize(text, alterationPercentage = 0.15) {
    if (!text || typeof text !== 'string') return text;
    let result = text;
    for (const [ai, human] of Object.entries(this.wordSwaps)) {
      const regex = new RegExp(`\\b${ai}\\b`, 'gi');
      result = result.replace(regex, (match) => {
        const isCapitalized = match[0] === match[0].toUpperCase();
        return isCapitalized ? human[0].toUpperCase() + human.slice(1) : human;
      });
    }
    const sentences = result.split(/(?<=[.!?])\s+/);
    const processed = [];
    for (const sentence of sentences) {
      const wordCount = sentence.split(/\s+/).length;
      if (wordCount > 18 && Math.random() < alterationPercentage) {
        const words = sentence.split(/\s+/);
        const splitPoint = Math.floor(wordCount * 0.6);
        const firstPart = words.slice(0, splitPoint).join(' ');
        const secondPart = words.slice(splitPoint).join(' ');
        processed.push(`${firstPart} — ${secondPart.toLowerCase()}`);
      } else {
        processed.push(sentence);
      }
    }
    result = processed.join(' ');
    const sentencesWithPivots = result.split(/(?<=[.!?])\s+/);
    const numToAlter = Math.floor(sentencesWithPivots.length * alterationPercentage);
    const indicesToAlter = this._getRandomIndices(sentencesWithPivots.length, numToAlter);
    for (const idx of indicesToAlter) {
      const pivot = this.pivots[Math.floor(Math.random() * this.pivots.length)];
      const sentence = sentencesWithPivots[idx];
      sentencesWithPivots[idx] = pivot + sentence.charAt(0).toLowerCase() + sentence.slice(1);
    }
    result = sentencesWithPivots.join(' ');
    result = result.replace(/\s+/g, ' ');
    result = result.replace(/\s+([,.!?])/g, '$1');
    result = result.replace(/\s+—/g, ' —');
    result = result.trim();
    return result;
  }
  
  _getRandomIndices(max, count) {
    const indices = [];
    while (indices.length < count && indices.length < max) {
      const idx = Math.floor(Math.random() * max);
      if (!indices.includes(idx)) indices.push(idx);
    }
    return indices;
  }
}

const humanizer = new MicroHumanizer();

// ─── HELPER: Translation roundabout ──────────────────────────────────────────
function translationRoundabout(text) {
  let result = text;
  const patterns = [
    [/\b(in order to)\b/gi, 'to'],
    [/\b(due to the fact that)\b/gi, 'because'],
    [/\b(with the exception of)\b/gi, 'except'],
    [/\b(for the purpose of)\b/gi, 'to'],
    [/\b(it is important to note that)\b/gi, 'note that'],
    [/\bat this point in time\b/gi, 'now'],
    [/\bin the event that\b/gi, 'if'],
    [/\b(as a matter of fact)\b/gi, 'in fact'],
    [/\bas a result of\b/gi, 'because of']
  ];
  for (const [pattern, replacement] of patterns) {
    result = result.replace(pattern, replacement);
  }
  const sentences = result.split(/(?<=[.!?])\s+/);
  const processed = sentences.map(sent => {
    if (Math.random() < 0.1 && sent.includes(' is ') && sent.includes(' because ')) {
      return sent.replace(/(\w+) is (\w+) because/, 'Because $2, $1 is');
    }
    return sent;
  });
  return processed.join(' ');
}

function enhanceBurstiness(text) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const processed = [];
  for (let i = 0; i < sentences.length; i++) {
    let sent = sentences[i];
    const wordCount = sent.split(/\s+/).length;
    if (wordCount > 18 && Math.random() < 0.3) {
      const words = sent.split(/\s+/);
      const split = Math.floor(wordCount * 0.6);
      const first = words.slice(0, split).join(' ');
      const second = words.slice(split).join(' ');
      processed.push(`${first}. ${second.charAt(0).toLowerCase() + second.slice(1)}`);
    } else if (wordCount < 5 && processed.length > 0 && Math.random() < 0.4) {
      processed[processed.length - 1] += ` ${sent.toLowerCase()}`;
    } else {
      processed.push(sent);
    }
  }
  return processed.join(' ');
}

async function runHumanizationPipeline(text) {
  let result = text;
  result = humanizer.humanize(result, 0.25);
  result = translationRoundabout(result);
  result = enhanceBurstiness(result);
  result = result.replace(/\s+/g, ' ').trim();
  result = result.replace(/\s+([,.!?])/g, '$1');
  return result;
}

app.post('/api/bert-humanize', requireAuth, async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ success: false, error: 'Text is required' });
  }
  try {
    const response = await fetch('https://uncled33-bert-humanizer.hf.space/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await response.json();
    const outputText = (response.ok && data.text && typeof data.text === 'string') ? data.text : text;
    const humanizedText = await runHumanizationPipeline(outputText);
    res.json({ success: true, text: humanizedText });
  } catch (error) {
    console.error('BERT humanizer error:', error);
    const humanizedText = await runHumanizationPipeline(text);
    res.json({ success: true, text: humanizedText });
  }
});

async function updateUserWordUsage(userId, words) {
  const now = new Date().toISOString();
  const user = await db.execute({
    sql: 'SELECT words_used_this_month, last_reset_date FROM users WHERE id = ?',
    args: [userId]
  });
  if (!user.rows.length) return;
  let used = user.rows[0].words_used_this_month;
  let lastReset = user.rows[0].last_reset_date;
  const currentMonth = now.slice(0,7);
  if (!lastReset || lastReset.slice(0,7) !== currentMonth) {
    used = 0;
    await db.execute({
      sql: 'UPDATE users SET words_used_this_month = 0, last_reset_date = ? WHERE id = ?',
      args: [now, userId]
    });
  }
  const newUsed = used + words;
  await db.execute({
    sql: 'UPDATE users SET words_used_this_month = ? WHERE id = ?',
    args: [newUsed, userId]
  });
}

app.post('/api/humanize', requireAuth, async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ success: false, error: 'Text is required' });
  }

  try {
    // --- NEW: THE GATEKEEPER ---
    // Check if the user has enough credits
    const userRes = await db.execute({
      sql: 'SELECT humanization_credits FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const credits = userRes.rows[0]?.humanization_credits || 0;
    const wordCount = text.split(/\s+/).length;

    if (credits < wordCount) {
      return res.status(403).json({ success: false, error: 'Insufficient credits. Please top up your plan.' });
    }
    // ---------------------------

    const response = await fetch('https://api.writehuman.ai/v1/humanize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WRITEHUMAN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, intensity: 'standard' })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'WriteHuman API error');

    // Update usage only after a successful humanization
    await updateUserWordUsage(req.user.id, wordCount);
    
    // Optional: Also decrement the humanization_credits from the database here
    await db.execute({
      sql: 'UPDATE users SET humanization_credits = humanization_credits - ? WHERE id = ?',
      args: [wordCount, req.user.id]
    });

    res.json({ success: true, text: data.humanizedText });
  } catch (error) {
    console.error('WriteHuman error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});



// Add this to your server.js
app.post('/api/payments/webhook', async (req, res) => {
    // These are the variables that were causing the warning
    const { transactionReference, status, amount, customerEmail, metaData } = req.body;

    if (status === 'SUCCESSFUL') {
        const userId = metaData.userId;
        let creditsToAdd = 0;

        // Logic: Allocate fair share of credits
        if (amount >= 15000) creditsToAdd = 20000; // Premium Plan
        else if (amount >= 10000) creditsToAdd = 10000; // Standard Plan

        // 1. Update the User's Wallet
        await db.execute({
            sql: 'UPDATE users SET humanization_credits = humanization_credits + ? WHERE id = ?',
            args: [creditsToAdd, userId]
        });

        // 2. Log the payment (Using the variables that were "unused")
        // This clears your ESLint errors because you are now using them!
        await db.execute({
            sql: 'INSERT INTO payments (reference, email, user_id, amount, status) VALUES (?, ?, ?, ?, ?)',
            args: [transactionReference, customerEmail, userId, amount, 'success']
        });

        console.log(`Successfully credited user ${userId} with ${creditsToAdd} tokens.`);
    }
    
    res.status(200).send('Webhook Received');
});

// ─── PAYSTACK PAYMENT VERIFICATION ────────────────────────────────────────────
app.post('/api/payments/paystack/verify', requireAuth, async (req, res) => {
  const { reference, projectId } = req.body
  if (!reference) return res.status(400).json({ error: 'Payment reference is required' })

  try {
    // Verify with Paystack API
    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY is not set in environment variables')
      return res.status(500).json({ error: 'Payment service not configured. Please contact support.' })
    }
    console.log('Verifying Paystack reference:', reference)
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const verifyData = await verifyRes.json()

    if (!verifyData.status || verifyData.data?.status !== 'success') {
      console.error('Paystack verification failed:', verifyData)
      return res.status(400).json({ error: 'Payment could not be verified. Please contact support.' })
    }

    const amountPaid = verifyData.data.amount / 100 // kobo → naira
    const customerEmail = verifyData.data.customer?.email
    console.log(`✅ Paystack payment verified: ₦${amountPaid} from ${customerEmail} ref: ${reference}`)

    // Mark project as paid
    if (projectId) {
      await db.execute({
        sql: 'UPDATE projects SET is_paid = 1, updated_at = datetime("now") WHERE id = ? AND user_id = ?',
        args: [projectId, req.user.id]
      })
    }

    // Log the transaction
    try {
      await db.execute({
        sql: `INSERT INTO transaction_logs 
              (user_id, project_id, amount, reference, provider, status, created_at) 
              VALUES (?, ?, ?, ?, 'paystack', 'success', CURRENT_TIMESTAMP)`,
        args: [req.user.id, projectId || null, amountPaid, reference]
      })
    } catch (logErr) {
      // Don't fail the whole request if logging fails
      console.error('Transaction log failed:', logErr.message)
    }

    res.json({
      success: true,
      amount: amountPaid,
      plan: amountPaid >= 15000 ? 'PREMIUM' : 'STANDARD',
      message: 'Payment verified successfully'
    })

  } catch (err) {
    console.error('Paystack verify error:', err)
    res.status(500).json({ error: 'Verification failed. Please try again or contact support.' })
  }
})


// ─── DEFENSE PREP ─────────────────────────────────────────────────────────────

app.post('/api/projects/:id/defense-prep', requireAuth, async (req, res) => {
  try {
    const project = await db.execute({
      sql: 'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id]
    })

    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const proj = project.rows[0]
    const chapters = JSON.parse(proj.chapters || '[]')
    const allText = chapters.map(c => c.content || '').join('\n\n')

    // Call Claude to generate defense prep
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: `You are a Nigerian university project defense coach. Generate realistic panel questions and model answers. Return only valid JSON.`,
        messages: [{
          role: 'user',
          content: `Generate defense preparation for this project:

Title: ${proj.title}
Department: ${proj.department}

Project content:
${allText.substring(0, 4000)}

Return ONLY this JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "Panel question here?",
      "answer": "Model answer here",
      "difficulty": "easy|medium|hard",
      "category": "methodology|findings|theory|practical"
    }
  ],
  "overallTips": ["tip 1", "tip 2", "tip 3"]
}`
        }]
      })
    })

    const data = await response.json()
    const text = data.content[0].text
    const cleaned = text.replace(/```json|```/g, '').trim()
    const defensePrep = JSON.parse(cleaned)

    // Save to project
    await db.execute({
      sql: 'UPDATE projects SET defense_prep = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [JSON.stringify(defensePrep), req.params.id]
    })

    res.json({ defensePrep })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── RAG ──────────────────────────────────────────────────────────────────────
async function getRelevantGuideContent(university, department, sectionTitle) {
  let guide = await db.execute({
    sql: `SELECT structure, writing_expectations FROM guides 
          WHERE university = ? AND department = ? 
          ORDER BY year DESC LIMIT 1`,
    args: [university, department]
  });
  if (!guide.rows.length) {
    guide = await db.execute({
      sql: `SELECT structure, writing_expectations FROM guides 
            WHERE department = ? 
            ORDER BY year DESC LIMIT 1`,
      args: [department]
    });
  }
  if (!guide.rows.length && department) {
    const deptKeywords = department.split(' ');
    for (const keyword of deptKeywords) {
      const result = await db.execute({
        sql: `SELECT structure, writing_expectations FROM guides 
              WHERE department LIKE ? 
              ORDER BY year DESC LIMIT 1`,
        args: [`%${keyword}%`]
      });
      if (result.rows.length) {
        guide = result;
        break;
      }
    }
  }
  if (guide.rows.length) {
    const { structure, writing_expectations } = guide.rows[0];
    const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sectionPattern = new RegExp(
      `(?:(?:\\d+\\.\\d+)\\s*${escapedTitle}[\\s\\S]*?(?=\\n\\d+\\.\\d+|$))`,
      'i'
    );
    const match = structure.match(sectionPattern);
    const relevantPart = match ? match[0] : structure.substring(0, 1000);
    return { structure: relevantPart, expectations: writing_expectations };
  }
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports.getRelevantGuideContent = getRelevantGuideContent;
}



// ─── GALLERY ──────────────────────────────────────────────────────────────────
app.post('/api/projects/:id/publish', requireAuth, async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;
  try {
    const project = await db.execute({
      sql: `SELECT title, abstract, department, university, project_info, chapters 
            FROM projects WHERE id = ? AND user_id = ?`,
      args: [projectId, userId]
    });
    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const p = project.rows[0];
    let projectInfo = {};
    let chapters = [];
    try {
      projectInfo = p.project_info ? JSON.parse(p.project_info) : {};
    } catch (error) {
      console.warn('Failed to parse project_info:', error);
    }
    try {
      chapters = p.chapters ? JSON.parse(p.chapters) : [];
    } catch (error) {
      console.warn('Failed to parse chapters:', error);
    }
    const fullContent = chapters.map(ch => ch.content || '').join('\n\n');
    const title = p.title ? String(p.title) : '';
    const abstract = p.abstract ? String(p.abstract) : '';
    const department = p.department ? String(p.department) : '';
    const university = p.university ? String(p.university) : '';
    const supervisorName = projectInfo.supervisorName ? String(projectInfo.supervisorName) : '';
    const projectTopic = projectInfo.topic ? String(projectInfo.topic) : '';
    await db.execute({
      sql: `INSERT INTO published_projects 
            (user_id, project_id, title, abstract, department, university, supervisor_name, project_topic, full_content)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        userId, projectId, title, abstract, department, university,
        supervisorName, projectTopic, fullContent
      ]
    });
    res.json({ success: true, message: 'Project published to gallery' });
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gallery', async (req, res) => {
  const { department, university, topic, page = 1, limit = 12 } = req.query;
  let sql = `
    SELECT p.id, p.title, p.abstract, p.department, p.university, 
           p.supervisor_name, p.project_topic, p.published_at,
           u.name as publisher_name
    FROM published_projects p
    JOIN users u ON p.user_id = u.id
    WHERE 1=1
  `;
  const args = [];
  if (department && department !== 'all') { sql += ` AND p.department = ?`; args.push(department); }
  if (university && university !== 'all') { sql += ` AND p.university = ?`; args.push(university); }
  if (topic) { sql += ` AND (p.title LIKE ? OR p.project_topic LIKE ?)`; args.push(`%${topic}%`, `%${topic}%`); }
  sql += ` ORDER BY p.published_at DESC LIMIT ? OFFSET ?`;
  args.push(Number(limit), (Number(page)-1)*Number(limit));
  const rows = await db.execute({ sql, args });
  const deptRes = await db.execute(`SELECT DISTINCT department FROM published_projects WHERE department IS NOT NULL AND department != ''`);
  const univRes = await db.execute(`SELECT DISTINCT university FROM published_projects WHERE university IS NOT NULL AND university != ''`);
  res.json({ 
    projects: rows.rows,
    departments: deptRes.rows.map(r => r.department),
    universities: univRes.rows.map(r => r.university)
  });
});


// ─── GITHUB REPO CONTEXT (for Chapters 3-5) ──────────────────────────────────
async function fetchGithubContext(githubLink) {
  if (!githubLink) return '';
  try {
    const match = githubLink.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
    if (!match) return '';
    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');

    const headers = { 'User-Agent': 'GradelyAI', Accept: 'application/vnd.github.v3+json' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;

    let readmeText = '';
    try {
      const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
      if (readmeRes.ok) {
        const readmeData = await readmeRes.json();
        readmeText = Buffer.from(readmeData.content, 'base64').toString('utf-8').slice(0, 2000);
      }
    } catch { /* ignore readme fetch errors */ }

    let fileList = '';
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      const repoData = await repoRes.json();
      const defaultBranch = repoData.default_branch || 'main';
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers });
      if (treeRes.ok) {
        const treeData = await treeRes.json();
        fileList = (treeData.tree || [])
          .filter(f => f.type === 'blob')
          .map(f => f.path)
          .slice(0, 60)
          .join('\n');
      }
    } catch { /* ignore file list fetch errors */ }

    if (!readmeText && !fileList) return '';

    return `\n\nSTUDENT'S ACTUAL CODE REPOSITORY (use this to write accurate, specific content):\nRepo: ${owner}/${repo}\n\nREADME:\n${readmeText}\n\nKEY FILES:\n${fileList}\n`;
  } catch (err) {
    console.error('GitHub context fetch failed:', err);
    return '';
  }
}

app.post('/api/socratic-generate', requireAuth, async (req, res) => {
  console.log('🔥 SOCRATIC GENERATE CALLED');

const { messages, projectInfo, chapterStructure, requestType, currentChapterNumber, currentSectionTitle } = req.body;
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  let studentTopicSentence = lastUserMessage?.content || '';

  // ─── RAG: retrieve guide content (must be before autonomous check) ──────────
  let guideContext = '';
  try {
    const currentSection = { title: currentSectionTitle || chapterStructure?.currentSection?.title || 'Introduction' }
    const guideData = await getRelevantGuideContent(
      projectInfo?.university || '',
      projectInfo?.department || '',
      currentSection.title
    );
    if (guideData) {
      guideContext = `\n\nIMPORTANT - Follow this exact departmental guide structure for this section:\n${guideData.structure}\n\n`;
      if (guideData.expectations) guideContext += `Writing expectations: ${guideData.expectations}\n`;
    }
  } catch (err) { console.error('RAG fetch error:', err); }

  // ─── GitHub repo context for Chapters 3, 4, 5 ────────────────────────────
  if ([3, 4, 5].includes(Number(currentChapterNumber)) && projectInfo?.githubLink) {
    const repoContext = await fetchGithubContext(projectInfo.githubLink);
    guideContext += repoContext;
  }

  // ── Detect if student is asking Grad to generate autonomously
  const autonomousPatterns = [
  /generate.*(?:on your own|yourself|for me|it yourself)/i,
  /(?:can you|please|just)\s+(?:write|generate|create|do|make)\s+(?:it|this|the|a)/i,
  /write.*(?:for me|yourself|on your own)/i,
  /do it (for me|yourself)/i,
  /(?:definition of terms|definitions)\s*(?:on your own|yourself|for me)?/i,
  /you can generate/i,
  /generate the/i,
  /figure.*(?:this|it).*out\s*(?:yourself|on your own)?/i,
  /do this (on your own|yourself|for me)/i,
  /(?:i don't know|i dont know)\s+(?:what to do|how to)/i,
  /(?:just|please)?\s*do\s+(?:it|this)\s*(?:for me|please|yourself)?/i,
  /(?:write|generate|create)\s+(?:it|this|the section|the definitions?|the terms?)\s*(?:for me|yourself|on your own|please)?/i,
]
  const isAutonomousRequest = autonomousPatterns.some(p => p.test(studentTopicSentence))

  if (isAutonomousRequest && requestType !== 'stuck') {
    const currentSection = { title: currentSectionTitle || chapterStructure?.currentSection?.title || 'this section' }
    const autoSystemPrompt = `You are Grad, an AI writing assistant helping a Nigerian university student complete their final year project. The student has asked you to generate content for a section autonomously. Write complete, academically appropriate content for the section based on the project details provided. Use simple, clear language. Never use: crucial, furthermore, moreover, delve, robust, leverage, utilize.${guideContext}`
    const autoUserPrompt = `Project Title: "${projectInfo?.topic || ''}"
Department: ${projectInfo?.department || ''}
University: ${projectInfo?.university || ''}
Section to write: ${currentSection.title}

Write complete content for this section. Be specific to the project topic.`

    try {
      const completion = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: autoSystemPrompt },
            { role: 'user', content: autoUserPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      })
      const data = await completion.json()
      if (!completion.ok) throw new Error(data.error?.message || 'OpenAI error')
      const autoContent = data.choices[0].message.content.trim()
let finalResponse = `[SECTION_DRAFT]${autoContent}[/SECTION_DRAFT]`
return res.json({ success: true, message: finalResponse })
    } catch (error) {
      console.error('Autonomous generation error:', error)
      return res.status(500).json({ success: false, error: error.message })
    }
  }

    // ─── STUCK MODE: give a worked example, student must rephrase ─────────────
  if (requestType === 'stuck') {
    const currentSection = chapterStructure?.currentSection || { title: 'this section' };
    const stuckSystemPrompt = `You are a Nigerian university project supervisor helping a student who is stuck writing their final year project.
The student is currently working on the "${currentSection.title}" section.
Write ONE short, specific example sentence that directly addresses what this section requires — not a general academic sentence.
The sentence must be clearly about "${currentSection.title}" and relate to the student's project topic.
Keep it generic enough that the student still has to rewrite it in their own words.
Do NOT write a full paragraph. Just one model sentence.${guideContext}`;
    const stuckUserPrompt = `Project Title: "${projectInfo?.topic || ''}"
Department: ${projectInfo?.department || ''}
Section: ${currentSection.title}

Write ONE example sentence showing how a student could start answering this section's guiding question.`;

    try {
      const completion = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: stuckSystemPrompt },
            { role: "user", content: stuckUserPrompt }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });
      const data = await completion.json();
      if (!completion.ok) throw new Error(data.error?.message || 'OpenAI error');
      const exampleText = data.choices[0].message.content.trim();
      const wrapped = `[STUCK_EXAMPLE]${exampleText}[/STUCK_EXAMPLE]`;
      return res.json({ success: true, message: wrapped });
    } catch (error) {
      console.error('Stuck-mode error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // ─── OpenAI call (normal draft mode) ───────────────────────────────────────
 const isLaterChapter = [3, 4, 5].includes(Number(currentChapterNumber))
  const githubInstruction = isLaterChapter && projectInfo?.githubLink
    ? `\n\nIMPORTANT: The student's actual project repository is provided above in the guide context. Write technically specific paragraphs that reference the real technologies, file structure, and implementation details from that repository. Do not write generic content.`
    : ''
  const systemPrompt = `You write 2-3 supporting paragraphs for a student's topic sentence. Do NOT repeat the topic sentence. Use simple language. Never use: crucial, furthermore, moreover, delve, robust, leverage, utilize.${githubInstruction}${guideContext}`;

  try {
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Student's topic sentence: "${studentTopicSentence}"\n\nWrite 2-3 supporting paragraphs.` }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await completion.json();
    if (!completion.ok) throw new Error(data.error?.message || 'OpenAI error');
    const rawSupportingText = data.choices[0].message.content;

  let finalResponse = `${studentTopicSentence}\n\n${rawSupportingText}`;

    finalResponse = finalResponse
      .replace(/\*\*Yes,\s*looks\s*good\*\*\s*\|/gi, '')
      .replace(/\*\*No,\s*let\s*me\s*edit\*\*\s*\|/gi, '')
      .replace(/\*\*Regenerate\*\*/gi, '')
      .replace(/\|/g, '')
      .replace(/Yes,\s*looks\s*good\./gi, '')
      .replace(/No,\s*let\s*me\s*edit\./gi, '')
      .replace(/Regenerate\./gi, '')
      .trim();

    finalResponse = `[SECTION_DRAFT]${finalResponse}[/SECTION_DRAFT]`;

    console.log('3. Sending final response (no humanization)');
    res.json({ success: true, message: finalResponse });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── FULL PROJECT GENERATION (SSE) ───────────────────────────────────────────
app.post('/api/generate-full-project', requireAuth, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const { projectInfo } = req.body
    if (!projectInfo?.topic) {
      send('error', { message: 'Project topic is required' })
      return res.end()
    }

    // ── Step 1: Fetch real papers ──────────────────────────────────────────────
    send('status', { message: 'Finding real academic papers on your topic...', progress: 5 })
   let realPapers = []
      try {
        const sleep = (ms) => new Promise(r => setTimeout(r, ms))
        const queries = [
          projectInfo.topic.split(' ').slice(0, 4).join(' '),
          `${projectInfo.department} ${projectInfo.topic.split(' ').slice(0, 3).join(' ')}`,
          projectInfo.topic
        ]
        for (const q of queries) {
          try {
            await sleep(1100) // Semantic Scholar rate limit: 1 req/sec without API key
            const paperRes = await fetch(
              `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(q)}&limit=10&fields=title,authors,year,journal,externalIds,publicationVenue,openAccessPdf`,
              { headers: { 'User-Agent': 'GradelyAI/1.0 (academic research tool)' } }
            )
            console.log(`Semantic Scholar query "${q}": status ${paperRes.status}`)
            if (paperRes.status === 429) {
              console.log('Rate limited — waiting 3 seconds before retry')
              await sleep(3000)
              continue
            }
            if (!paperRes.ok) {
              console.log(`Semantic Scholar returned ${paperRes.status} for query: ${q}`)
              continue
            }
            const paperData = await paperRes.json()
            if (paperData.data?.length > 0) {
              realPapers = paperData.data
              console.log(`Found ${realPapers.length} papers for query: "${q}"`)
              break
            } else {
              console.log(`No papers found for query: "${q}", trying next`)
            }
          } catch (queryErr) {
            console.error(`Query failed for "${q}":`, queryErr.message)
          }
        }
        if (realPapers.length === 0) {
          console.log('All Semantic Scholar queries returned no results — generation will proceed without real papers')
        }
      } catch (err) {
        console.error('Paper fetch block failed:', err.message)
      }
      send('status', {
        message: realPapers.length > 0
          ? `Found ${realPapers.length} real academic papers. Reading them...`
          : 'Proceeding without external papers — Grad will generate from academic knowledge.',
        progress: 15
      })
    send('status', { message: `Found ${realPapers.length} real papers. Reading them...`, progress: 15 })

    // ── Step 2: Get guide from RAG ─────────────────────────────────────────────
    send('status', { message: 'Studying your department guide...', progress: 20 })
    let guideContext = ''
    try {
      const guideData = await getRelevantGuideContent(
        projectInfo.university || '',
        projectInfo.department || '',
        'Introduction'
      )
      if (guideData?.structure) {
        guideContext = `\n\nFOLLOW THIS DEPARTMENT GUIDE STRUCTURE EXACTLY:\n${guideData.structure}\n`
        if (guideData.expectations) guideContext += `Writing expectations: ${guideData.expectations}\n`
      }
    } catch (err) {
      console.error('Guide fetch failed:', err.message)
    }

    // ── Step 3: Generate project structure ────────────────────────────────────
    send('status', { message: 'Planning your chapter structure...', progress: 25 })
    const structureSystem = `You are a Nigerian university academic expert. Generate final year project chapter structures. Always respond with valid JSON only. No markdown. No preamble.${guideContext}`
    const structureUser = `Create a chapter structure for:
- University: ${projectInfo.university}
- Department: ${projectInfo.department}
- Topic: ${projectInfo.topic}
- Project Type: ${projectInfo.projectType || 'software'}

Return ONLY this JSON:
{
  "chapters": [
    {
      "number": 1,
      "title": "INTRODUCTION",
      "subsections": [
        { "number": "1.1", "title": "Background to the Study" },
        { "number": "1.2", "title": "Statement of the Problem" },
        { "number": "1.3", "title": "Aim and Objectives of the Study" },
        { "number": "1.4", "title": "Significance of the Study" },
        { "number": "1.5", "title": "Scope of the Study" },
        { "number": "1.6", "title": "Limitations of the Study" },
        { "number": "1.7", "title": "Definition of Terms" }
      ]
    }
  ],
  "referenceStyle": "APA",
  "estimatedPages": 80
}`

    const structureRaw = await callOpenAI(structureSystem, structureUser, 2000)
    const structure = serverSafeParseJSON(structureRaw, {
      chapters: [
        { number: 1, title: 'INTRODUCTION', subsections: [
          { number: '1.1', title: 'Background to the Study' },
          { number: '1.2', title: 'Statement of the Problem' },
          { number: '1.3', title: 'Aim and Objectives of the Study' },
          { number: '1.4', title: 'Significance of the Study' },
          { number: '1.5', title: 'Scope of the Study' },
          { number: '1.6', title: 'Limitations of the Study' },
          { number: '1.7', title: 'Definition of Terms' }
        ]},
        { number: 2, title: 'LITERATURE REVIEW', subsections: [] },
        { number: 3, title: 'SYSTEM ANALYSIS AND DESIGN', subsections: [] },
        { number: 4, title: 'SYSTEM IMPLEMENTATION', subsections: [] },
        { number: 5, title: 'SUMMARY, CONCLUSION AND RECOMMENDATIONS', subsections: [] }
      ],
      referenceStyle: 'APA',
      estimatedPages: 80
    })

    // ── Step 4: Build paper context — abstracts only for AI, metadata for citations
      // The AI gets abstracts to understand content. Real citation text is built separately.
      const paperLookup = {} // key: "[1]" → real paper object
      const paperContext = realPapers.slice(0, 8).map((p, i) => {
        const ref = `[${i + 1}]`
        paperLookup[ref] = p
        const authors = p.authors?.slice(0, 3).map(a => a.name).join(', ') || 'Unknown Author'
        const year = p.year || 'n.d.'
        const journal = p.journal?.name || p.publicationVenue?.name || ''
        // Give AI: number, title, year, journal, and a note to use as citation
        // Do NOT give AI authors in citation format — it will hallucinate initials and page numbers
        return `${ref} Title: "${p.title}" | Year: ${year} | Published in: ${journal || 'academic journal'} | Authors: ${authors}

Use ${ref} as the in-text citation marker wherever this paper's findings are relevant.`
      }).join('\n\n')

    // ── Step 5: Generate each chapter ─────────────────────────────────────────
    const generatedChapters = []
    const totalChapters = structure.chapters.length

    for (const chapter of structure.chapters) {
      const progressBase = 25 + ((chapter.number / totalChapters) * 55)
      send('status', { message: `Writing Chapter ${chapter.number}: ${chapter.title}...`, progress: Math.round(progressBase) })

      const subsectionList = chapter.subsections?.map(s =>
        `${s.number} ${typeof s === 'string' ? s : s.title}`
      ).join('\n') || ''

      const isImplementation = chapter.number >= 3 && projectInfo.projectType !== 'research'
      const githubContext = isImplementation && projectInfo.githubLink
        ? `\n\nStudent's GitHub repository: ${projectInfo.githubLink}. Reference the real technologies and implementation details.`
        : ''

   const chapterSystem = `You are an academic writer producing a Nigerian university final year project chapter.

FORMATTING RULES — CRITICAL — DO NOT IGNORE:
- Write in plain paragraphs ONLY — no markdown whatsoever
- Do NOT use # ## ### or any heading markers — section titles are already displayed separately
- Do NOT use ** for bold or * for italic
- Do NOT use bullet points (-, *, +) or numbered lists unless the content absolutely requires enumeration
- Do NOT repeat the chapter title or section title at the start — start directly with content
- Separate paragraphs with a single blank line
- Each subsection should flow naturally into the next without any headers

CITATION RULES — FOLLOW EXACTLY:
- When you reference a paper's findings, write the citation as (Author, Year) immediately after the claim
- Only use author names and years from the paper list provided — do not invent any details
- Never invent paper titles, journals, volume numbers, or page numbers
- If no paper supports a claim, write it without a citation

WRITING RULES:
- Write formal academic English appropriate for Nigerian universities
- Be specific to "${projectInfo.topic}" throughout — never write generic academic filler
- Minimum 3 full paragraphs per subsection
- Never use: crucial, furthermore, moreover, delve, robust, leverage, utilize, it is worth noting
- Do not use placeholder text like "[to be completed]" — write actual content${githubContext}`


      const chapterUser = `Write Chapter ${chapter.number}: ${chapter.title} for this project:

Project Title: "${projectInfo.topic}"
Student University: ${projectInfo.university}
Department: ${projectInfo.department}
Project Type: ${projectInfo.projectType || 'software'}

${subsectionList ? `Required subsections:\n${subsectionList}\n` : ''}
${paperContext ? `\nREAL ACADEMIC PAPERS — use these as sources for your claims. Use the [number] markers as in-text citations:\n\n${paperContext}\n\nIMPORTANT: Only cite using the markers above. Never invent citations not in this list.\n` : 'No external papers available — write from established academic knowledge without citations.\n'}
${projectInfo.supervisorNotes ? `\nSupervisor notes: ${projectInfo.supervisorNotes}\n` : ''}

Write each subsection in full. Use in-text citations from the papers provided above in APA format (Author, Year). Minimum 3 paragraphs per subsection. Be specific to "${projectInfo.topic}" throughout. Do not use placeholders or say "to be completed".`

      let chapterContent = ''
      try {
        chapterContent = await callOpenAI(chapterSystem, chapterUser, 3000)
        // Clean up any leaked formatting
        chapterContent = chapterContent
          .replace(/```[a-z]*/gi, '')
          .replace(/```/g, '')
          .trim()
      } catch (err) {
        console.error(`Chapter ${chapter.number} generation failed:`, err.message)
        chapterContent = `Chapter ${chapter.number}: ${chapter.title}\n\nContent generation failed. Please regenerate this chapter.`
      }

      generatedChapters.push({
        number: chapter.number,
        title: chapter.title,
        subsections: chapter.subsections || [],
        content: chapterContent
      })
    }

    // ── Step 6: Generate references deterministically ─────────────────────────
    send('status', { message: 'Formatting your real references...', progress: 82 })
    const references = realPapers.map((p, i) => {
      const authors = p.authors?.length
        ? p.authors.map(a => {
            const parts = (a.name || '').trim().split(' ')
            if (parts.length === 1) return parts[0]
            const last = parts[parts.length - 1]
            const initials = parts.slice(0, -1).map(n => (n[0] || '') + '.').join(' ')
            return `${last}, ${initials}`
          }).join(', ').replace(/, ([^,]+)$/, ', & $1')
        : 'Unknown Author'
      const year = p.year || 'n.d.'
      const title = p.title || 'Untitled'
      const journal = p.journal?.name || p.publicationVenue?.name || ''
      const doi = p.externalIds?.DOI || ''
      const url = p.openAccessPdf?.url || (doi ? `https://doi.org/${doi}` : '')
      let citation = `${authors} (${year}). ${title}.`
      if (journal) citation += ` ${journal}.`
      if (doi) citation += ` https://doi.org/${doi}`
      else if (url) citation += ` ${url}`
      return { id: i + 1, citation: citation.trim(), url: url || '' }
    })

    // ── Step 7: Save to DB ────────────────────────────────────────────────────
    send('status', { message: 'Saving your project...', progress: 90 })
    const dbResult = await db.execute({
      sql: `INSERT INTO projects 
        (user_id, title, university, department, project_type, status, is_paid, chapters, abstract, refs, structure, project_info, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [
        req.user.id,
        projectInfo.topic || 'Untitled Project',
        projectInfo.university || '',
        projectInfo.department || '',
        projectInfo.projectType || 'software',
        'in_progress',
        0,
        JSON.stringify(generatedChapters),
        '',
        JSON.stringify(references),
        JSON.stringify(structure),
        JSON.stringify(projectInfo)
      ]
    })

    const projectId = Number(dbResult.lastInsertRowid)

    send('status', { message: 'Your project is ready!', progress: 100 })
    send('done', {
      projectId,
      chapters: generatedChapters,
      references,
      structure,
      projectInfo
    })
    res.end()

  } catch (err) {
    console.error('Generation error:', err)
    send('error', { message: err.message || 'Generation failed. Please try again.' })
    res.end()
  }
})

// ─── UNDERSTAND SECTION ───────────────────────────────────────────────────────
app.post('/api/understand-section', requireAuth, async (req, res) => {
  const { sectionTitle, sectionContent, studentAnswer, githubLink, photoUrls } = req.body
  if (!sectionTitle || !sectionContent) {
    return res.status(400).json({ error: 'sectionTitle and sectionContent are required' })
  }

  try {
    const system = `You are Grad, a warm and direct academic mentor helping a Nigerian university student understand their own final year project. Be concise and specific. Never be generic. Always refer to the actual content of the section provided.`

   const hasStudentInput = (studentAnswer && studentAnswer.trim().length > 5) ||
      (githubLink && githubLink.trim().length > 5) ||
      (photoUrls && photoUrls.length > 0)

    if (hasStudentInput) {
      // Fetch GitHub context if link provided
      let githubContext = ''
      if (githubLink && githubLink.trim()) {
        try {
          githubContext = await fetchGithubContext(githubLink.trim())
        } catch (err) {
          console.error('GitHub fetch in understand section:', err.message)
        }
      }

      // Build photo context string
      const photoContext = photoUrls && photoUrls.length > 0
        ? `\nStudent has uploaded ${photoUrls.length} photo(s) of their project: ${photoUrls.join(', ')}\nDescribe what these photos show and incorporate visual details into the section.`
        : ''

      const user = `Section: "${sectionTitle}"
Original section content: ${sectionContent.slice(0, 1000)}
${studentAnswer ? `Student's description: "${studentAnswer}"` : ''}
${githubContext ? `\nStudent's GitHub repository context:\n${githubContext.slice(0, 800)}` : ''}
${photoContext}

Rewrite ONE paragraph from this section to naturally incorporate the student's specific details — their actual tools, their real implementation, their personal experience. Make the content technically accurate and specific. Keep the academic tone. Return only the rewritten paragraph — no preamble, no explanation.`

      const updatedParagraph = await callOpenAI(system, user, 500)
      return res.json({ type: 'update', updatedParagraph: updatedParagraph.trim() })
    }

    // No answer — return comprehension questions
    const user = `Section title: "${sectionTitle}"
Section content: ${sectionContent.slice(0, 1200)}

Return ONLY this JSON (no markdown, no preamble):
{
  "plainExplanation": "Write 3-4 sentences explaining what this section is saying in plain, direct language a Nigerian final year student can fully understand. Start by stating the main argument, then explain why it matters for the project, then explain how it connects to the next section. Avoid academic jargon — write like you are explaining to a friend.",
  "localQuestion": "Write one specific, personal question that forces the student to connect this section to something they have actually seen, experienced or observed at their own university or in Nigeria. The question must reference something specific from the section content — not a generic question. Example format: 'In your Background, we argued that [specific claim]. Have you personally seen this at [university type] — for example [concrete example]? How does your experience compare to what the research says?'",
  "expertQuestion": "Write one sharp, specific question that a Nigerian university external examiner would actually ask in a defense about this exact section. It must challenge a specific claim, methodology choice, or gap in this section — not a generic academic question. Format it exactly as an examiner would ask it in the room."
}`
    const raw = await callOpenAI(system, user, 350)
    const data = serverSafeParseJSON(raw, {
      plainExplanation: 'This section explains the context and importance of your project topic.',
      localQuestion: 'Have you personally experienced the problem this section describes? Can you give a specific example from your university?',
      expertQuestion: 'How does the background you presented directly motivate the specific research problem you are solving?'
    })
    res.json({ type: 'questions', ...data })

  } catch (err) {
    console.error('Understand section error:', err)
    res.status(500).json({ error: err.message })
  }
})


// ─── SUPERVISOR CORRECTIONS ───────────────────────────────────────────────────
app.post('/api/apply-corrections', requireAuth, async (req, res) => {
  const { chapterTitle, chapterContent, corrections } = req.body
  if (!chapterTitle || !chapterContent || !corrections) {
    return res.status(400).json({ error: 'chapterTitle, chapterContent and corrections are required' })
  }
  try {
    const system = `You are an academic editor helping a Nigerian university student revise their final year project chapter based on supervisor feedback.
Apply the corrections carefully and completely. Maintain the academic tone and formal writing style.
Keep all correct parts of the original — only change what the corrections address.
Never reduce the length. If a correction asks to add something, add it properly.
Return the complete revised chapter — not just the changed parts.`

    const user = `Chapter: "${chapterTitle}"

ORIGINAL CHAPTER CONTENT:
${chapterContent.slice(0, 3000)}

SUPERVISOR'S CORRECTIONS:
${corrections}

Rewrite the complete chapter applying all the supervisor's corrections. Return only the revised chapter content — no explanation, no preamble.`

    const revised = await callOpenAI(system, user, 3000)
    res.json({ success: true, revisedContent: revised.trim() })
  } catch (err) {
    console.error('Apply corrections error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ─── PERSIST CHAPTERS ────────────────────────────────────────────────────────
app.post('/api/projects/:id/persist-chapters', requireAuth, async (req, res) => {
  const { chapters } = req.body;
  if (!chapters || !Array.isArray(chapters)) {
    return res.status(400).json({ success: false, error: "Valid chapters array required." });
  }
  try {
    const existing = await db.execute({ 
      sql: 'SELECT id, is_paid FROM projects WHERE id = ? AND user_id = ?', 
      args: [req.params.id, req.user.id] 
    });
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project record context not found.' });
    }
    const projectRecord = existing.rows[0];
    if (!projectRecord.is_paid) {
      const hasRestrictedContent = chapters.some(ch => ch.number > 1 && ch.content && ch.content.trim().length > 0);
      if (hasRestrictedContent) {
        return res.status(402).json({ 
          success: false, 
          error: "Payment Required. Please unlock the full project path to modify Chapters 2-5." 
        });
      }
    }
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

// ─── DEFENSE PREP ─────────────────────────────────────────────────────────────
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
    if (!project.is_paid) {
      return res.status(402).json({ success: false, error: "Defense optimization features require premium access." });
    }
    const parsedChapters = JSON.parse(project.chapters || '[]');
    const parsedInfo = JSON.parse(project.project_info || '{}');
    const collectiveText = parsedChapters.map(c => c.content).join('\n\n');
    const { generateStudentBreakdown, generateFlashcards, analyzeWeaknesses } = await import('./lib/ai.js');
    console.log(`[Defense Engine] Synthesizing evaluation assets for project: ${req.params.id}`);
    const [breakdown, flashcards, weaknesses] = await Promise.all([
      generateStudentBreakdown(parsedInfo, collectiveText),
      generateFlashcards(parsedInfo, collectiveText),
      analyzeWeaknesses(parsedInfo, collectiveText)
    ]);

    // Normalize parsed results (functions may return objects or JSON strings)
    const parsedBreakdown = typeof breakdown === 'string' ? JSON.parse(breakdown) : breakdown || {};
    const parsedFlashcards = typeof flashcards === 'string' ? JSON.parse(flashcards) : flashcards || [];
    const parsedWeaknesses = typeof weaknesses === 'string' ? JSON.parse(weaknesses) : weaknesses || { weaknesses: [] };

    // Calculate readiness score from weakness count
    const weaknessCount = (parsedWeaknesses.weaknesses && parsedWeaknesses.weaknesses.length) || 0;
    const readinessScore = Math.max(20, 100 - (weaknessCount * 12));

    // Write score back to DB
    await db.execute({
      sql: 'UPDATE projects SET defense_readiness = ? WHERE id = ?',
      args: [readinessScore, req.params.id]
    });

    res.json({
      success: true,
      data: {
        breakdown: parsedBreakdown,
        weaknesses: parsedWeaknesses,
        flashcards: parsedFlashcards,
        readinessScore
      }
    });
  } catch (error) {
    console.error("[Defense Prep Route Error]:", error);
    return res.status(500).json({ success: false, error: "Failed to compile defense training matrices." });
  }
});


// ─── DEFENSE SIMULATION Q&A ───────────────────────────────────────────────────
app.post('/api/projects/:id/defense-simulation', requireAuth, async (req, res) => {
  const { answers } = req.body // array of { question, answer }

  try {
    const existing = await db.execute({
      sql: 'SELECT chapters, project_info, is_paid FROM projects WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.id]
    })
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Project not found' })

    const project = existing.rows[0]
    if (!project.is_paid) return res.status(402).json({ error: 'Defense simulation requires premium access' })

    const parsedChapters = JSON.parse(project.chapters || '[]')
    const parsedInfo = JSON.parse(project.project_info || '{}')
    const projectText = parsedChapters.map(c => c.content).join('\n\n').slice(0, 4000)

    const system = `You are a strict but fair Nigerian university external examiner scoring a final year project defense. 
Score each student answer honestly. Be specific about what was good and what was missing.`

    const user = `Project Title: "${parsedInfo.topic}"
Department: ${parsedInfo.department}

Project Content Summary:
${projectText}

Student's answers to defense questions:
${answers.map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer || '(No answer provided)'}`).join('\n\n')}

For each answer, provide:
1. A score out of 10
2. One sentence of specific feedback
3. Whether the answer demonstrates understanding (true/false)

Return ONLY this JSON:
{
  "scores": [
    {
      "questionIndex": 0,
      "score": 8,
      "feedback": "Good understanding of the problem but missed mentioning the specific authentication protocol used.",
      "demonstrates_understanding": true
    }
  ],
  "overallScore": 75,
  "readinessLevel": "Ready|Needs Review|Not Ready",
  "summaryFeedback": "Two sentence overall assessment of the student's readiness."
}`

    const raw = await callOpenAI(system, user, 1500)
    const scored = serverSafeParseJSON(raw, {
      scores: answers.map((_, i) => ({ questionIndex: i, score: 5, feedback: 'Could not score', demonstrates_understanding: false })),
      overallScore: 50,
      readinessLevel: 'Needs Review',
      summaryFeedback: 'Scoring failed. Please try again.'
    })

    // Update defense_readiness in DB
    await db.execute({
      sql: 'UPDATE projects SET defense_readiness = ? WHERE id = ?',
      args: [scored.overallScore, req.params.id]
    })

    res.json({ success: true, ...scored })
  } catch (err) {
    console.error('Defense simulation error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ─── PROXY: OpenAI ────────────────────────────────────────────────────────────
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

  try {
    const encoded = encodeURIComponent(query)
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encoded}&limit=15&fields=title,authors,year,journal,externalIds,publicationVenue,openAccessPdf`
    
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    
    if (!response.ok) return res.json({ data: [] })
    const data = await response.json()
    res.json({ data: data.data || [] })
  } catch {
    res.json({ data: [] })
  }
})

// ─── ADMIN ────────────────────────────────────────────────────────────────────
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

// ─── GUIDES ───────────────────────────────────────────────────────────────────
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

// ─── AUTH ─────────────────────────────────────────────────────────────────────
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
   const userResult = await db.execute({ sql: 'SELECT id, name, email, created_at, onboarded FROM users WHERE id = ?', args: [result.lastInsertRowid] })
    const user = { ...userResult.rows[0], onboarded: false }
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ user, token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const result = await db.execute({ sql: 'SELECT id, name, email, created_at, onboarded, is_admin, humanization_credits FROM users WHERE id = ?', args: [req.user.id] })
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' })
 res.json({ user: { ...result.rows[0], onboarded: result.rows[0].onboarded === 1 } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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

app.post('/api/auth/new-project', requireAuth, async (req, res) => {
  try {
    res.json({ success: true, message: 'Start new project flow' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
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


// ─── PHOTO UPLOAD ─────────────────────────────────────────────────────────────
app.post('/api/upload/photos', requireAuth, memoryUpload.array('photos', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    const uploadPromises = req.files.map(file => new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `gradely/projects/${req.user.id}`,
          resource_type: 'image',
          transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result.secure_url)
        }
      )
      stream.end(file.buffer)
    }))

    const urls = await Promise.all(uploadPromises)
    res.json({ success: true, urls })
  } catch (err) {
    console.error('Photo upload error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/projects/:id', requireAuth, async (req, res) => {
  const { title, status, is_paid, chapters, abstract, references, structure, project_info, flashcard_scores, defense_readiness, chat_history, completed_sections, section_index_map, photos } = req.body
  try {
    const existing = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ? AND user_id = ?', args: [req.params.id, req.user.id] })
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Project not found' })
    const p = existing.rows[0]
    await db.execute({
      sql: 'UPDATE projects SET title = ?, status = ?, is_paid = ?, chapters = ?, abstract = ?, refs = ?, structure = ?, project_info = ?, flashcard_scores = ?, defense_readiness = ?, chat_history = ?, completed_sections = ?, section_index_map = ?, photos = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
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
        chat_history ? JSON.stringify(chat_history) : p.chat_history,
        completed_sections ? JSON.stringify(completed_sections) : p.completed_sections,
        section_index_map ? JSON.stringify(section_index_map) : p.section_index_map,
        photos ? JSON.stringify(photos) : p.photos,
        req.params.id, req.user.id
      ]
    })
    const updated = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [req.params.id] })
    res.json({ project: updated.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


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

app.get('/api/project/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.execute({
      sql: `
        SELECT p.*, u.name as publisher_name
        FROM published_projects p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `,
      args: [id]
    });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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