// -----------------------------------------------------------------------
// Single integration point for the "free AI API" that phrases clarifying
// questions when a slot (product or type) is missing.
//
// Nothing else in the app calls an external API directly — only this
// file. When you decide on a provider (Groq, Gemini, etc.), fill in
// `callExternalProvider` below and set VITE_AI_API_KEY / VITE_AI_API_URL
// in your .env file. Until then, the app runs fully offline using the
// template fallback so the demo never breaks on a missing key.
// -----------------------------------------------------------------------

const API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY;
const API_URL = process.env.NEXT_PUBLIC_AI_API_URL;

const FALLBACK_QUESTIONS = {
  product:
    "Which product is this for — Orserdu or Elzonris?",
  type: "What type of email is this — SFMC, RTE, or something else?",
  both:
    "A couple of things I need first: which product (Orserdu or Elzonris), and which email type (SFMC, RTE, or other)?",
};

function templateFallback(missing: string[]) {
  if (missing.length === 2) return FALLBACK_QUESTIONS.both;
  return FALLBACK_QUESTIONS[missing[0] as keyof typeof FALLBACK_QUESTIONS];
}

async function callExternalProvider(prompt: string, missing: string[]) {
  // Example shape for a Groq/OpenAI-compatible chat completions endpoint.
  // Left unimplemented until a provider is chosen — throwing here just
  // falls back to the template question below.
  if (!API_KEY || !API_URL) {
    throw new Error("No AI provider configured yet");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content:
            "You write one short, friendly clarifying question for a marketing ops tool. The user is requesting a Work Statement Brief but left out required details. Ask only for what's missing, in one sentence.",
        },
        {
          role: "user",
          content: `User prompt: "${prompt}". Missing details: ${missing.join(
            ", "
          )}.`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error("AI provider request failed");
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim();
}

/**
 * Returns a clarifying question string for the given missing slots.
 * Tries the configured external provider first, falls back to a
 * template so the demo always has something reasonable to show.
 */
export async function getClarifyingQuestion(prompt: string, missing: string[]) {
  try {
    const question = await callExternalProvider(prompt, missing);
    if (question) return { text: question, source: "ai" };
  } catch {
    // Silently fall through to the template — expected until a provider
    // is wired in.
  }
  return { text: templateFallback(missing), source: "template" };
}
