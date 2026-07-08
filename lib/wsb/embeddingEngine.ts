// Safe wrapper for transformers library with fallback implementation
let extractorPromise = null;
const embeddingCache = new Map(); // key → vector (or FallbackEmbedding)

// ─── Fallback: token-overlap scoring ─────────────────────────────────────────
// When the real model cannot load we use Jaccard overlap instead of random
// hash noise. A FallbackEmbedding carries its token set and is recognised by
// cosineSimilarity so it scores only on genuine keyword overlap.

class FallbackEmbedding {
  constructor(tokens) {
    this.tokens = tokens; // Set<string>
  }
}

function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
  );
}

function jaccardSimilarity(setA, setB) {
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const fallbackExtractor = {
  _call: async (text) => ({ data: new FallbackEmbedding(tokenize(text)) }),
};

/**
 * Lazily loads the MiniLM sentence embedding model. Cached across calls so
 * it only downloads/initializes once per session. Falls back gracefully if
 * transformers fails to load.
 */
function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      try {
        const oldErrorHandler = window.onerror;
        const oldUnhandledRejection = window.onunhandledrejection;
        let hasError = false;

        window.onerror = () => { hasError = true; return true; };
        window.onunhandledrejection = () => { hasError = true; return true; };

        try {
          const { pipeline, env } = await import("@xenova/transformers");

          window.onerror = oldErrorHandler;
          window.onunhandledrejection = oldUnhandledRejection;

          if (hasError) {
            console.warn("Transformers had init errors, using keyword fallback");
            return fallbackExtractor;
          }

          if (env) {
            env.allowRemoteModels = true;
            env.allowLocalModels = true;
          }

          return await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
        } catch (err) {
          console.warn("Failed to load transformers, using keyword fallback:", err.message);
          window.onerror = oldErrorHandler;
          window.onunhandledrejection = oldUnhandledRejection;
          return fallbackExtractor;
        }
      } catch (err) {
        console.error("Fatal error in getExtractor:", err);
        return fallbackExtractor;
      }
    })();
  }
  return extractorPromise;
}

/**
 * Returns an embedding for a piece of text.
 * In real-model mode: a normalized float vector (plain Array).
 * In fallback mode:   a FallbackEmbedding instance (carries token set).
 * Results are memoized so re-embedding the same phrase is free.
 */
export async function embed(text) {
  const key = text.trim().toLowerCase();
  if (embeddingCache.has(key)) return embeddingCache.get(key);

  const extractor = await getExtractor();

  let output;
  if (typeof extractor === "function") {
    output = await extractor(text, { pooling: "mean", normalize: true });
  } else if (extractor && typeof extractor._call === "function") {
    output = await extractor._call(text);
  } else {
    console.warn("Extractor has unexpected format");
    output = { data: new FallbackEmbedding(tokenize(text)) };
  }

  // Preserve FallbackEmbedding instances; convert real model output to Array.
  const vector =
    output.data instanceof FallbackEmbedding
      ? output.data
      : Array.from(output.data);

  embeddingCache.set(key, vector);
  return vector;
}

export function cosineSimilarity(a, b) {
  // Fallback mode: both sides are FallbackEmbedding — use Jaccard token overlap
  if (a instanceof FallbackEmbedding && b instanceof FallbackEmbedding) {
    return jaccardSimilarity(a.tokens, b.tokens);
  }

  // Real model mode: standard dot-product cosine similarity
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
}

/**
 * Scores a query against a list of reference phrases and returns the best
 * (highest) similarity score found.
 */
export async function bestMatchScore(queryEmbedding, referencePhrases) {
  let best = 0;
  for (const phrase of referencePhrases) {
    const refEmbedding = await embed(phrase);
    const score = cosineSimilarity(queryEmbedding, refEmbedding);
    if (score > best) best = score;
  }
  return best;
}

/**
 * Preloads the model and warms the cache for a set of reference phrases so
 * the first real user prompt doesn't pay the full latency cost.
 */
export async function warmUp(allReferencePhrases) {
  await getExtractor();
  await Promise.all(allReferencePhrases.map((phrase) => embed(phrase)));
}
