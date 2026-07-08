import { embed, bestMatchScore } from "@/lib/wsb/embeddingEngine";
import { PRODUCTS, TYPES, SLOT_CONFIDENCE_THRESHOLD } from "@/data/config";
import { extractTopic } from "@/lib/wsb/wsbGenerator";

// ─── Character bigram similarity ──────────────────────────────────────────────
// Handles typos like "elozoris" ≈ "elzonris" where Jaccard token-overlap fails
// because the misspelled word is a completely different token.

function bigrams(str) {
  const s = str.toLowerCase().replace(/\s+/g, "");
  const bg = new Set();
  for (let i = 0; i < s.length - 1; i++) bg.add(s.slice(i, i + 2));
  return bg;
}

function bigramSimilarity(a, b) {
  const bgA = bigrams(a);
  const bgB = bigrams(b);
  let intersection = 0;
  for (const bg of bgA) if (bgB.has(bg)) intersection++;
  const union = bgA.size + bgB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Checks whether any word in the prompt is "close enough" (by character
 * bigrams) to any keyword token in any of the option's reference phrases.
 * Returns a [0,1] confidence score (max bigram similarity found).
 * A score ≥ BIGRAM_THRESHOLD is treated as a fuzzy match.
 */
const BIGRAM_THRESHOLD = 0.38; // "elozoris" vs "elzonris" ≈ 0.40, well above unrelated words (~0)

function fuzzyDirectScore(prompt, option) {
  const promptWords = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3); // skip short words (for, the, …)

  let best = 0;

  for (const phrase of option.referencePhrases) {
    const refWords = phrase
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    for (const pw of promptWords) {
      for (const rw of refWords) {
        const sim = bigramSimilarity(pw, rw);
        if (sim > best) best = sim;
      }
    }
  }

  return best;
}

/**
 * Given a raw prompt, determines the best-matching option within a slot
 * group (e.g. PRODUCTS or TYPES). Returns null if nothing clears the
 * confidence threshold, which signals "not specified."
 *
 * Uses two layers:
 *  1. Embedding-based semantic similarity (real model or Jaccard fallback)
 *  2. Character-bigram fuzzy match as a typo-tolerant fallback
 */
async function resolveSlot(promptEmbedding, prompt, options) {
  let best = null;
  let bestScore = 0;

  // ── Layer 1: semantic / Jaccard score ────────────────────────────────────
  for (const option of options) {
    const score = await bestMatchScore(promptEmbedding, option.referencePhrases);
    if (score > bestScore) {
      bestScore = score;
      best = option;
    }
  }

  if (best && bestScore >= SLOT_CONFIDENCE_THRESHOLD) {
    return { ...best, confidence: bestScore };
  }

  // ── Layer 2: character-bigram fuzzy match (typo tolerance) ───────────────
  let fuzzyBest = null;
  let fuzzyBestScore = 0;

  for (const option of options) {
    const score = fuzzyDirectScore(prompt, option);
    if (score > fuzzyBestScore) {
      fuzzyBestScore = score;
      fuzzyBest = option;
    }
  }

  if (fuzzyBest && fuzzyBestScore >= BIGRAM_THRESHOLD) {
    return { ...fuzzyBest, confidence: fuzzyBestScore };
  }

  return null;
}

/**
 * Resolves both required slots (product, type) for a prompt.
 * Returns { product, type } where each is either a matched option object
 * or null if missing.
 */
export async function detectSlots(prompt) {
  const promptEmbedding = await embed(prompt);

  const [product, type] = await Promise.all([
    resolveSlot(promptEmbedding, prompt, PRODUCTS),
    resolveSlot(promptEmbedding, prompt, TYPES),
  ]);

  return {
    product,
    type,
    topic: extractTopic(prompt),
  };
}

export function missingSlotNames({ product, type }) {
  const missing = [];
  if (!product) missing.push("product");
  if (!type) missing.push("type");
  return missing;
}
