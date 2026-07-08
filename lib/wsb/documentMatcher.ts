import { embed, bestMatchScore } from "@/lib/wsb/embeddingEngine";
import { DOCUMENTS, MIN_DOCUMENT_MATCH_CONFIDENCE } from "@/data/config";

/**
 * Matches a prompt (with product + type already resolved) against the
 * static document set. Narrows candidates by product/type first, then
 * uses semantic similarity to break ties or handle phrasing variation.
 */

export async function matchDocument(prompt, productId, typeId) {
  const candidates = DOCUMENTS.filter(
    (doc) => doc.product === productId && doc.type === typeId
  );

  const pool = candidates.length > 0 ? candidates : DOCUMENTS;
  const promptEmbedding = await embed(prompt);

  let best = null;
  let bestScore = 0;

  for (const doc of pool) {
    const score = await bestMatchScore(promptEmbedding, doc.referencePrompts);
    if (score > bestScore) {
      bestScore = score;
      best = doc;
    }
  }

  // If we narrowed to an exact product+type match, trust that pairing
  // regardless of phrasing similarity — the slots already did the hard work.
  // Fall back to the first candidate if no score beat 0 (very short prompt).
  if (candidates.length > 0) {
    return { document: best ?? candidates[0], confidence: bestScore };
  }

  if (best && bestScore >= MIN_DOCUMENT_MATCH_CONFIDENCE) {
    return { document: best, confidence: bestScore };
  }

  return { document: null, confidence: bestScore };
}
