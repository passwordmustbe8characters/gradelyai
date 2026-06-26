from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import random
import copy

app = Flask(__name__)
CORS(app)

# ------------------------------------------------------------
# 1. Large synonym dictionary (stage: lexical substitution)
# ------------------------------------------------------------
WORD_SWAPS = {
    'crucial': ['key', 'major', 'big', 'central', 'critical'],
    'furthermore': ['also', 'plus', 'then', 'next'],
    'moreover': ['also', 'further', 'then'],
    'nevertheless': ['but', 'still', 'yet'],
    'consequently': ['so', 'thus', 'hence'],
    'accordingly': ['so', 'thus'],
    'delve': ['explore', 'dig', 'examine'],
    'robust': ['strong', 'solid', 'tough'],
    'leverage': ['use', 'utilize', 'employ'],
    'utilize': ['use', 'employ'],
    'pivotal': ['key', 'central', 'major'],
    'underscore': ['show', 'highlight', 'emphasize'],
    'notably': ['especially', 'particularly', 'namely'],
    'tapestry': ['mix', 'combination', 'variety', 'web'],
    'paradigm': ['model', 'framework', 'pattern', 'example'],
    'important': ['key', 'major', 'significant', 'big'],
    'significant': ['major', 'notable', 'big', 'meaningful'],
    'therefore': ['so', 'thus', 'accordingly', 'as a result'],
    'aspect': ['part', 'feature', 'element', 'side'],
    'protects': ['guards', 'shields', 'defends', 'secures'],
    'sensitive': ['private', 'confidential', 'personal', 'delicate'],
    'data': ['information', 'details', 'records', 'material'],
    'unauthorized': ['illegal', 'unapproved', 'unwanted', 'improper'],
    'access': ['entry', 'admission', 'entrance', 'approach']
}

FILLERS = [
    "Look, ", "The reality is, ", "Basically, ", "In practice, ",
    "Here's the thing: ", "Simply put, ", "What this means is ",
    "You see, ", "I mean, ", "Honestly, ", "Actually, "
]

FRAGMENTS = [
    "That's the point.", "Go figure.", "Makes sense.", "Anyway.",
    "Which is interesting.", "That's the key.", "It is what it is.",
    "But I digress.", "You get the idea.", "No cap."
]

# ------------------------------------------------------------
# Stage 2: Simulated translation chain (clause scrambling)
# ------------------------------------------------------------
def clause_scramble(text):
    """Split sentences at conjunctions and randomly swap clauses."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    new_sentences = []
    for sent in sentences:
        # Split at 'and', 'but', 'or', 'because', 'so' (with word boundaries)
        parts = re.split(r'\s+(and|but|or|because|so)\s+', sent, flags=re.IGNORECASE)
        if len(parts) >= 3 and random.random() < 0.8:
            # parts looks like [clause1, conjunction, clause2, ...]
            # Swap the first two clauses if they exist
            if len(parts) >= 3:
                parts[0], parts[2] = parts[2], parts[0]
                sent = ' '.join(parts)
        new_sentences.append(sent)
    return ' '.join(new_sentences)

# ------------------------------------------------------------
# Stage 3: Sentence splitting (break long sentences)
# ------------------------------------------------------------
def split_long_sentences(text, max_words=8):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    new_sentences = []
    for sent in sentences:
        words = sent.split()
        if len(words) > max_words and random.random() < 0.9:
            split = random.randint(max_words//2, len(words)-max_words//2)
            first = ' '.join(words[:split])
            second = ' '.join(words[split:])
            if random.random() < 0.5:
                sent = f"{first} — {second.lower()}"
            else:
                sent = f"{first}. {second.lower()}"
        new_sentences.append(sent)
    return ' '.join(new_sentences)

# ------------------------------------------------------------
# Stage 4: Filler injection
# ------------------------------------------------------------
def inject_fillers(text):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    for i in range(len(sentences)):
        if random.random() < 0.6 and len(sentences[i].split()) > 5:
            filler = random.choice(FILLERS)
            sentences[i] = filler + sentences[i][0].lower() + sentences[i][1:]
    return ' '.join(sentences)

# ------------------------------------------------------------
# Stage 5: Sentence merging (create run‑ons)
# ------------------------------------------------------------
def merge_sentences(text):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    if len(sentences) > 2 and random.random() < 0.8:
        idx = random.randint(0, len(sentences)-2)
        merged = sentences[idx].rstrip('.') + ", and " + sentences[idx+1].lower()
        sentences[idx] = merged
        del sentences[idx+1]
    return ' '.join(sentences)

# ------------------------------------------------------------
# Stage 6: Typo injection
# ------------------------------------------------------------
def inject_typos(text):
    if random.random() < 0.8:
        words = text.split()
        for i in range(len(words)):
            if len(words[i]) > 4 and random.random() < 0.3:
                w = words[i]
                pos = random.randint(1, len(w)-2)
                w = w[:pos] + w[pos+1] + w[pos] + w[pos+2:]
                words[i] = w
        text = ' '.join(words)
    return text

# ------------------------------------------------------------
# Stage 7: Fragment appending
# ------------------------------------------------------------
def append_fragment(text):
    if random.random() < 0.25:
        text += " " + random.choice(FRAGMENTS)
    return text

# ------------------------------------------------------------
# Stage 8: RLDF‑lite (generate variants and pick best by heuristic)
# ------------------------------------------------------------
def heuristic_score(text):
    words = text.lower().split()
    # Penalize remaining AI marker words
    ai_count = sum(1 for w in words if w in WORD_SWAPS)
    # Reward fillers
    filler_count = sum(1 for f in FILLERS if f.lower().strip(', ') in text.lower())
    # Reward sentence length variance
    sentences = re.split(r'(?<=[.!?])\s+', text)
    if len(sentences) > 1:
        lengths = [len(s.split()) for s in sentences]
        variance = sum((l - sum(lengths)/len(lengths))**2 for l in lengths) / len(lengths)
    else:
        variance = 0
    score = ai_count * 10 - variance * 0.5 - filler_count * 5
    return score

def rldf_select(original, variants=2):
    best_text = original
    best_score = float('inf')
    for _ in range(variants):
        # Apply all stages (except RLDF recursion)
        text = original
        # Word swaps
        words = text.split()
        new_words = []
        for w in words:
            lower = w.lower().strip('.,!?;:')
            if lower in WORD_SWAPS and random.random() < 0.9:
                replacement = random.choice(WORD_SWAPS[lower])
                if w[0].isupper():
                    replacement = replacement.capitalize()
                new_words.append(replacement)
            else:
                new_words.append(w)
        text = ' '.join(new_words)
        text = clause_scramble(text)
        text = split_long_sentences(text)
        text = inject_fillers(text)
        text = merge_sentences(text)
        text = inject_typos(text)
        text = append_fragment(text)
        # Clean up
        text = re.sub(r'\s+', ' ', text).strip()
        text = re.sub(r'\s+([,.!?])', r'\1', text)
        text = re.sub(r'\s+—', ' —', text)
        score = heuristic_score(text)
        if score < best_score:
            best_score = score
            best_text = text
    return best_text

# ------------------------------------------------------------
# Main endpoint
# ------------------------------------------------------------
@app.route('/humanize', methods=['POST'])
def humanize():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400

    original = data['text']
    print("\n=== New request ===")
    print(f"Input: {original[:100]}...")
    
    try:
        # Run the full 8‑stage pipeline with RLDF‑lite (2 variants)
        humanized = rldf_select(original, variants=2)
        print(f"Output: {humanized[:150]}...")
        return jsonify({'success': True, 'text': humanized})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)