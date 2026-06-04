// src/lib/humanizer.js
const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function humanizeText(text, context = '') {
  const token = localStorage.getItem('gradelyToken');
  
  if (!token) {
    throw new Error('Please log in first');
  }
  
  const response = await fetch(`${BASE_URL}/api/humanize-v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text, context })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Humanization failed');
  }
  
  return data.text;
}

// Check if text needs humanizing
export function needsHumanizing(text) {
  const aiWords = ['crucial', 'furthermore', 'moreover', 'delve', 'robust', 'leverage', 'utilize', 'pivotal'];
  const lowerText = text.toLowerCase();
  const hasAiWords = aiWords.some(word => lowerText.includes(word));
  const isLongEnough = text.split(/\s+/).length > 30;
  return hasAiWords || isLongEnough;
}