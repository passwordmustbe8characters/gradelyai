/**
 * STAGE 3: THE MATH JUDGE
 * Calculates true 'Burstiness' using the standard deviation of sentence lengths.
 */

// Core math formula to find variance
function calculateStandardDeviation(numbers) {
  if (numbers.length === 0) return 0;
  
  const mean = numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
  const variance = numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length;
  
  return Math.sqrt(variance);
}

export function runMathJudge(processedText, chosenProfile = 'academic') {
  // 1. Split the text into an array of individual sentences
  // This regex matches anything ending in a period, exclamation, or question mark
  const sentences = processedText.match(/[^.!?]+[.!?]+/g) || [];

  // 2. Count the exact number of words in each sentence
  const sentenceLengths = sentences.map(sentence => {
    // Strip punctuation and extra spaces, then count words
    const cleanSentence = sentence.replace(/[^\w\s]/g, '').trim();
    const words = cleanSentence.split(/\s+/);
    return words.filter(word => word.length > 0).length;
  }).filter(length => length > 0);

  // 3. Calculate the official Burstiness score
  const burstinessScore = calculateStandardDeviation(sentenceLengths);

  // 4. The Strict Threshold
  // 15.0 is incredibly high variance. Only true human chaos passes this.
  const PASS_THRESHOLD = 15.0;

  return {
    passed: burstinessScore >= PASS_THRESHOLD,
    score: burstinessScore,
    sentenceLengths: sentenceLengths, 
    totalSentences: sentenceLengths.length
  };
}