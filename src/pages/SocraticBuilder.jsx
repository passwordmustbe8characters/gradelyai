import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SocraticBuilder() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hey! I've analyzed your project guide. Let's build Chapter 1: Introduction. To start with Section 1.1 (Background), tell me in your own words: Why is this topic important right now?` }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)

  // Mock project data (Eventually this comes from sessionStorage)
  const projectData = {
    topic: "The Impact of Cybersecurity Laws on Nigerian Banks",
    chapters: [
      { id: 1, title: "Introduction", sections: ["1.1 Background", "1.2 Problem Statement", "1.3 Objectives"] },
      { id: 2, title: "Literature Review", sections: ["2.1 Conceptual Framework", "2.2 Empirical Review"] },
    ]
  }

  const [completedSections, setCompletedSections] = useState([])
  const MIN_WORDS = 10

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  
  const wordCount = input.trim() === '' ? 0 : input.trim().split(/\s+/).length
  const isThresholdMet = wordCount >= MIN_WORDS

  const handleSend = async () => {
    if (!isThresholdMet) return

    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsTyping(true)

    // SIMULATED AI RESPONSE (We will hook this up to the backend next!)
    setTimeout(() => {
      const aiReply = `Great point! So you're saying the laws are outdated. What specific vulnerabilities does that create for the banks themselves?`
      setMessages(prev => [...prev, { role: 'assistant', content: aiReply }])
      
      // Simulate completing a section after a few messages
      if (messages.length > 4 && !completedSections.includes("1.1")) {
        setCompletedSections(prev => [...prev, "1.1"])
        setMessages(prev => [...prev, { role: 'assistant', content: `Awesome, I have enough to draft Section 1.1! Check the side panel to preview it, or let's move to 1.2 Problem Statement. What exact gap are you filling?` }])
      }
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'Geist, sans-serif' }}>
      
      {/* LEFT SIDE: The Chat Interface */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 22, color: 'var(--text)' }}>Chapter 1: Introduction</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Topic: {projectData.topic}</p>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%',
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
                color: msg.role === 'user' ? 'white' : 'var(--text)',
                fontSize: '15px',
                lineHeight: 1.6,
                boxShadow: 'var(--shadow)'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ color: 'var(--text-dim)', fontSize: 14, fontStyle: 'italic' }}>GradelyAI is typing...</div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* The Word Count Enforcer Input */}
        <div style={{ padding: '20px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell the AI your thoughts in your own words..."
                style={{
                  width: '100%', padding: '14px 60px 14px 14px', borderRadius: '12px',
                  border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
                  fontSize: '14px', fontFamily: 'Geist, sans-serif', resize: 'none', outline: 'none', minHeight: '60px'
                }}
              />
              <div style={{
                position: 'absolute', bottom: '10px', right: '14px', fontSize: '11px',
                color: isThresholdMet ? 'var(--success)' : 'var(--text-dim)', transition: 'color 0.2s', fontWeight: 600
              }}>
                {wordCount}/{MIN_WORDS}
              </div>
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

      {/* RIGHT SIDE: The Quest Log / Side Panel */}
      <div style={{ width: '340px', background: 'var(--bg-elevated)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
        <h3 style={{ fontFamily: 'Melodrama, serif', fontSize: 20, marginBottom: '20px', color: 'var(--text)' }}>Project Progress</h3>
        
        {projectData.chapters.map(ch => (
          <div key={ch.id}>
            <h4 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '10px', marginTop: ch.id > 1 ? '20px' : '0' }}>
              Chapter {ch.id}: {ch.title}
            </h4>
            {ch.sections.map(sec => {
              const isReady = completedSections.includes(sec.split(' ')[0]);
              return (
                <div key={sec} style={{
                  padding: '12px 14px', borderRadius: '10px', marginBottom: '8px',
                  border: `1px solid ${isReady ? 'var(--success)' : 'var(--border)'}`,
                  background: isReady ? 'rgba(45,155,111,0.05)' : 'var(--bg)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '13px', color: isReady ? 'var(--success)' : 'var(--text)', fontWeight: 500 }}>{sec}</span>
                  {isReady && (
                    <button 
                      onClick={() => navigate('/results')}
                      style={{
                        padding: '5px 10px', borderRadius: '6px', border: 'none',
                        background: 'var(--success)', color: 'white', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                      }}>
                      View
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}