import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, ImageRun } from 'docx'
import { saveAs } from 'file-saver'
import { jsPDF } from 'jspdf'
import mermaid from 'mermaid'

// ─── FORMAT OPTIONS ────────────────────────────────────────────────────────────

export const FONT_OPTIONS = ['Times New Roman', 'Arial', 'Calibri']
export const FONT_SIZE_OPTIONS = [12, 11]
export const SPACING_OPTIONS = ['Double', '1.5', 'Single']
export const DEGREE_OPTIONS = [
  'Bachelor of Science Degree',
  'Bachelor of Arts Degree',
  'Bachelor of Engineering Degree',
  'Higher National Diploma',
  'Master of Science Degree',
]
export const CITATION_OPTIONS = ['APA', 'MLA', 'Chicago']

export const DEFAULT_FORMAT_OPTIONS = {
  fileType: 'word', // 'word' | 'pdf'
  font: 'Times New Roman',
  fontSize: 12,
  spacing: 'Double',
  degreeWording: DEGREE_OPTIONS[0],
  citationStyle: 'APA',
}

const SPACING_LINE = { Double: 360, '1.5': 276, Single: 240 }
const SPACING_MULTIPLIER = { Double: 2, '1.5': 1.5, Single: 1 }

const formatStorageKey = (projectId) => `gradelyExportFormat_${projectId || 'default'}`

export function loadFormatOptions(projectId) {
  try {
    const saved = localStorage.getItem(formatStorageKey(projectId))
    return saved ? { ...DEFAULT_FORMAT_OPTIONS, ...JSON.parse(saved) } : { ...DEFAULT_FORMAT_OPTIONS }
  } catch {
    return { ...DEFAULT_FORMAT_OPTIONS }
  }
}

export function saveFormatOptions(projectId, options) {
  localStorage.setItem(formatStorageKey(projectId), JSON.stringify(options))
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function cleanText(text) {
  // Remove [SOURCE: ...] markers for clean export version
  return text.replace(/\[SOURCE:[^\]]+\]/g, '').replace(/\s+/g, ' ').trim()
}

function parseChapterContent(content) {
  const lines = content.split('\n').filter(l => l.trim())
  const paragraphs = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Detect subsection headings like "1.1 Background to the Study"
    const subheadingMatch = trimmed.match(/^(\d+\.\d+)\s+[A-Z]/)
    // Detect chapter headings like "CHAPTER ONE" or all caps
    const isChapterHeading = /^(CHAPTER|[A-Z\s]{10,})/.test(trimmed)

    if (isChapterHeading) {
      paragraphs.push({ type: 'chapter', text: trimmed })
    } else if (subheadingMatch) {
      paragraphs.push({ type: 'subheading', text: trimmed, number: subheadingMatch[1] })
    } else {
      paragraphs.push({ type: 'body', text: cleanText(trimmed) })
    }
  }

  return paragraphs
}

// ─── DIAGRAM RASTERIZATION (Mermaid SVG → PNG, for embedding in exports) ──────

let mermaidInitialized = false
function ensureMermaidInitialized() {
  if (mermaidInitialized) return
  mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict' })
  mermaidInitialized = true
}

const DIAGRAM_MAX_WIDTH_PX = 480

async function svgToPngDataUrl(svgString) {
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = dataUri
  })

  const naturalWidth = img.naturalWidth || 600
  const naturalHeight = img.naturalHeight || 400
  const scale = 2 // rasterize at 2x for crisper embedded output
  const canvas = document.createElement('canvas')
  canvas.width = naturalWidth * scale
  canvas.height = naturalHeight * scale
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const displayWidth = Math.min(DIAGRAM_MAX_WIDTH_PX, naturalWidth)
  const displayHeight = Math.round(displayWidth * (naturalHeight / naturalWidth))

  return { dataUrl: canvas.toDataURL('image/png'), displayWidth, displayHeight }
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// Renders every chapter's flagged diagrams to PNG up front, so the rest of the
// export logic (buildParagraphs / the PDF chapter loop) can stay synchronous.
// Keyed by "{chapterNumber}_{subsectionNumber}" so lookups during paragraph
// building are a simple object access.
async function rasterizeDiagrams(chapters) {
  ensureMermaidInitialized()
  const images = {}
  for (const chapter of chapters) {
    for (const diagram of chapter.diagrams || []) {
      if (!diagram.mermaidCode?.trim()) continue
      try {
        const id = `export-diagram-${chapter.number}-${diagram.subsectionNumber.replace(/\./g, '-')}`
        const { svg } = await mermaid.render(id, diagram.mermaidCode)
        const { dataUrl, displayWidth, displayHeight } = await svgToPngDataUrl(svg)
        images[`${chapter.number}_${diagram.subsectionNumber}`] = {
          bytes: dataUrlToUint8Array(dataUrl),
          dataUrl,
          width: displayWidth,
          height: displayHeight,
        }
      } catch (err) {
        console.error(`Failed to rasterize diagram for ${diagram.subsectionNumber}:`, err.message)
      }
    }
  }
  return images
}

// ─── WORD EXPORT ────────────────────────────────────────────────────────────

function buildParagraphs(parsed, fmt, diagramImages, chapterNumber) {
  const docParagraphs = []
  const sizeHalfPoints = fmt.fontSize * 2
  const lineSpacing = SPACING_LINE[fmt.spacing] ?? SPACING_LINE.Double

  for (const p of parsed) {
    if (p.type === 'chapter') {
      docParagraphs.push(
        new Paragraph({
          text: p.text,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          bold: true,
        })
      )
    } else if (p.type === 'subheading') {
      docParagraphs.push(
        new Paragraph({
          text: p.text,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      )
      const diagram = diagramImages?.[`${chapterNumber}_${p.number}`]
      if (diagram) {
        docParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 300 },
            children: [new ImageRun({
              data: diagram.bytes,
              transformation: { width: diagram.width, height: diagram.height }
            })]
          })
        )
      }
    } else {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: p.text,
              size: sizeHalfPoints,
              font: fmt.font,
            })
          ],
          spacing: { after: 200, line: lineSpacing },
          indent: { firstLine: 720 }, // paragraph indent
        })
      )
    }
  }

  return docParagraphs
}

function buildTitlePage(projectInfo, fmt) {
  const sizeHalfPoints = fmt.fontSize * 2
  return [
    new Paragraph({
      children: [new TextRun({ text: '', break: 1 })],
      spacing: { after: 400 }
    }),
    new Paragraph({
      text: projectInfo.university?.toUpperCase() || 'NIGERIAN UNIVERSITY',
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: projectInfo.university?.toUpperCase() || 'NIGERIAN UNIVERSITY', bold: true, size: sizeHalfPoints + 4, font: fmt.font })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: `DEPARTMENT OF ${projectInfo.department?.toUpperCase() || 'COMPUTER SCIENCE'}`, size: sizeHalfPoints, font: fmt.font })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: ' ', size: sizeHalfPoints })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: projectInfo.topic?.toUpperCase() || 'PROJECT TITLE', bold: true, size: sizeHalfPoints + 4, font: fmt.font })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: `A Project Submitted to the Department in Partial Fulfilment of the Requirements for the Award of ${fmt.degreeWording}`, size: sizeHalfPoints, font: fmt.font, italics: true })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: `BY`, bold: true, size: sizeHalfPoints, font: fmt.font })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: projectInfo.name?.toUpperCase() || 'STUDENT NAME', bold: true, size: sizeHalfPoints + 2, font: fmt.font })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: new Date().getFullYear().toString(), size: sizeHalfPoints, font: fmt.font })]
    }),
    new Paragraph({
      children: [new TextRun({ text: '', break: 1 })],
      pageBreakBefore: true,
    })
  ]
}

function buildAbstractPage(abstract, fmt) {
  const sizeHalfPoints = fmt.fontSize * 2
  const lineSpacing = SPACING_LINE[fmt.spacing] ?? SPACING_LINE.Double
  return [
    new Paragraph({
      text: 'ABSTRACT',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: cleanText(abstract), size: sizeHalfPoints, font: fmt.font })],
      spacing: { after: 200, line: lineSpacing },
    }),
    new Paragraph({
      children: [new TextRun({ text: '', break: 1 })],
      pageBreakBefore: true,
    })
  ]
}

function buildReferencesPage(references, fmt) {
  if (!references || references.length === 0) return []
  const sizeHalfPoints = fmt.fontSize * 2

  const paragraphs = [
    new Paragraph({
      text: 'REFERENCES',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 300 },
    })
  ]

  for (const ref of references) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: ref.citation, size: sizeHalfPoints, font: fmt.font })],
        spacing: { after: 200 },
        indent: { hanging: 720 },
      })
    )
  }

  return paragraphs
}

export async function exportToWord(result, isClean = true, formatOptions = {}) {
  const fmt = { ...DEFAULT_FORMAT_OPTIONS, ...formatOptions }
  const { projectInfo, chapters, abstract, references } = result

  const diagramImages = await rasterizeDiagrams(chapters)
  const allSections = []

  allSections.push(...buildTitlePage(projectInfo, fmt))

  if (abstract) {
    allSections.push(...buildAbstractPage(abstract, fmt))
  }

  for (const chapter of chapters) {
    allSections.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 300 },
        children: [new TextRun({
          text: `CHAPTER ${chapter.number}`,
          bold: true, size: fmt.fontSize * 2 + 4, font: fmt.font
        })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({
          text: chapter.title,
          bold: true, size: fmt.fontSize * 2 + 2, font: fmt.font
        })]
      })
    )

    const parsed = parseChapterContent(chapter.content)
    const built = buildParagraphs(parsed, fmt, diagramImages, chapter.number)
    allSections.push(...built)

    allSections.push(
      new Paragraph({
        children: [new PageBreak()]
      })
    )
  }

  if (references && references.length > 0) {
    allSections.push(...buildReferencesPage(references, fmt))
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch
            bottom: 1440,
            left: 1800,   // 1.25 inch
            right: 1440,
          }
        }
      },
      children: allSections
    }],
    styles: {
      default: {
        document: {
          run: {
            font: fmt.font,
            size: fmt.fontSize * 2,
          }
        }
      }
    }
  })

  const blob = await Packer.toBlob(doc)
  const filename = isClean
    ? `${projectInfo.topic?.substring(0, 40) || 'project'}_FINAL.docx`
    : `${projectInfo.topic?.substring(0, 40) || 'project'}_WORKING.docx`

  saveAs(blob, filename)
}

// ─── PDF EXPORT ─────────────────────────────────────────────────────────────

const PDF_MARGIN = { top: 25, bottom: 25, left: 30, right: 25 } // mm
const PDF_PAGE_WIDTH = 210 // A4 mm
const PDF_PAGE_HEIGHT = 297 // A4 mm
const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH - PDF_MARGIN.left - PDF_MARGIN.right

function mmLineHeight(fontSize, spacing) {
  // Rough pt→mm conversion (1pt = 0.3528mm) scaled by the chosen line spacing
  return fontSize * 0.3528 * 1.15 * (SPACING_MULTIPLIER[spacing] ?? SPACING_MULTIPLIER.Double)
}

function pdfFontFor(font) {
  // jsPDF's built-in fonts — map the user's choice to the closest core font
  if (font === 'Arial') return 'helvetica'
  if (font === 'Calibri') return 'helvetica'
  return 'times'
}

export async function exportToPdf(result, isClean = true, formatOptions = {}) {
  const fmt = { ...DEFAULT_FORMAT_OPTIONS, ...formatOptions }
  const { projectInfo, chapters, abstract, references } = result
  const pdfFont = pdfFontFor(fmt.font)
  const lineHeight = mmLineHeight(fmt.fontSize, fmt.spacing)

  const diagramImages = await rasterizeDiagrams(chapters)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = PDF_MARGIN.top

  const newPage = () => {
    doc.addPage()
    y = PDF_MARGIN.top
  }

  const ensureSpace = (needed) => {
    if (y + needed > PDF_PAGE_HEIGHT - PDF_MARGIN.bottom) newPage()
  }

  const writeCentered = (text, size, opts = {}) => {
    doc.setFont(pdfFont, opts.style || 'normal')
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(text, PDF_CONTENT_WIDTH)
    for (const line of lines) {
      ensureSpace(lineHeight)
      doc.text(line, PDF_PAGE_WIDTH / 2, y, { align: 'center' })
      y += lineHeight
    }
    y += (opts.after || 0)
  }

  const writeBody = (text, size, opts = {}) => {
    doc.setFont(pdfFont, opts.style || 'normal')
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(text, PDF_CONTENT_WIDTH)
    for (const line of lines) {
      ensureSpace(lineHeight)
      doc.text(line, PDF_MARGIN.left, y)
      y += lineHeight
    }
    y += (opts.after || 2)
  }

  const writeDiagram = (diagram) => {
    // px → mm at 96dpi, capped to the page's content width
    const widthMm = Math.min(diagram.width * 0.2646, PDF_CONTENT_WIDTH)
    const heightMm = widthMm * (diagram.height / diagram.width)
    ensureSpace(heightMm + 6)
    const x = PDF_MARGIN.left + (PDF_CONTENT_WIDTH - widthMm) / 2
    doc.addImage(diagram.dataUrl, 'PNG', x, y, widthMm, heightMm)
    y += heightMm + 8
  }

  // Title page
  y = 60
  writeCentered(projectInfo.university?.toUpperCase() || 'NIGERIAN UNIVERSITY', fmt.fontSize + 4, { style: 'bold', after: 6 })
  writeCentered(`DEPARTMENT OF ${projectInfo.department?.toUpperCase() || 'COMPUTER SCIENCE'}`, fmt.fontSize, { after: 20 })
  writeCentered(projectInfo.topic?.toUpperCase() || 'PROJECT TITLE', fmt.fontSize + 4, { style: 'bold', after: 14 })
  writeCentered(`A Project Submitted to the Department in Partial Fulfilment of the Requirements for the Award of ${fmt.degreeWording}`, fmt.fontSize, { style: 'italic', after: 14 })
  writeCentered('BY', fmt.fontSize, { style: 'bold', after: 6 })
  writeCentered(projectInfo.name?.toUpperCase() || 'STUDENT NAME', fmt.fontSize + 2, { style: 'bold', after: 10 })
  writeCentered(new Date().getFullYear().toString(), fmt.fontSize, {})

  // Abstract
  if (abstract) {
    newPage()
    writeCentered('ABSTRACT', fmt.fontSize + 4, { style: 'bold', after: 8 })
    writeBody(cleanText(abstract), fmt.fontSize, {})
  }

  // Chapters
  for (const chapter of chapters) {
    newPage()
    writeCentered(`CHAPTER ${chapter.number}`, fmt.fontSize + 4, { style: 'bold', after: 4 })
    writeCentered(chapter.title, fmt.fontSize + 2, { style: 'bold', after: 8 })

    const parsed = parseChapterContent(chapter.content)
    for (const p of parsed) {
      if (p.type === 'chapter') {
        ensureSpace(lineHeight * 2)
        writeCentered(p.text, fmt.fontSize + 4, { style: 'bold', after: 4 })
      } else if (p.type === 'subheading') {
        ensureSpace(lineHeight * 2)
        writeBody(p.text, fmt.fontSize + 1, { style: 'bold', after: 3 })
        const diagram = diagramImages[`${chapter.number}_${p.number}`]
        if (diagram) writeDiagram(diagram)
      } else {
        writeBody(p.text, fmt.fontSize, {})
      }
    }
  }

  // References
  if (references && references.length > 0) {
    newPage()
    writeCentered('REFERENCES', fmt.fontSize + 4, { style: 'bold', after: 8 })
    for (const ref of references) {
      writeBody(ref.citation, fmt.fontSize, { after: 3 })
    }
  }

  const filename = isClean
    ? `${projectInfo.topic?.substring(0, 40) || 'project'}_FINAL.pdf`
    : `${projectInfo.topic?.substring(0, 40) || 'project'}_WORKING.pdf`

  doc.save(filename)
}
