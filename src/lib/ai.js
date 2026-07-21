// GradelyAI — Core AI Engine (Claude)

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function callAI(systemPrompt, userPrompt, maxTokens = 4000) {
  const token = localStorage.getItem('gradelyToken');

  const res = await fetch(`${BASE_URL}/api/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'API call failed');
  }

  const data = await res.json();
  return data.choices[0].message.content;
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
  // Better queries — more specific first, broader fallbacks
  // Shorter queries work better with Semantic Scholar rate limits
  // Max 3 words per query to avoid 429s on the first attempt
  const words = topic.split(' ').filter(w => w.length > 3) // skip short words like "of", "for", "a"
  const shortTopic = words.slice(0, 3).join(' ')
  const queries = [
    shortTopic,                           // e.g. "Network Authentication System"
    words.slice(0, 2).join(' '),          // e.g. "Network Authentication"
    department.split(' ')[0],             // e.g. "Computer"
  ]

  for (const q of queries) {
    try {
      const encoded = encodeURIComponent(q)
      const res = await fetch(`${BASE_URL}/api/papers?query=${encoded}`)
      if (!res.ok) {
        console.log(`fetchRealPapers: /api/papers returned ${res.status} for "${q}"`)
        continue
      }
      const data = await res.json()
      if (data.data && data.data.length > 0) {
        console.log(`fetchRealPapers: got ${data.data.length} papers for "${q}"`)
        return data.data
      }
    } catch (err) {
      console.log(`fetchRealPapers: exception for "${q}": ${err.message}`)
      continue
    }
  }
  console.log('fetchRealPapers: all queries returned empty')
  return []
}

// Builds the numbered paper list shown to the AI, plus a lookup so markers can be
// resolved back to real citations afterward — the AI only ever sees title/year/journal,
// never a pre-formatted citation string, so it has nothing to copy or misremember.
function formatPapersForPrompt(papers) {
  const lookup = {}
  if (!papers.length) return { context: '', lookup }
  const context = papers.slice(0, 8).map((p, i) => {
    const ref = `[${i + 1}]`
    lookup[ref] = p
    const authors = p.authors?.slice(0, 3).map(a => a.name).join(', ') || 'Unknown Author'
    const year = p.year || 'n.d.'
    const journal = p.journal?.name || p.publicationVenue?.name || ''
    return `${ref} Title: "${p.title || 'Untitled'}" | Year: ${year} | Published in: ${journal || 'academic journal'} | Authors: ${authors}`
  }).join('\n')
  return { context, lookup }
}

// Builds an APA in-text citation, e.g. "(Smith, 2021)" / "(Smith & Lee, 2021)" / "(Smith et al., 2021)"
// — always from real paper metadata, never from AI-generated text, so it can't be hallucinated.
function formatInTextCitation(paper) {
  const year = paper.year || 'n.d.'
  const lastName = (name) => {
    const parts = (name || '').trim().split(' ')
    return parts[parts.length - 1] || 'Unknown'
  }
  const authors = paper.authors || []
  if (authors.length === 0) return `(Unknown Author, ${year})`
  if (authors.length === 1) return `(${lastName(authors[0].name)}, ${year})`
  if (authors.length === 2) return `(${lastName(authors[0].name)} & ${lastName(authors[1].name)}, ${year})`
  return `(${lastName(authors[0].name)} et al., ${year})`
}

// Replaces the AI's [n] citation markers with real, deterministically-formatted in-text
// citations from lookup. Any marker that doesn't match a real paper is stripped — the AI
// is never trusted to write citation text itself.
function resolveCitationMarkers(content, lookup) {
  return content
    .replace(/\[(\d+)\]/g, (match, num) => {
      const paper = lookup[`[${num}]`]
      return paper ? formatInTextCitation(paper) : ''
    })
    .replace(/[ \t]+([.,;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
}

// ─── AREA GENERATION (Dynamic, department-aware) ────────────────────────────

export async function generateAreas(department, university) {
  const system = `You are a Nigerian university academic advisor. Your task is to suggest relevant research/project areas for a student's final year project based on their department. The areas must be specific to the department and relevant to the Nigerian/African context.

Return a JSON array of area names (strings). Each area should be a broad field within the department, e.g., for Computer Science: "Artificial Intelligence", "Cybersecurity", "Data Science", "Software Engineering", "Networking", "Database Systems", "Cloud Computing", "IoT".

Make sure the areas are distinct and cover the main sub‑fields of the department. Keep the list between 5 and 8 areas.

Return ONLY valid JSON array. No markdown, no preamble.`

  const user = `Department: ${department}
University: ${university}

Suggest 6 relevant areas for a final year project in this department.`

  try {
    const raw = await callAI(system, user, 500)
    const parsed = safeParseJSON(raw)
    if (Array.isArray(parsed) && parsed.length >= 3) {
      return parsed
    }
    // Fallback to static list if AI fails
    return getStaticAreas(department)
  } catch (error) {
    console.error('Area generation failed, using static fallback:', error)
    return getStaticAreas(department)
  }
}

// ─── STATIC AREAS (Fallback) ─────────────────────────────────────────────────

function getStaticAreas(department) {
  const map = {
    'Computer Science': ['Artificial Intelligence', 'Cybersecurity', 'Web Development', 'Mobile Applications', 'Database Systems', 'Machine Learning', 'Networking', 'Cloud Computing', 'IoT Systems'],
    'Business Administration': ['Marketing', 'Finance', 'Entrepreneurship', 'Human Resources', 'Operations Management', 'Strategic Management', 'Consumer Behavior', 'Business Analytics'],
    'Mass Communication': ['Broadcast Journalism', 'Public Relations', 'Advertising', 'Digital Media', 'Film Production', 'Media Ethics', 'Social Media Studies', 'Communication Theory'],
    'Electrical Engineering': ['Power Systems', 'Control Systems', 'Telecommunications', 'Renewable Energy', 'Signal Processing', 'Embedded Systems', 'Robotics', 'Electric Machines'],
    'Civil Engineering': ['Structural Engineering', 'Geotechnical Engineering', 'Transportation Engineering', 'Water Resources', 'Construction Management', 'Environmental Engineering', 'Urban Planning', 'Materials Engineering'],
  }
  return map[department] || ['General Studies', 'Project Management', 'Research Methods']
}

// ─── TOPIC GENERATION (Ultra-strict) ────────────────────────────────────────

export async function generateTopics(department, university, areaOfInterest, topicImagination = '') {
  // Department-specific example topics to guide the AI
  const examplesByDept = {
    'Computer Science': `
- "Blockchain-Based Document Verification System for Nigerian Universities" (software)
- "AI-Powered Student Performance Prediction Using Machine Learning" (software)
- "Network Intrusion Detection System Using Deep Learning" (software)
- "Mobile Health Appointment Scheduler for Nigerian Clinics" (software)
- "Analysis of Cybersecurity Threats in Nigerian Banking" (research)`,
    'Business Administration': `
- "Impact of Digital Marketing on SME Growth in Lagos" (research)
- "Employee Retention Strategies in Nigerian Tech Startups" (research)
- "Consumer Purchase Behaviour on E-commerce Platforms" (research)
- "Financial Literacy and Investment Decisions Among Nigerian Youth" (research)
- "Corporate Social Responsibility and Brand Loyalty in Nigeria" (research)`,
    'Mass Communication': `
- "Social Media and Political Awareness Among Nigerian Youth" (research)
- "Fake News Detection and Media Literacy in Nigeria" (research)
- "The Role of Radio in Rural Development in Nigeria" (research)
- "Representation of Women in Nollywood Films" (research)
- "Impact of Digital Media on Traditional Journalism" (research)`,
    'Electrical Engineering': `
- "Design of a Solar-Powered Water Pumping System" (hardware)
- "Development of a Smart Home Automation System" (mixed)
- "Analysis of Power Distribution Losses in Nigeria" (research)
- "Design of an IoT-Based Transformer Monitoring System" (mixed)
- "Optimal Sizing of Solar PV Systems for Residential Buildings" (research)`,
    'Civil Engineering': `
- "Analysis of Building Materials for Sustainable Construction in Nigeria" (research)
- "Design of a Low-Cost Housing Model for Urban Areas" (hardware)
- "Assessment of Road Pavement Deterioration in Lagos Metropolis" (research)
- "Analysis of Flood Control Measures in Nigerian Cities" (research)
- "Design of a Drainage System for Flood-Prone Areas in Nigeria" (hardware)`,
  }

  const examples = examplesByDept[department] || examplesByDept['Computer Science']

  const system = `You are a Nigerian university project supervisor. Your ONLY task is to generate project topics that are SPECIFIC to the student's department and relevant to the Nigerian/African context.

EXAMPLES OF GOOD TOPICS FOR ${department}:
${examples}

CRITICAL RULES:
- The topic title MUST clearly reflect ${department} — it must mention concepts from that field.
- The description MUST explain the relevance to ${department} and the Nigerian context.
- DO NOT generate topics that could fit any other department.
- If the student gave an area of interest, focus topics within that area, but still ensure they are ${department}-specific.
- Use simple, clear English.

Return valid JSON only. No markdown, no preamble.`

  const user = `Generate 5 project topics for:
- University: ${university}
- Department: ${department}
- Area of interest: ${areaOfInterest || 'any'}
${topicImagination ? `\nStudent's own idea or interest: "${topicImagination}" — use this to make the topics more personally relevant to them.` : ''}

The topics MUST be specific to ${department}. For each topic, provide:
1. id (auto-increment)
2. title (clear, specific, includes ${department} keywords)
3. description (2-3 sentences, explains how it relates to ${department} and Nigeria)
4. type ("research", "software", "hardware", or "mixed" – choose what's typical for ${department})
5. difficulty ("moderate", "challenging", "advanced")

Return ONLY this JSON:
{
  "topics": [
    { "id": 1, "title": "...", "description": "...", "type": "...", "difficulty": "..." }
  ]
}`

  // Helper: check if topics are relevant
  const isRelevant = (topics, dept) => {
    const keywords = getDepartmentKeywords(dept)
    const relevant = topics.filter(t => {
      const text = (t.title + ' ' + t.description).toLowerCase()
      return keywords.some(kw => text.includes(kw))
    })
    return relevant.length >= 3
  }

  // Attempt up to 2 times
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = await callAI(system, user, 1500)
      const result = safeParseJSON(raw)
      if (result && result.topics && result.topics.length >= 3) {
        if (isRelevant(result.topics, department)) {
          return result
        } else {
          console.warn(`Attempt ${attempt}: topics not relevant, retrying...`)
        }
      }
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err)
    }
  }

  // Fallback to department-specific static topics
  console.warn('Using fallback topics for', department)
  return getFallbackTopics(department)
}

// ─── DEPARTMENT KEYWORDS (for validation) ────────────────────────────────────

function getDepartmentKeywords(department) {
  const map = {
    'Computer Science': ['software', 'app', 'system', 'algorithm', 'data', 'network', 'security', 'ai', 'machine learning', 'database', 'programming', 'cyber', 'web', 'mobile', 'cloud', 'authentication', 'encryption', 'blockchain', 'iot', 'api'],
    'Business Administration': ['business', 'marketing', 'finance', 'management', 'entrepreneur', 'consumer', 'investment', 'customer', 'employee', 'organization', 'leadership', 'strategy', 'supply chain', 'hr', 'brand', 'sales', 'loyalty'],
    'Mass Communication': ['media', 'communication', 'journalism', 'broadcast', 'public relations', 'advertising', 'social media', 'news', 'radio', 'tv', 'film', 'mass media', 'press', 'digital media'],
    'Electrical Engineering': ['power', 'circuit', 'control', 'telecommunications', 'signal', 'motor', 'generator', 'transformer', 'grid', 'renewable', 'solar', 'wind', 'instrumentation', 'embedded', 'microcontroller', 'distribution'],
    'Civil Engineering': ['construction', 'structure', 'material', 'transport', 'road', 'bridge', 'foundation', 'soil', 'water', 'drainage', 'environmental', 'sustainable', 'concrete', 'steel', 'surveying', 'housing']
  }
  return map[department] || ['project', 'study', 'analysis', 'system']
}

// ─── FALLBACK TOPICS (department-specific) ───────────────────────────────────

function getFallbackTopics(department) {
  const map = {
    'Computer Science': [
      { id: 1, title: 'AI-Powered Student Performance Prediction System', type: 'software', difficulty: 'moderate' },
      { id: 2, title: 'Blockchain-Based Document Verification System for Nigerian Universities', type: 'software', difficulty: 'challenging' },
      { id: 3, title: 'Network Intrusion Detection System Using Machine Learning', type: 'software', difficulty: 'advanced' },
      { id: 4, title: 'Mobile Healthcare Appointment Scheduler for Nigerian Hospitals', type: 'software', difficulty: 'moderate' },
      { id: 5, title: 'Analysis of Cybersecurity Threats in Nigerian Banking Sector', type: 'research', difficulty: 'moderate' },
    ],
    'Business Administration': [
      { id: 1, title: 'Impact of Digital Marketing on SME Growth in Nigeria', type: 'research', difficulty: 'moderate' },
      { id: 2, title: 'Financial Literacy and Investment Decisions Among Nigerian Youth', type: 'research', difficulty: 'moderate' },
      { id: 3, title: 'Employee Retention Strategies in Nigerian Tech Startups', type: 'research', difficulty: 'moderate' },
      { id: 4, title: 'Consumer Behavior and E-commerce Adoption in Lagos', type: 'research', difficulty: 'moderate' },
      { id: 5, title: 'Corporate Social Responsibility and Brand Loyalty in Nigeria', type: 'research', difficulty: 'moderate' },
    ],
    'Mass Communication': [
      { id: 1, title: 'Social Media and Political Awareness Among Nigerian Youth', type: 'research', difficulty: 'moderate' },
      { id: 2, title: 'Fake News Detection and Media Literacy in Nigeria', type: 'research', difficulty: 'moderate' },
      { id: 3, title: 'The Role of Radio in Rural Development in Nigeria', type: 'research', difficulty: 'moderate' },
      { id: 4, title: 'Representation of Women in Nollywood Films', type: 'research', difficulty: 'moderate' },
      { id: 5, title: 'Impact of Digital Media on Traditional Journalism in Nigeria', type: 'research', difficulty: 'moderate' },
    ],
    'Electrical Engineering': [
      { id: 1, title: 'Design of a Solar-Powered Water Pumping System', type: 'hardware', difficulty: 'challenging' },
      { id: 2, title: 'Development of a Smart Home Automation System', type: 'mixed', difficulty: 'advanced' },
      { id: 3, title: 'Analysis of Power Distribution Losses in Nigeria', type: 'research', difficulty: 'moderate' },
      { id: 4, title: 'Design of an IoT-Based Transformer Monitoring System', type: 'mixed', difficulty: 'challenging' },
      { id: 5, title: 'Optimal Sizing of Solar PV Systems for Residential Buildings', type: 'research', difficulty: 'moderate' },
    ],
    'Civil Engineering': [
      { id: 1, title: 'Analysis of Building Materials for Sustainable Construction in Nigeria', type: 'research', difficulty: 'moderate' },
      { id: 2, title: 'Design of a Low-Cost Housing Model for Urban Areas', type: 'hardware', difficulty: 'challenging' },
      { id: 3, title: 'Assessment of Road Pavement Deterioration in Lagos Metropolis', type: 'research', difficulty: 'moderate' },
      { id: 4, title: 'Analysis of Flood Control Measures in Nigerian Cities', type: 'research', difficulty: 'moderate' },
      { id: 5, title: 'Design of a Drainage System for Flood-Prone Areas in Nigeria', type: 'hardware', difficulty: 'advanced' },
    ],
  }
  return { topics: (map[department] || map['Computer Science']).slice(0, 5) }
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
${projectInfo.guideContent ? `\nProject Guide Content (use this to determine exact chapter and subsection structure):\n${projectInfo.guideContent.substring(0, 2000)}` : ''}
${projectInfo.ragGuideContent ? `\nDepartmental Guide from Database (use this if no guide uploaded):\n${projectInfo.ragGuideContent.substring(0, 1500)}` : ''}
- IMPORTANT: If any guide content is provided above, use it to determine the exact subsection titles and structure. Do not use generic defaults.

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
  const { context: papersForPrompt, lookup: paperLookup } = formatPapersForPrompt(realPapers)

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
- If real papers are provided below, insert the [number] marker — e.g. [1] — immediately after the relevant claim, exactly as given in the paper list
- Do NOT write out an author name or year yourself. Never write "(Author, Year)" — only ever write the bracket marker like [1] or [2]. The real citation text is inserted automatically afterward from verified data
- Only use markers from the list provided — never invent a marker number that wasn't given to you
- If the real papers list is empty, write clean academic prose with NO citation markers at all
- NEVER invent, fabricate, or guess at sources
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

  const raw = await callAI(system, user, 4096)
  return resolveCitationMarkers(raw, paperLookup)
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

  // ── Deterministic APA 7th formatter — no AI, zero hallucination ───────────
  const references = realPapers.map((p, i) => {
    const authors = p.authors?.length
      ? p.authors.map(a => {
          const parts = (a.name || '').trim().split(' ')
          if (parts.length === 1) return parts[0]
          const last = parts[parts.length - 1]
          const initials = parts.slice(0, -1).map(n => n[0] + '.').join(' ')
          return `${last}, ${initials}`
        }).join(', ').replace(/, ([^,]+)$/, ', & $1')
      : 'Unknown Author'

    const year = p.year || 'n.d.'
    const title = p.title || 'Untitled'
    const journal = p.journal?.name || p.publicationVenue?.name || ''
    const doi = p.externalIds?.DOI || ''
    const url = p.openAccessPdf?.url || (doi ? `https://doi.org/${doi}` : '')

    let citation = `${authors} (${year}). ${title}.`
    if (journal) citation += ` *${journal}*.`
    if (doi) citation += ` https://doi.org/${doi}`
    else if (url) citation += ` ${url}`

    return {
      id: i + 1,
      citation: citation.trim(),
      source: journal ? 'journal' : url ? 'website' : 'other',
      url: url || ''
    }
  })

  return { references }
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

// ─── SOCRATIC CHAT ────────────────────────────────────────────────────────────
export async function socraticChat(projectInfo, chapterStructure, chatHistory, userMessage, existingReferences = [], options = {}) {
  const BASE_URL = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('gradelyToken');
  
  if (!token) {
    window.location.href = '/auth';
    throw new Error('Please log in');
  }
  
  const messages = chatHistory.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
  
  const response = await fetch(`${BASE_URL}/api/socratic-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages,
      projectInfo,
      chapterStructure,
      existingReferences,
      requestType: options.requestType || 'draft',
      currentChapterNumber: options.currentChapterNumber || null,
      currentSectionTitle: options.currentSectionTitle || null
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Socratic generate failed')
  }

  const data = await response.json()
  return data.message || ''
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