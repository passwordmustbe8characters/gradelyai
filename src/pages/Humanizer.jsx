import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import mammoth from 'mammoth'
import * as PDFJS from 'pdfjs-dist'

PDFJS.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Custom hook to get window size
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return size
}

export default function Humanizer() {
  const navigate = useNavigate()
  const { width } = useWindowSize()
  const isMobile = width < 640

  const [text, setText] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [cost, setCost] = useState(0)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef(null)

  // Real‑time word & cost calculation
  const updateStats = (inputText) => {
    const words = inputText.trim() ? inputText.trim().split(/\s+/).length : 0
    setWordCount(words)
    // 🔴 CRITICAL: Round UP to nearest 1000 words for pricing
    const roundedWords = Math.ceil(words / 1000) * 1000
    setCost(roundedWords) // ₦1 per word → e.g., 1700 words → ₦2000
  }

  const handleTextChange = (e) => {
    const val = e.target.value
    setText(val)
    updateStats(val)
  }


  
  // File upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    setLoading(true)

    try {
      let extractedText = ''
      const fileType = file.type

      if (fileType === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          extractedText = ev.target.result
          setText(extractedText)
          updateStats(extractedText)
          setLoading(false)
        }
        reader.readAsText(file)
        return
      }

      if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        extractedText = result.value
        setText(extractedText)
        updateStats(extractedText)
        setLoading(false)
        return
      }

      if (fileType === 'application/pdf' || file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise
        let fullText = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          const pageText = content.items.map(item => item.str).join(' ')
          fullText += pageText + '\n'
        }
        extractedText = fullText
        setText(extractedText)
        updateStats(extractedText)
        setLoading(false)
        return
      }

      alert('Please upload a .txt, .docx, or .pdf file.')
      setLoading(false)
    }  catch (error) {
  console.error('Detailed File Parsing Error:', error); // Log the full object
  alert(`Failed to read the file: ${error.message || 'Unknown error'}`); // Show the actual error message
  setLoading(false);
}
  }

  const handlePay = () => {
    if (wordCount === 0) {
      alert('Please paste or upload some text first.')
      return
    }
    alert(`Proceed to payment: ₦${cost.toLocaleString()} for ${wordCount} words`)
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* --- Sticky Navbar --- */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(247,245,240,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0,126,167,0.12)',
        boxShadow: '0 4px 30px rgba(0,126,167,0.10), 0 0 40px rgba(0,126,167,0.04)',
        padding: `0 ${isMobile ? '16px' : '24px'}`,
        height: isMobile ? '56px' : '64px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white' }}>G</div>
            {!isMobile && <span style={{ fontFamily: 'Melodrama, serif', fontSize: 20, color: 'var(--text)' }}>GradelyAI</span>}
          </div>
          
          {/* Back Button: Black Circle on Mobile, Text on Desktop */}
          {isMobile ? (
            <button 
              onClick={() => navigate('/')} 
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#1a1a1a',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 500,
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)'
              }}
            >
              ✕
            </button>
          ) : (
            <button className="btn-ghost" onClick={() => navigate('/')} style={{ fontSize: 14, fontWeight: 500 }}>
              ← Back to Home
            </button>
          )}
        </div>
      </nav>

      {/* --- Main content --- */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '1rem 16px' : '2rem 1rem' }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '24px',
          padding: isMobile ? '1.5rem' : '2rem',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
        }}>
          <h1 style={{
            fontFamily: 'Melodrama, serif',
            fontSize: isMobile ? '1.8rem' : '2.5rem',
            fontWeight: 400,
            color: 'var(--accent)',
            marginBottom: '0.5rem',
          }}>
             Humanize Your Text
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: isMobile ? '0.9rem' : '1rem' }}>
            Paste your text or upload a document, and we'll count the words and calculate the cost.
            <br />
            <strong style={{ color: 'var(--accent)' }}>
              ₦1000 per 1000 word
            </strong> — pay only for what you need.
          </p>

          {/* --- Input area --- */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '1rem',
              marginBottom: '1rem',
              alignItems: isMobile ? 'stretch' : 'center',
            }}>
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: isMobile ? 'center' : 'flex-start',
                gap: '8px',
                padding: isMobile ? '0.8rem 1.2rem' : '0.6rem 1.2rem',
                borderRadius: '40px',
                background: 'var(--accent)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.9rem',
                transition: 'opacity 0.2s',
                width: isMobile ? '100%' : 'auto',
                textAlign: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload File
                <input
                  type="file"
                  accept=".txt,.docx,.pdf"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                />
              </label>
              {fileName && <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', textAlign: isMobile ? 'center' : 'left' }}>📄 {fileName}</span>}
              {loading && <span style={{ color: 'var(--accent)', textAlign: isMobile ? 'center' : 'left' }}>⏳ Reading file...</span>}
            </div>

            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Paste your text here, or upload a file above..."
              style={{
                width: '100%',
                minHeight: isMobile ? '180px' : '250px',
                padding: '1rem',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                color: 'var(--text)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* --- Stats & Payment: Separate boxes on mobile --- */}
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                padding: '1rem',
                background: 'var(--bg-elevated)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Word Count</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text)' }}>
                  {wordCount.toLocaleString()}
                </p>
              </div>
              <div style={{
                padding: '1rem',
                background: 'var(--bg-elevated)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Estimated Cost</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>
                  ₦{cost.toLocaleString()}
                </p>
              </div>
              <button
                onClick={handlePay}
                disabled={wordCount === 0}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '40px',
                  border: 'none',
                  background: wordCount === 0 ? 'var(--text-dim)' : 'var(--accent)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: wordCount === 0 ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: wordCount === 0 ? 'none' : '0 4px 20px rgba(0,126,167,0.3)',
                }}
                onMouseEnter={e => {
                  if (wordCount > 0) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,126,167,0.4)'
                  }
                }}
                onMouseLeave={e => {
                  if (wordCount > 0) {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,126,167,0.3)'
                  }
                }}
              >
                Proceed to Pay →
              </button>
            </div>
          ) : (
            // Desktop: side‑by‑side layout
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2rem',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              background: 'var(--bg-elevated)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
            }}>
              <div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Word Count</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text)' }}>
                  {wordCount.toLocaleString()}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Estimated Cost</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>
                  ₦{cost.toLocaleString()}
                </p>
              </div>
              <button
                onClick={handlePay}
                disabled={wordCount === 0}
                style={{
                  padding: '0.8rem 2.5rem',
                  borderRadius: '40px',
                  border: 'none',
                  background: wordCount === 0 ? 'var(--text-dim)' : 'var(--accent)',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  cursor: wordCount === 0 ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: wordCount === 0 ? 'none' : '0 4px 20px rgba(0,126,167,0.3)',
                }}
                onMouseEnter={e => {
                  if (wordCount > 0) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,126,167,0.4)'
                  }
                }}
                onMouseLeave={e => {
                  if (wordCount > 0) {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,126,167,0.3)'
                  }
                }}
              >
                Proceed to Pay →
              </button>
            </div>
          )}

          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center' }}>
            Supported file formats: .txt, .docx, .pdf  •  We never store your uploaded content.
          </div>
        </div>
      </div>
    </div>
  )
}