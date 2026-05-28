// GradelyAI — Core AI Engine (Claude)

const BASE_URL = import.meta.env.VITE_API_URL || ''

async function callAI(systemPrompt, userPrompt, maxTokens = 4000) {
  const res = await fetch(`${BASE_URL}/api/claude`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'API call failed')
  }

  const data = await res.json()
  return data.content[0].text
}

// ─── SAFE JSON PARSER ─────────────────────────────────────────────────────────

function safeParseJSON(raw) {
  let cleaned = raw.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const lastBrace = cleaned.lastIndexOf('}')
    const lastBracket = cleaned.lastIndexOf(']')

    if (lastBrace === -1 && lastBracket === -1) {
      throw new Error('Response was too long and could not be parsed. Please try again.')
    }

    const cutAt = Math.max(lastBrace, lastBracket)
    let salvaged = cleaned.substring(0, cutAt + 1)

    const openBraces = (salvaged.match(/{/g) || []).length
    const closeBraces = (salvaged.match(/}/g) || []).length
    const openBrackets = (salvaged.match(/\[/g) || []).length
    const closeBrackets = (salvaged.match(/]/g) || []).length

    for (let i = 0; i < openBrackets - closeBrackets; i++) salvaged += ']'
    for (let i = 0; i < openBraces - closeBraces; i++) salvaged += '}'

    return JSON.parse(salvaged)
  }
}

// ─── STYLE ANALYSIS ───────────────────────────────────────────────────────────

export async function analyzeWritingStyle(styleSample) {
  if (!styleSample || styleSample.trim().length < 50) return null

  const system = `You are a linguistics expert analyzing writing style patterns.
Extract the writer's unique style fingerprint from their sample text.
Return only valid JSON. No markdown. No preamble.`

  const user = `Analyze this student's natural writing and extract their style fingerprint:

"${styleSample}"

Return ONLY this JSON:
{
  "avgSentenceLength": "short|medium|long",
  "vocabularyLevel": "simple|moderate|advanced",
  "toneFormality": "informal|semi-formal|formal",
  "commonTransitions": ["transition words they naturally use"],
  "writingPatterns": ["structural patterns they favor"],
  "samplePhrases": ["3-4 short phrases that capture their voice"],
  "uniqueCharacteristics": ["distinctive style elements to preserve"]
}`

  try {
    const raw = await callAI(system, user, 600)
    return safeParseJSON(raw)
  } catch {
    return null
  }
}

// ─── SEMANTIC SCHOLAR ─────────────────────────────────────────────────────────

export async function fetchRealPapers(topic, department) {
  const queries = [
    topic.split(' ').slice(0, 4).join(' '),
    department,
    `${department} Nigeria`,
  ]

  for (const q of queries) {
    try {
      const encoded = encodeURIComponent(q)
      const res = await fetch(`${BASE_URL}/api/papers?query=${encoded}`)
      if (!res.ok) continue
      const data = await res.json()
      if (data.data && data.data.length > 0) return data.data
    } catch {
      continue
    }
  }
  return []
}

function formatPapersForPrompt(papers) {
  if (!papers.length) return ''
  return papers.map((p, i) => {
    const authors = p.authors?.map(a => a.name).join(', ') || 'Unknown Author'
    const year = p.year || 'n.d.'
    const title = p.title || 'Untitled'
    const journal = p.journal?.name || p.publicationVenue?.name || ''
    const url = p.openAccessPdf?.url || ''
    return `[REF${i + 1}] ${authors} (${year}). "${title}". ${journal}. ${url}`
  }).join('\n')
}

// ─── TOPIC GENERATION ────────────────────────────────────────────────────────

export async function generateTopics(department, university, areaOfInterest) {
  const system = `You are an expert Nigerian university academic supervisor with deep knowledge of 
final year project requirements across Nigerian universities. You generate relevant, feasible, 
and academically rich project topics tailored to the Nigerian academic context.
Always respond with valid JSON only. No markdown. No preamble. No explanation.`

  const user = `Generate 5 final year project topic ideas for a student with these details:
- University: ${university}
- Department: ${department}
- Area of interest: ${areaOfInterest}

For each topic provide:
1. A clear specific project title
2. A 2-3 sentence description explaining what the project is about, why it matters, and what the student will build or research
3. Project type: "research" | "software" | "hardware" | "mixed"
4. Difficulty: "moderate" | "challenging" | "advanced"

Return ONLY this JSON:
{
  "topics": [
    {
      "id": 1,
      "title": "...",
      "description": "...",
      "type": "software",
      "difficulty": "moderate"
    }
  ]
}`

  const raw = await callAI(system, user, 1500)
  return safeParseJSON(raw)
}

// ─── STRUCTURE GENERATION ─────────────────────────────────────────────────────

export async function generateProjectStructure(projectInfo) {
  const system = `You are a Nigerian university academic expert. Generate final year project chapter structures.
Always respond with valid JSON only. No markdown. No preamble. Keep it concise.`

  const user = `Create a chapter structure for this final year project:

- University: ${projectInfo.university}
- Department: ${projectInfo.department}
- Topic: ${projectInfo.topic}
- Project Type: ${projectInfo.projectType}
- Has project guide: ${projectInfo.hasGuide ? 'Yes' : 'No'}
${projectInfo.guideContent ? `\nProject Guide Content:\n${projectInfo.guideContent.substring(0, 1500)}` : ''}

Rules:
- Return exactly 5 chapters
- Each chapter has a number, title, and subsections array
- Each subsection has a number and title only
- No descriptions, no content, titles only
- For software/hardware include implementation sections in chapters 3 and 4

Return ONLY this JSON with no extra text:
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
        { "number": "1.5", "title": "Scope and Limitation of the Study" },
        { "number": "1.6", "title": "Definition of Terms" },
        { "number": "1.7", "title": "Organization of the Study" }
      ]
    }
  ],
  "referenceStyle": "APA",
  "estimatedPages": 80
}`

  const raw = await callAI(system, user, 1500)

  try {
    return safeParseJSON(raw)
  } catch {
    return {
      referenceStyle: 'APA',
      estimatedPages: 80,
      chapters: [
        {
          number: 1, title: 'INTRODUCTION',
          subsections: [
            { number: '1.1', title: 'Background to the Study' },
            { number: '1.2', title: 'Statement of the Problem' },
            { number: '1.3', title: 'Aim and Objectives of the Study' },
            { number: '1.4', title: 'Significance of the Study' },
            { number: '1.5', title: 'Scope and Limitation of the Study' },
            { number: '1.6', title: 'Definition of Terms' },
            { number: '1.7', title: 'Organization of the Study' }
          ]
        },
        {
          number: 2, title: 'LITERATURE REVIEW',
          subsections: [
            { number: '2.1', title: 'Introduction' },
            { number: '2.2', title: 'Conceptual Framework' },
            { number: '2.3', title: 'Theoretical Framework' },
            { number: '2.4', title: 'Empirical Review' },
            { number: '2.5', title: 'Summary of Literature Review' }
          ]
        },
        {
          number: 3, title: 'RESEARCH METHODOLOGY',
          subsections: [
            { number: '3.1', title: 'Introduction' },
            { number: '3.2', title: 'Research Design' },
            { number: '3.3', title: 'Population and Sample Size' },
            { number: '3.4', title: 'Data Collection Methods' },
            { number: '3.5', title: 'Data Analysis Techniques' },
            { number: '3.6', title: 'Validity and Reliability' }
          ]
        },
        {
          number: 4, title: 'RESULTS AND DISCUSSION',
          subsections: [
            { number: '4.1', title: 'Introduction' },
            { number: '4.2', title: 'Data Presentation' },
            { number: '4.3', title: 'Analysis of Results' },
            { number: '4.4', title: 'Discussion of Findings' }
          ]
        },
        {
          number: 5, title: 'SUMMARY, CONCLUSION AND RECOMMENDATIONS',
          subsections: [
            { number: '5.1', title: 'Introduction' },
            { number: '5.2', title: 'Summary of Findings' },
            { number: '5.3', title: 'Conclusion' },
            { number: '5.4', title: 'Recommendations' },
            { number: '5.5', title: 'Suggestions for Further Studies' }
          ]
        }
      ]
    }
  }
}

// ─── CHAPTER GENERATION ──────────────────────────────────────────────────────

export async function generateChapter(chapterInfo, projectInfo) {
  const { chapter, realPapers = [] } = chapterInfo
  const isImplementation = chapter.number >= 3 && projectInfo.projectType !== 'research'
  const papersForPrompt = formatPapersForPrompt(realPapers)

  const styleSection = projectInfo.styleProfile ? `
STUDENT WRITING STYLE TO MIRROR:
- Sentence length preference: ${projectInfo.styleProfile.avgSentenceLength}
- Vocabulary level: ${projectInfo.styleProfile.vocabularyLevel}
- Natural tone: ${projectInfo.styleProfile.toneFormality}
- Transitions they use naturally: ${projectInfo.styleProfile.commonTransitions?.join(', ')}
- Their writing patterns: ${projectInfo.styleProfile.writingPatterns?.join(', ')}
- Phrases that capture their voice: ${projectInfo.styleProfile.samplePhrases?.join(' / ')}
- Unique characteristics: ${projectInfo.styleProfile.uniqueCharacteristics?.join(', ')}

Write this chapter so it sounds like THIS specific student wrote it.
Match their vocabulary level, sentence rhythm, and natural transitions.
` : ''

  const system = `You are a professional Nigerian academic writer with expertise in writing final year 
project reports for Nigerian universities. You write rich, detailed, academically rigorous content.

WRITING RULES:
- Write in formal academic English appropriate for Nigerian universities
- Each subsection must be substantial — minimum 3 to 4 rich paragraphs
- Use proper in-text citations in ${projectInfo.referenceStyle || 'APA'} format e.g. (Smith, 2021)
- If real papers are provided below cite them using this format after the relevant claim: [SOURCE: Author, Year, "Paper Title", URL_OR_EMPTY]
- If the real papers list is empty write clean academic prose with NO citation markers at all
- NEVER invent fabricate or guess at sources
- NEVER write [SOURCE: General Knowledge] or any made up author
- Be specific to the Nigerian context where relevant
- For software and hardware chapters be technically precise
- Do NOT use placeholder text — write actual substantive content
- Aim for 2500 to 3500 words for the full chapter
${styleSection}

${papersForPrompt ? `REAL PAPERS YOU CAN CITE:\n${papersForPrompt}` : ''}`

  const builtContext = projectInfo.builtContext
    ? `\nWhat the student built:\n${projectInfo.builtContext}\n`
    : ''

  const user = `Write Chapter ${chapter.number}: ${chapter.title} for this final year project:

PROJECT DETAILS:
- Title: "${projectInfo.topic}"
- University: ${projectInfo.university}
- Department: ${projectInfo.department}
- Project Type: ${projectInfo.projectType}
${builtContext}
${projectInfo.supervisorNotes ? `\nSupervisor instructions: ${projectInfo.supervisorNotes}` : ''}

CHAPTER STRUCTURE:
${chapter.subsections.map(s => `${s.number}. ${s.title}`).join('\n')}

${isImplementation && projectInfo.builtContext
    ? 'IMPORTANT: This chapter must accurately reflect what the student described building. Use their actual details.'
    : ''}

Write each subsection with its number and title as a heading then write rich academic content.
Make this chapter comprehensive, rigorous, and specific to the exact project topic.`

  return await callAI(system, user, 4096)
}

// ─── ABSTRACT ────────────────────────────────────────────────────────────────

export async function generateAbstract(projectInfo, chaptersContent) {
  const system = `You are a Nigerian academic writer. Write concise professional abstracts for final year projects.`

  const user = `Write a professional abstract of 250 to 300 words for this project:

Title: "${projectInfo.topic}"
Department: ${projectInfo.department}
University: ${projectInfo.university}
Project Type: ${projectInfo.projectType}

Project summary:
${chaptersContent.substring(0, 2000)}

Cover: background, problem, objectives, methodology, findings, conclusion.
Write in past tense. No citations in abstract.`

  return await callAI(system, user, 600)
}

// ─── REFERENCES ──────────────────────────────────────────────────────────────

export async function generateReferences(projectInfo, realPapers = []) {
  if (realPapers.length === 0) {
    return { references: [], noSourcesFound: true }
  }

  const system = `You are a Nigerian academic librarian expert in citation formatting.
Format the provided real academic papers into proper APA 7th edition references.
Return only valid JSON. No markdown. No preamble.`

  const papersText = realPapers.map((p, i) => {
    const authors = p.authors?.map(a => a.name).join(', ') || 'Unknown Author'
    const year = p.year || 'n.d.'
    const title = p.title || 'Untitled'
    const journal = p.journal?.name || p.publicationVenue?.name || ''
    const url = p.openAccessPdf?.url || ''
    return `${i + 1}. Authors: ${authors} | Year: ${year} | Title: ${title} | Journal: ${journal} | URL: ${url}`
  }).join('\n')

  const user = `Format these real academic papers into proper APA 7th edition references.

PAPERS:
${papersText}

Return ONLY this JSON:
{
  "references": [
    {
      "id": 1,
      "citation": "Full APA 7th edition formatted reference",
      "source": "journal|book|website|conference",
      "url": "url if available or empty string"
    }
  ]
}`

  const raw = await callAI(system, user, 1500)
  return safeParseJSON(raw)
}

/// ─── HUMANIZATION ROUTE CONNECTORS ───────────────────────────────────────────

/**
 * Dispatches raw AI text down to your bulletproof local Express math orchestrator.
 * Avoids redundant LLM wrapper loops and runs instantly.
 * @param {string} text - The raw chapter content block.
 * @returns {Promise<string>} - The high-perplexity, math-verified humanized copy.
 */
export async function humanizeText(text) {
  if (!text || text.trim().length < 10) {
    throw new Error("Invalid text payload for humanization.");
  }

  try {
    const response = await fetch(`${BASE_URL}/api/humanize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "The local humanizer compilation matrix failed.");
    }

    // Return the mathematically validated text array directly to the UI editor state
    return data.data;

  } catch (error) {
    console.error("Frontend humanizer proxy compilation fault:", error);
    throw error;
  }
}

// ─── REWRITE SELECTION ───────────────────────────────────────────────────────

export async function rewriteSelection(selectedText, instruction) {
  const system = `You are an academic writing assistant helping a Nigerian university student edit their final year project.
The student has selected a specific passage and given you an instruction to improve it.
Return ONLY the rewritten passage — no explanation, no preamble, no quotes around it.
Match the academic tone and style of the surrounding text.
Keep the same general meaning unless specifically told to change it.`

  const user = `ORIGINAL TEXT:
"${selectedText}"

STUDENT INSTRUCTION:
"${instruction}"

Rewrite the original text following the student's instruction. Return only the rewritten text.`

  return await callAI(system, user, 500)
}

// ─── STUDENT BREAKDOWN ───────────────────────────────────────────────────────

export async function generateStudentBreakdown(projectInfo, fullProjectText) {
  const system = `You are a friendly student mentor who explains complex academic projects in simple 
clear language. You speak directly to the student like a brilliant friend helping them understand their own work.`

  const user = `Create a student-friendly breakdown of this final year project so the student can 
confidently explain and defend it.

Project Title: "${projectInfo.topic}"
Department: ${projectInfo.department}

Project Content:
${fullProjectText.substring(0, 5000)}

Write these sections:
1. "What Your Project Is About" — explain in 3 to 4 simple sentences as if telling a friend
2. "The Problem You Are Solving" — why this matters in plain language
3. "What You Did or Built" — simple walk-through of methodology
4. "Key Findings or What Your Project Shows"
5. "Why This Matters" — real world impact
6. "5 Key Terms You Must Know" — define the most important concepts simply

Write directly to the student using "your project", "you found", "you built".
Keep language simple but not patronizing.`

  return await callAI(system, user, 2000)
}

// ─── FLASHCARDS ──────────────────────────────────────────────────────────────

export async function generateFlashcards(projectInfo, fullProjectText) {
  const system = `You are a Nigerian university exam coach creating study flashcards for final year 
project defense preparation. Return only valid JSON. No markdown. No preamble.`

  const user = `Generate two sets of flashcards for this project defense:

Project: "${projectInfo.topic}"
Department: ${projectInfo.department}

Project content:
${fullProjectText.substring(0, 5000)}

SET 1 — CONCEPT CARDS: 10 cards covering key terms and concepts from the project
SET 2 — DEFENSE CARDS: 10 cards with realistic Nigerian university panel questions and model answers

Make defense questions varied — some easy, some medium, some hard like a real panel.

Return ONLY this JSON:
{
  "conceptCards": [
    {
      "id": "c1",
      "front": "What is [term]?",
      "back": "Clear definition with context from the project",
      "category": "concept"
    }
  ],
  "defenseCards": [
    {
      "id": "d1",
      "front": "Panel question?",
      "back": "Model answer the student should give",
      "difficulty": "easy|medium|hard",
      "category": "defense"
    }
  ]
}`

  const raw = await callAI(system, user, 2500)
  return safeParseJSON(raw)
}

// ─── WEAKNESS ANALYSIS ───────────────────────────────────────────────────────

export async function analyzeWeaknesses(projectInfo, fullProjectText) {
  const system = `You are a strict but fair Nigerian university project supervisor doing a pre-defense 
review. You identify genuine weaknesses honestly and help students prepare. Return only valid JSON. No markdown.`

  const user = `Review this project and identify where a panel might challenge the student.

Project: "${projectInfo.topic}"
Department: ${projectInfo.department}

Project excerpt:
${fullProjectText.substring(0, 4000)}

Identify 5 to 7 specific weaknesses. For each provide the area, the specific issue,
why a panel would flag it, and how the student should respond.

Return ONLY this JSON:
{
  "weaknesses": [
    {
      "id": 1,
      "area": "Methodology",
      "issue": "Specific issue description",
      "whyItMatters": "Why a panel would flag this",
      "suggestedResponse": "How the student should handle this question",
      "severity": "low|medium|high"
    }
  ],
  "overallReadiness": 75,
  "readinessComment": "Overall assessment in 2 sentences"
}`

  const raw = await callAI(system, user, 2000)
  return safeParseJSON(raw)
}