import { useState } from 'react';

export default function HumanizerClient() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

 const handleTransform = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError('');
    setOutputText('');

    try {
      const response = await fetch('http://localhost:3001/api/humanize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      const result = await response.json();
      
      // 1. Logs the exact response to your Browser Console (F12) for easy debugging
      console.log("ℹ️ GradelyAI Server Response:", result);

      // 2. Smart-parsing: Automatically unpacks whatever variable name your existing server uses
      const extractedText = result.data || result.text || result.humanizedText || result.output;

      if (extractedText) {
        setOutputText(extractedText);
      } else if (typeof result === 'string') {
        setOutputText(result); // Fallback if your server sends a raw string instead of JSON
      } else {
        // 3. Failsafe: If it's a weird shape, render the raw object so you can see it instantly
        setOutputText(JSON.stringify(result, null, 2));
      }
    } catch (err) {
      setError('Could not connect to the backend server. Make sure port 3001 is online.');
      console.error('Frontend Fetch Error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827' }}>GradelyAI Engine</h1>
        <p style={{ color: '#4B5563' }}>Deterministic Mathematical Syntax Structuralizer</p>
      </header>

      <form onSubmit={handleTransform} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* INPUT PANEL */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Raw Input Text</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your AI-generated draft or academic text here..."
              style={{
                width: '100%',
                height: '350px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontFamily: 'inherit',
                fontSize: '1rem',
                resize: 'none'
              }}
            />
          </div>

          {/* OUTPUT PANEL */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Humanized Delivery Pool</label>
            <div
              style={{
                width: '100%',
                height: '350px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#F9FAFB',
                fontSize: '1rem',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                color: outputText ? '#111827' : '#9CA3AF'
              }}
            >
              {isLoading ? (
                <div style={{ color: '#2563EB', fontWeight: '500' }}>Executing Stage 1-5 matrix re-rolls... Shuffling chaos curves...</div>
              ) : error ? (
                <div style={{ color: '#DC2626' }}>{error}</div>
              ) : (
                outputText || 'Your rewritten, structurally-audited text will compile here...'
              )}
            </div>
          </div>
        </div>

        {/* TRIGGER BUTTON */}
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          style={{
            padding: '14px 24px',
            borderRadius: '6px',
            backgroundColor: isLoading ? '#9CA3AF' : '#111827',
            color: '#FFFFFF',
            fontSize: '1rem',
            fontWeight: '600',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isLoading ? 'Processing Pipeline...' : 'Execute Humanizer Pipeline 🚀'}
        </button>
      </form>
    </div>
  );
}