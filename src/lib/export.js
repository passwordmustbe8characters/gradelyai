import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } from 'docx'
import { saveAs } from 'file-saver'

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
    const isSubheading = /^\d+\.\d+\s+[A-Z]/.test(trimmed)
    // Detect chapter headings like "CHAPTER ONE" or all caps
    const isChapterHeading = /^(CHAPTER|[A-Z\s]{10,})/.test(trimmed)

    if (isChapterHeading) {
      paragraphs.push({ type: 'chapter', text: trimmed })
    } else if (isSubheading) {
      paragraphs.push({ type: 'subheading', text: trimmed })
    } else {
      paragraphs.push({ type: 'body', text: cleanText(trimmed) })
    }
  }

  return paragraphs
}

function buildParagraphs(parsed, isClean) {
  const docParagraphs = []

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
    } else {
      const text = isClean ? p.text : p.text
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text,
              size: 24, // 12pt
              font: 'Times New Roman',
            })
          ],
          spacing: { after: 200, line: 360 }, // double spacing
          indent: { firstLine: 720 }, // paragraph indent
        })
      )
    }
  }

  return docParagraphs
}

// ─── TITLE PAGE ───────────────────────────────────────────────────────────────

function buildTitlePage(projectInfo) {
  return [
    new Paragraph({
      children: [new TextRun({ text: '', break: 1 })],
      spacing: { after: 400 }
    }),
    new Paragraph({
      text: projectInfo.university?.toUpperCase() || 'NIGERIAN UNIVERSITY',
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: projectInfo.university?.toUpperCase() || 'NIGERIAN UNIVERSITY', bold: true, size: 28, font: 'Times New Roman' })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: `DEPARTMENT OF ${projectInfo.department?.toUpperCase() || 'COMPUTER SCIENCE'}`, size: 24, font: 'Times New Roman' })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: ' ', size: 24 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: projectInfo.topic?.toUpperCase() || 'PROJECT TITLE', bold: true, size: 28, font: 'Times New Roman' })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: 'A Project Submitted to the Department in Partial Fulfilment of the Requirements for the Award of Bachelor of Science Degree', size: 24, font: 'Times New Roman', italics: true })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: `BY`, bold: true, size: 24, font: 'Times New Roman' })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: projectInfo.name?.toUpperCase() || 'STUDENT NAME', bold: true, size: 26, font: 'Times New Roman' })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: new Date().getFullYear().toString(), size: 24, font: 'Times New Roman' })]
    }),
    new Paragraph({
      children: [new TextRun({ text: '', break: 1 })],
      pageBreakBefore: true,
    })
  ]
}

// ─── ABSTRACT PAGE ────────────────────────────────────────────────────────────

function buildAbstractPage(abstract) {
  return [
    new Paragraph({
      text: 'ABSTRACT',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: cleanText(abstract), size: 24, font: 'Times New Roman' })],
      spacing: { after: 200, line: 360 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '', break: 1 })],
      pageBreakBefore: true,
    })
  ]
}

// ─── REFERENCES PAGE ──────────────────────────────────────────────────────────

function buildReferencesPage(references) {
  if (!references || references.length === 0) return []

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
        children: [new TextRun({ text: ref.citation, size: 24, font: 'Times New Roman' })],
        spacing: { after: 200 },
        indent: { hanging: 720 },
      })
    )
  }

  return paragraphs
}

// ─── MAIN EXPORT FUNCTIONS ────────────────────────────────────────────────────

export async function exportToWord(result, isClean = true) {
  const { projectInfo, chapters, abstract, references } = result

  const allSections = []

  // Title page
  allSections.push(...buildTitlePage(projectInfo))

  // Abstract
  if (abstract) {
    allSections.push(...buildAbstractPage(abstract))
  }

  // Chapters
  for (const chapter of chapters) {
    // Chapter heading
    allSections.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 300 },
        children: [new TextRun({
          text: `CHAPTER ${chapter.number}`,
          bold: true, size: 28, font: 'Times New Roman'
        })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({
          text: chapter.title,
          bold: true, size: 26, font: 'Times New Roman'
        })]
      })
    )

    // Chapter content
    const parsed = parseChapterContent(chapter.content)
    const built = buildParagraphs(parsed, isClean)
    allSections.push(...built)

    // Page break after each chapter
    allSections.push(
      new Paragraph({
        children: [new PageBreak()]
      })
    )
  }

  // References
  if (references && references.length > 0) {
    allSections.push(...buildReferencesPage(references))
  }

  // Build document
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
            font: 'Times New Roman',
            size: 24,
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