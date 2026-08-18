import { WsbDraft, WsbDraftInput } from "@/lib/wsb/types";

const GENERIC_WORDS = new Set([
  "a",
  "an",
  "and",
  "about",
  "around",
  "as",
  "for",
  "from",
  "on",
  "or",
  "our",
  "the",
  "this",
  "that",
  "their",
  "theme",
  "topic",
  "please",
  "need",
  "create",
  "generate",
  "draft",
  "build",
  "work",
  "statement",
  "brief",
  "wsb",
  "email",
  "emailer",
  "template",
  "campaign",
  "marketing",
  "cloud",
  "product",
  "products",
  "new",
  "patient",
  "target",
  "audience",
]);

function normalizeText(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTopicCandidate(value: string): string {
  const normalized = normalizeText(value);
  if (!normalized) return "";

  const tokens = normalized
    .split(" ")
    .filter(Boolean)
    .filter((token) => !GENERIC_WORDS.has(token));

  return tokens.join(" ").trim();
}

function toDisplayTopic(value: string): string {
  const cleaned = cleanTopicCandidate(value);
  if (!cleaned) return "general campaign";

  return cleaned
    .split(/\s+/)
    .map((word) => {
      if (word === "sfmc") return "SFMC";
      if (word === "rte") return "RTE";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function extractTopic(prompt: string): string | null {
  const normalized = normalizeText(prompt);
  if (!normalized) return null;

  const markers = [" for ", " about ", " on ", " regarding ", " around ", " topic "];
  const candidates = [];

  for (const marker of markers) {
    const index = normalized.lastIndexOf(marker);
    if (index >= 0) {
      candidates.push(normalized.slice(index + marker.length));
    }
  }

  if (candidates.length > 0) {
    for (const candidate of candidates) {
      const cleaned = cleanTopicCandidate(candidate);
      if (cleaned && cleaned.split(" ").length <= 8) {
        return toDisplayTopic(cleaned);
      }
    }
  }

  const fallback = normalized
    .split(" ")
    .filter(Boolean)
    .filter((token) => !GENERIC_WORDS.has(token))
    .filter((token) => token.length > 2)
    .slice(0, 6)
    .join(" ");

  if (!fallback) return null;

  const hasTopicLikeSignal = /\b(about|for|on|regarding|around|topic|launch|update|education|program|offer|anniversary|event|refresh|new)\b/.test(normalized);
  return hasTopicLikeSignal ? toDisplayTopic(fallback) : null;
}

export function buildMockWsbDraft({
  product,
  type,
  topic,
  prompt = "",
}: WsbDraftInput): WsbDraft {
  const resolvedTopic = topic || extractTopic(prompt) || "General Campaign";
  const productLabel = product?.label || "product";
  const typeLabel = type?.label || "email";
  const topicLabel = toDisplayTopic(resolvedTopic);

  const title = `${productLabel} • ${typeLabel} • ${topicLabel} WSB`;
  const summary = `Drafted a ${typeLabel.toLowerCase()} work statement brief for the ${topicLabel.toLowerCase()} message on ${productLabel}.`;

  const phases = [
    {
      title: "Phase 1 — Header content",
      copy: `Create a concise header that introduces the ${topicLabel} story for ${productLabel} and sets the ${typeLabel} intent in the first view.`,
    },
    {
      title: "Phase 2 — Hero and body copy",
      copy: `Write short hero messaging and body copy that explains the offer, audience benefit, and key proof points around ${topicLabel}.`,
    },
    {
      title: "Phase 3 — CTA and footer",
      copy: `Add a clear call-to-action and footer guidance that aligns the ${typeLabel} with the ${topicLabel} campaign goal.`,
    },
    {
      title: "Phase 4 — Review and QA",
      copy: `Review the draft for audience fit, brand tone, compliance language, and readiness for handoff to production.`,
    },
  ];

  return {
    title,
    topic: topicLabel,
    summary,
    phases,
  };
}
