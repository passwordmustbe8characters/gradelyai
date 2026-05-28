/* global process */
import { createRequire } from 'module';
import Anthropic from '@anthropic-ai/sdk';
const require = createRequire(import.meta.url);
const profiles = require('./humanizerProfiles.json');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function runStylisticWeaver(text, profileType = 'academic') {
  const selectedProfile = profiles[profileType] || profiles.academic;
  
  const formattingReference = selectedProfile.fewShotExamples.map(example => {
    return `[ROBOTIC AI DRAFT]: "${example.input}"\n[ORGANIC HUMAN REWRITE]: "${example.output}"`;
  }).join('\n\n');

  // The Prompt: Forcing Syntactical Whiplash
  const systemInstruction = `You are a Ghostwriter bypassing AI detection algorithms. You are writing for the profile: [${selectedProfile.profileName}].

YOUR DIRECTIVES TO BEAT THE ALGORITHM:
1. SYNTACTICAL WHIPLASH: You MUST create extreme variance in sentence length. Follow long, winding 35-word sentences with abrupt, 4-word punches. 
2. IMPERFECT ACADEMIA: Human students are not perfect. Use passive voice occasionally. Use em-dashes (—) to interrupt your own thoughts. 
3. BAN CLICHÉ TRANSITIONS: Never use "Furthermore", "Moreover", "In conclusion", "Therefore", or "Thus". If you must transition, start sentences with "But", "And", or "Yet".
4. CITATION & QUOTATION LOCK: NEVER alter, paraphrase, or delete text inside brackets/citations (e.g., [1], Adebayo, 2024) or quotation marks. Leave them exactly where they are.

STYLE TRANSFORMATIONS TO COPY CLOSELY:
${formattingReference}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6", 
    max_tokens: 4096,
    // THE MATH HACKERS: Forcing unpredictable word choices
    temperature: 1.0, 
    top_k: 40,
    system: systemInstruction,
    messages: [
      { role: "user", content: `Rewrite the following copy to destroy its mathematical predictability while preserving the exact intended meaning:\n\n${text}` }
    ]
  });

  return response.content[0].text;
}