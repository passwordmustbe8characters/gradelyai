import OpenAI from 'openai';
import process from 'node:process'; // 👈 Add this line to fix the ESLint error

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function shredToAtomicData(rawUserContent) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1, // Keep it completely robotic so it doesn't imagine things
      response_format: { 
        type: "json_schema",
        json_schema: {
          name: "semantic_shredder",
          strict: true,
          schema: {
            type: "object",
            properties: {
              fragments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    subject: { type: "string" },
                    action: { type: "string" },
                    target: { type: "string" }
                    // ❌ NO "reasoning" or "creativeText" allowed here. Pure data tokens.
                  },
                  required: ["subject", "action", "target"],
                  additionalProperties: false
                }
              }
            },
            required: ["fragments"],
            additionalProperties: false
          }
        }
      },
     messages: [
    { 
      role: "system", 
      content: `You are a deterministic metadata extraction clerk. Extract raw concepts into strict subject, action, and target fragments. 

CRITICAL EXTRACTION RULES:
1. The 'action' field MUST strictly be a SINGLE, core active verb word in its base, dictionary infinitive form (e.g., use 'streamline' instead of 'is to streamline'; use 'handle' instead of 'executing streamline'). Never include multiple verbs, modal verbs (must, should), auxiliary verbs (is, are), or prepositions here.
2. The 'subject' field must contain clean nouns or noun phrases. Never include active verbs or modifiers inside the subject field (e.g., use 'comprehensive assessments' instead of 'executing comprehensive assessments').
3. Do not introduce outside concepts, do not write structural filler paragraphs, and do not attempt to humanize the output.` 
    },
    { role: "user", content: rawUserContent }
  ]
  
    });

    // Parse out the strict JSON array directly
    const data = JSON.parse(response.choices[0].message.content);
    return data.fragments; // Hands the raw fragments straight to Stage 2
  } catch (error) {
    console.error("Extraction failed:", error);
    return [];
  }
}