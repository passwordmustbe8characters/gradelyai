import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function ConceptIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )
}

function DefenseIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

function StudyIcon3D() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="rgba(0,126,167,0.1)"/>
      <rect x="10" y="20" width="36" height="26" rx="4" fill="#007EA7" opacity="0.3"/>
      <rect x="14" y="16" width="36" height="26" rx="4" fill="#007EA7" opacity="0.6"/>
      <rect x="18" y="12" width="36" height="26" rx="4" fill="#007EA7"/>
      <line x1="26" y1="22" x2="46" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <line x1="26" y1="27" x2="46" y2="27" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <line x1="26" y1="32" x2="38" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    </svg>
  )
}

function GotItIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function AlmostIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

function MissedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 21 12 17 16 21"/>
      <line x1="12" y1="17" x2="12" y2="11"/>
      <path d="M7 4H4a2 2 0 0 0-2 2v1a5 5 0 0 0 5 5"/>
      <path d="M17 4h3a2 2 0 0 1 2 2v1a5 5 0 0 1-5 5"/>
      <path d="M7 4h10v7a5 5 0 0 1-10 0z"/>
    </svg>
  )
}

export default function Flashcards() {
  const navigate = useNavigate()
  const [cards, setCards] = useState(null)
  const [mode, setMode] = useState('menu')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const [scores, setScores] = useState({ got: 0, almost: 0, missed: 0 })
  const [finished, setFinished] = useState(false)

  useEffect(() => {
  const saved = sessionStorage.getItem('gradelyFlashcards')
  if (!saved) { navigate('/results'); return }
  setTimeout(() => setCards(JSON.parse(saved)), 0)
}, [])

  const activeCards = mode === 'concept'
    ? cards?.conceptCards || []
    : cards?.defenseCards || []

  const currentCard = activeCards[currentIndex]

  const startMode = (m) => {
    setMode(m)
    setCurrentIndex(0)
    setShowAnswer(false)
    setUserAnswer('')
    setScores({ got: 0, almost: 0, missed: 0 })
    setFinished(false)
  }

  const handleFlip = () => {
    if (!userAnswer.trim()) return
    setShowAnswer(true)
  }

  const handleScore = (rating) => {
    setScores(s => ({ ...s, [rating]: s[rating] + 1 }))
    if (currentIndex < activeCards.length - 1) {
      setCurrentIndex(i => i + 1)
      setShowAnswer(false)
      setUserAnswer('')
    } else {
      setFinished(true)
    }
  }

  const readiness = activeCards.length > 0
    ? Math.round((scores.got / activeCards.length) * 100)
    : 0

  if (!cards) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading flashcards...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg)', padding: '0 24px 60px' }}>

      {/* Top bar */}
      <div style={{ width: '100%', maxWidth: 680, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>G</div>
          <span style={{ fontFamily: 'Melodrama, serif', fontSize: 18 }}>GradelyAI</span>
        </div>
        <button className="btn-ghost" onClick={() => navigate('/results')} style={{ fontSize: 13 }}>
          ← Back to Project
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: 680 }}>

        {/* MENU */}
        {mode === 'menu' && (
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <StudyIcon3D />
              </div>
              <h1 style={{ fontFamily: 'Melodrama, serif', fontSize: 36, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>
                Study Mode
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
                Test yourself before your defense. Know your project cold.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1.5px solid var(--border)' }}
                onClick={() => startMode('concept')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,126,167,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}>
                <div style={{ color: 'var(--accent)', marginBottom: 16 }}><ConceptIcon /></div>
                <h3 style={{ fontFamily: 'Melodrama, serif', fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
                  Concept Cards
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Key terms and concepts from your project.
                </p>
                <p style={{ fontSize: 13, color: 'var(--accent)', marginTop: 16, fontWeight: 600 }}>
                  {cards.conceptCards.length} cards →
                </p>
              </div>

              <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1.5px solid var(--border)' }}
                onClick={() => startMode('defense')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#007EA7'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,126,167,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}>
                <div style={{ color: '#007EA7', marginBottom: 16 }}><DefenseIcon /></div>
                <h3 style={{ fontFamily: 'Melodrama, serif', fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
                  Defense Cards
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Real panel questions with model answers.
                </p>
                <p style={{ fontSize: 13, color: '#007EA7', marginTop: 16, fontWeight: 600 }}>
                  {cards.defenseCards.length} cards →
                </p>
              </div>
            </div>

            <div className="card" style={{ background: 'rgba(0,126,167,0.05)', border: '1px solid rgba(0,126,167,0.15)' }}>
              <p style={{ fontSize: 14, color: 'var(--accent)', lineHeight: 1.7 }}>
                <strong>How it works:</strong> A question appears. Write your answer, then flip the card to compare. Rate yourself honestly — the score tells you how ready you are.
              </p>
            </div>
          </div>
        )}

        {/* ACTIVE SESSION */}
        {(mode === 'concept' || mode === 'defense') && !finished && currentCard && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <div>
                <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                  {mode === 'concept' ? 'Concept Cards' : 'Defense Cards'}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  Card {currentIndex + 1} of {activeCards.length}
                </p>
              </div>
              <button className="btn-ghost" onClick={() => setMode('menu')} style={{ fontSize: 13 }}>
                Exit
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 32 }}>
              <div style={{ height: '100%', borderRadius: 2, background: 'var(--accent)', width: `${(currentIndex / activeCards.length) * 100}%`, transition: 'width 0.3s ease' }} />
            </div>

            {/* Difficulty badge */}
            {mode === 'defense' && currentCard.difficulty && (
              <div style={{ marginBottom: 16 }}>
                <span style={{
                  fontSize: 12, padding: '3px 10px', borderRadius: 10, fontWeight: 600,
                  background: currentCard.difficulty === 'hard' ? 'rgba(217,79,79,0.08)' : currentCard.difficulty === 'medium' ? 'rgba(232,160,32,0.08)' : 'rgba(45,155,111,0.08)',
                  color: currentCard.difficulty === 'hard' ? 'var(--danger)' : currentCard.difficulty === 'medium' ? '#E8A020' : 'var(--success)',
                  border: '1px solid currentColor'
                }}>
                  {currentCard.difficulty} question
                </span>
              </div>
            )}

            {/* Question */}
            <div className="card" style={{ marginBottom: 20, padding: '32px', minHeight: 140, display: 'flex', alignItems: 'center', border: '1.5px solid var(--border)' }}>
              <p style={{ fontSize: 19, fontFamily: 'Melodrama, serif', lineHeight: 1.5, fontWeight: 600, color: 'var(--text)' }}>
                {currentCard.front}
              </p>
            </div>

            {/* Answer input */}
            {!showAnswer && (
              <div style={{ marginBottom: 20 }}>
                <label className="label">Your answer</label>
                <textarea className="input" rows={4}
                  placeholder="Write your answer before flipping the card..."
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  style={{ resize: 'vertical' }} />
                <button
                  className="btn-primary"
                  onClick={handleFlip}
                  disabled={!userAnswer.trim()}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 12, fontSize: 15, padding: '13px' }}>
                  Flip Card — See Answer
                </button>
                {!userAnswer.trim() && (
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}>
                    Write something first before flipping
                  </p>
                )}
              </div>
            )}

            {/* Answer reveal */}
            {showAnswer && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <div style={{ padding: '24px', borderRadius: 16, background: 'rgba(0,126,167,0.05)', border: '1.5px solid rgba(0,126,167,0.2)', marginBottom: 20 }}>
                  <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Model Answer
                  </p>
                  <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text)' }}>{currentCard.back}</p>
                </div>

                {userAnswer.trim() && (
                  <div style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', marginBottom: 20 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Answer</p>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{userAnswer}</p>
                  </div>
                )}

                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12, textAlign: 'center' }}>
                  How did you do?
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { key: 'got', label: 'Got it', color: 'var(--success)', bg: 'rgba(45,155,111,0.08)', icon: <GotItIcon /> },
                    { key: 'almost', label: 'Almost', color: '#E8A020', bg: 'rgba(232,160,32,0.08)', icon: <AlmostIcon /> },
                    { key: 'missed', label: 'Missed it', color: 'var(--danger)', bg: 'rgba(217,79,79,0.08)', icon: <MissedIcon /> },
                  ].map(r => (
                    <button key={r.key} onClick={() => handleScore(r.key)} style={{
                      padding: '12px', borderRadius: 12,
                      border: `1px solid ${r.color}`,
                      background: r.bg, color: r.color,
                      cursor: 'pointer', fontFamily: 'Geist, sans-serif',
                      fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}>
                      {r.icon} {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FINISHED */}
        {finished && (
          <div style={{ textAlign: 'center', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ color: readiness >= 80 ? 'var(--success)' : readiness >= 60 ? '#E8A020' : 'var(--danger)', display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <TrophyIcon />
            </div>
            <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 32, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
              Session Complete
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>
              Here's how you did on {activeCards.length} cards
            </p>

            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Got it', value: scores.got, color: 'var(--success)' },
                  { label: 'Almost', value: scores.almost, color: '#E8A020' },
                  { label: 'Missed', value: scores.missed, color: 'var(--danger)' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 32, fontWeight: 700, color: s.color, fontFamily: 'Melodrama, serif' }}>{s.value}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Defense Readiness</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: readiness >= 80 ? 'var(--success)' : readiness >= 60 ? '#E8A020' : 'var(--danger)' }}>
                    {readiness}%
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4 }}>
                  <div style={{ height: '100%', borderRadius: 4, width: `${readiness}%`, transition: 'width 0.5s ease', background: readiness >= 80 ? 'var(--success)' : readiness >= 60 ? '#E8A020' : 'var(--danger)' }} />
                </div>
              </div>

              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 16 }}>
                {readiness >= 80
                  ? 'You are ready for your panel. Go get that grade.'
                  : readiness >= 60
                  ? 'Almost there. Review the cards you missed and try again.'
                  : 'Keep studying. Focus on the cards you missed.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-ghost" onClick={() => startMode(mode)} style={{ flex: 1 }}>
                Try Again
              </button>
              <button className="btn-primary" onClick={() => setMode('menu')} style={{ flex: 1, justifyContent: 'center' }}>
                Switch Mode
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}