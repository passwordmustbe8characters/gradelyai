import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { socraticChat } from '../lib/ai'

export default function SocraticBuilder() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)
    const [completedSections, setCompletedSections] = useState([])

  // 1. Safely grab data from sessionStorage
  let savedResult = null;
  let savedProjectInfo = null;
  try {
    const res = sessionStorage.getItem('gradelyResult');
    if (res) savedResult = JSON.parse(res);
    const proj = sessionStorage.getItem('gradelyProject');
    if (proj) savedProjectInfo = JSON.parse(proj);
  } catch (e) {
    console.error("Failed to read session storage", e);
  }

  // 2. Extract data
  const projectData = {
    topic: savedResult?.projectInfo?.topic || savedProjectInfo?.topic || "Your Project Topic",
    chapters: savedResult?.structure?.chapters || [],
    references: savedResult?.references || []
  }

  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hey! I've analyzed your project guide for "${projectData.topic}". Let's build Chapter 1: Introduction. To start with Section 1.1 (Background), tell me in your own words: Why is this topic important right now?` }
  ])

   // Dynamic Word Counter Logic: If the last message was a draft, drop the word count to 1 so they can just type "yes"
  const lastMessageWasDraft = messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].content.includes('[SECTION_DRAFT]')
  const MIN_WORDS = lastMessageWasDraft ? 1 : 10
  const wordCount = input.trim() === '' ? 0 : input.trim().split(/\s+/).length
  const isThresholdMet = wordCount >= MIN_WORDS

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!isThresholdMet) return

    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsTyping(true)

    

    try {
      const chapter1Structure = projectData.chapters.find(c => c.number === 1) || { subsections: [] }
      const aiReply = await socraticChat(
        savedProjectInfo || savedResult?.projectInfo || {}, 
        chapter1Structure, 
        messages, 
        userMessage,
        projectData.references // Pass references!
      )
      
            // Parse the reply for Draft tags and Chapter completion
      if (aiReply.includes('[SECTION_DRAFT]')) {
        // Extract section number (e.g., 1.1) from the chatty part after the draft
        const outroText = aiReply.split('[/SECTION_DRAFT]')[1] || '';
        const sectionMatch = outroText.match(/(\d+\.\d+)/); // Just look for the X.Y pattern
        if (sectionMatch) {
          setCompletedSections(prev => prev.includes(sectionMatch[1]) ? prev : [...prev, sectionMatch[1]])
        }
      }
      
      

      setMessages(prev => [...prev, { role: 'assistant', content: aiReply }])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: "Oops, I lost my train of thought. Can you repeat that?" }])
    }
    setIsTyping(false)
  }

  // Helper to format AI messages (Split Draft from Chat)
  const formatMessage = (content) => {
    if (!content.includes('[SECTION_DRAFT]')) return <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
    
    const parts = content.split('[SECTION_DRAFT]')
    const intro = parts[0]
    const draftAndOutro = parts[1].split('[/SECTION_DRAFT]')
    const draft = draftAndOutro[0]
    const outro = draftAndOutro[1] || ''

    return (
      <>
        {intro && <p style={{ marginBottom: 12, whiteSpace: 'pre-wrap' }}>{intro}</p>}
        <div style={{
          background: 'rgba(0,126,167,0.03)', border: '1px solid rgba(0,126,167,0.15)',
          padding: '16px', borderRadius: '10px', marginBottom: 12, whiteSpace: 'pre-wrap', lineHeight: 1.7
        }}>
          {draft}
        </div>
        {outro && <p style={{ marginTop: 8, color: 'var(--success)', fontWeight: 600, whiteSpace: 'pre-wrap' }}>{outro}</p>}
      </>
    )
  }

  const handleSaveAndExit = () => {
    if (!savedResult) {
      alert("No original project data found to save to.");
      navigate('/dashboard');
      return;
    }

    // Extract all drafts from the chat history
    const allDrafts = [];
    messages.forEach(msg => {
      if (msg.role === 'assistant' && msg.content.includes('[SECTION_DRAFT]')) {
        const parts = msg.content.split('[SECTION_DRAFT]');
        parts.slice(1).forEach(part => {
          const draftContent = part.split('[/SECTION_DRAFT]')[0].trim();
          if (draftContent) allDrafts.push(draftContent);
        });
      }
    });

    // Join the drafts into one massive chapter text (for now, assigning to Chapter 1)
    const compiledChapterText = allDrafts.join('\n\n');

    // Update the saved result with the generated content
    const updatedChapters = savedResult.chapters.map(ch => {
      if (ch.number === 1) {
        return { ...ch, content: compiledChapterText }
      }
      return ch
    });

    const finalResult = { ...savedResult, chapters: updatedChapters, humanized: true };
    sessionStorage.setItem('gradelyResult', JSON.stringify(finalResult));

    // Navigate to the results page to view the final document
    navigate('/results');
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'Geist, sans-serif' }}>
      
      {/* LEFT SIDE: Chat */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 20, color: 'var(--text)' }}>Socratic Builder</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Topic: {projectData.topic}</p>
          </div>
                  <button className="btn-primary" onClick={handleSaveAndExit} style={{ fontSize: 13, padding: '8px 16px' }}>
             Save & View Project
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%',
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
                color: msg.role === 'user' ? 'white' : 'var(--text)',
                fontSize: '14px',
                lineHeight: 1.6,
                boxShadow: 'var(--shadow)'
              }}>
                {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ color: 'var(--text-dim)', fontSize: 14, fontStyle: 'italic' }}>GradelyAI is typing...</div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Box */}
        <div style={{ padding: '20px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
               placeholder={lastMessageWasDraft ? "Type 'yes' or 'next'..." : "Tell the AI your thoughts in your own words..."}
                style={{
                  width: '100%', padding: '14px 60px 14px 14px', borderRadius: '12px',
                  border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
                  fontSize: '14px', fontFamily: 'Geist, sans-serif', resize: 'none', outline: 'none', minHeight: '60px'
                }}
              />
              {!lastMessageWasDraft && (
                              <div style={{
                position: 'absolute', bottom: '10px', right: '14px', fontSize: '11px',
                color: isThresholdMet ? 'var(--success)' : 'var(--text-dim)', transition: 'color 0.2s', fontWeight: 600
              }}>
                {lastMessageWasDraft ? '✓' : `${wordCount}/${MIN_WORDS}`}
              </div>
              )}
            </div>
            <button 
              onClick={handleSend} 
              disabled={!isThresholdMet || isTyping}
              style={{
                padding: '14px 20px', borderRadius: '12px', border: 'none',
                background: isThresholdMet ? 'var(--accent)' : 'var(--bg-card)',
                color: isThresholdMet ? 'white' : 'var(--text-dim)',
                cursor: isThresholdMet ? 'pointer' : 'not-allowed',
                fontSize: '14px', fontWeight: 600, fontFamily: 'Geist, sans-serif', transition: 'all 0.2s'
              }}>
              Send
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Quest Log */}
      <div style={{ width: '340px', background: 'var(--bg-elevated)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
        <h3 style={{ fontFamily: 'Melodrama, serif', fontSize: 20, marginBottom: '20px', color: 'var(--text)' }}>Project Progress</h3>
        
        {projectData.chapters.length > 0 ? (
          projectData.chapters.map(ch => (
            <div key={ch.number || ch.title}>
              <h4 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '10px', marginTop: ch.number > 1 ? '20px' : '0' }}>
                Chapter {ch.number}: {ch.title}
              </h4>
              {(ch.subsections || []).map(sec => {
                const sectionTitle = typeof sec === 'string' ? sec : sec.title;
                const secNum = sectionTitle.split(' ')[0]; // e.g. "1.1"
                const isReady = completedSections.includes(secNum);
                return (
                  <div key={sectionTitle} style={{
                    padding: '12px 14px', borderRadius: '10px', marginBottom: '8px',
                    border: `1px solid ${isReady ? 'var(--success)' : 'var(--border)'}`,
                    background: isReady ? 'rgba(45,155,111,0.05)' : 'var(--bg)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '13px', color: isReady ? 'var(--success)' : 'var(--text)', fontWeight: 500 }}>{sectionTitle}</span>
                    {isReady && <span style={{ fontSize: '12px', color: 'var(--success)' }}>✓</span>}
                  </div>
                )
              })}
            </div>
          ))
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>No project structure found.</p>
        )}
      </div>
    </div>
  )
}