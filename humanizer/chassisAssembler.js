// Gerund-based hooks that cleanly act as the grammatical subject of any sentence
const hooks = [
  "Fixing ",
  "Optimizing ",
  "Managing the setup for ",
  "Sorting out ",
  "Dealing with ",
  "Structuring "
];

const bridges = [
  " is basically key for ",
  " makes a massive difference when ",
  " is absolutely critical for ",
  " completely alters how you go about "
];

const pivots = [
  " without any visible lag.",
  " when traffic spikes.",
  " to avoid hitting a massive operational bottleneck.",
  " under heavy production loads."
];

const bluntStatements = [
  "Everything runs clean at baseline.",
  "It handles the default workload fine.",
  "That addresses the main infrastructure bottleneck."
];

function forceGerund(verb) {
  if (!verb) return "";
  let words = verb.toLowerCase().trim().split(/\s+/);
  
  // 1. Grab the FIRST word to handle phrasal verbs correctly (e.g., "look into" -> "looking into")
  let coreVerb = words[0];

  // 2. Safely bypass auxiliary AI leak words
  if (['is', 'are', 'be', 'to', 'must', 'can'].includes(coreVerb)) {
    words.shift();
    coreVerb = words[0] || "handling";
  }

  // 3. Apply the gerund transformation to the root verb
  if (!coreVerb.endsWith('ing')) {
    if (coreVerb.endsWith('es')) coreVerb = coreVerb.slice(0, -2);
    else if (coreVerb.endsWith('s') && !coreVerb.endsWith('ss')) coreVerb = coreVerb.slice(0, -1);
    else if (coreVerb.endsWith('e')) coreVerb = coreVerb.slice(0, -1);
    
    coreVerb = coreVerb + 'ing';
  }

  // 4. Stitch it back together (Outputs: "looking into", not "look intoing")
  words[0] = coreVerb;
  return words.join(' ');
}

export function assembleSentences(atomicDataArray) {
  if (!Array.isArray(atomicDataArray) || atomicDataArray.length === 0) return "";

  let outputText = "";

  atomicDataArray.forEach((rawEntry, index) => {
    const subject = (rawEntry.subject || "the code").toLowerCase().trim().replace(/[.]+$/g, "");
    const action = forceGerund(rawEntry.action || "run");
    let target = (rawEntry.target || "the system").toLowerCase().trim().replace(/[.]+$/g, "");

    // DEFENSIVE SAFEGUARD: Scrub verbs that bled into the target slot (e.g., "streamline the system" -> "the system")
    let targetWords = target.split(/\s+/);
    if (targetWords[0] === 'to') targetWords.splice(0, 2); // Removes "to streamline"
    else if (['streamline', 'handle', 'execute', 'ensure', 'protect', 'avoid'].includes(targetWords[0])) {
      targetWords.shift(); // Removes naked starting verbs
    }
    target = targetWords.join(' ') || "the setup";

    // Path Execution
    if (index % 3 === 0) {
      const hook = hooks[Math.floor(Math.random() * hooks.length)];
      const bridge = bridges[Math.floor(Math.random() * bridges.length)];
      const pivot = pivots[Math.floor(Math.random() * pivots.length)];
      outputText += `${hook}${subject}${bridge}${action} ${target}${pivot} `;
    } else if (index % 3 === 1) {
      outputText += `Focusing on ${subject} makes it much easier to streamline how the app goes about ${action} ${target}. `;
    } else {
      const blunt = bluntStatements[Math.floor(Math.random() * bluntStatements.length)];
      outputText += `${blunt} We just have to make sure we don't experience sudden lagging with ${subject}. `;
    }
  });

  return outputText.trim();
}