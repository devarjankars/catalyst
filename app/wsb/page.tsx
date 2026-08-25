"use client"

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from "react";
import Header from "@/components/wsb/Header";
import PromptForm from "@/components/wsb/PromptForm";
import MessageBubble from "@/components/wsb/MessageBubble";
import TraceLog from "@/components/wsb/TraceLog";
import ResultCard from "@/components/wsb/ResultCard";
import OptionPicker from "@/components/wsb/OptionPicker";
import { detectSlots } from "@/lib/wsb/slotDetection";
import { matchDocument } from "@/lib/wsb/documentMatcher";
import { buildMockWsbDraft } from "@/lib/wsb/wsbGenerator";
import { PRODUCTS, TYPES, DOCUMENTS } from "@/data/config";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  ChatMessage,
  Clarification,
  TraceLine,
  WsbDocument,
  WsbDraftPhase,
  WsbResult,
  WsbSlotOption,
} from "@/lib/wsb/types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const INTRO =
  "Tell me what you need — for example, \"create a WSB for an Orserdu SFMC emailer.\"";

// Question labels shown above the option pills (used only if we fall back to slot-picker UI)
const SLOT_QUESTIONS = {
  product: "Which product is this for?",
  type: "What type of email is this?",
  topic: "What topic should the emailer focus on?",
};

// ─── Interview step definitions ───────────────────────────────────────────────
// Each step has:
//   id          – unique key stored in interviewAnswers
//   aiMessage   – what the AI says to prompt this step
//   followsStep – which step index triggers this one (null = triggered by initial prompt)
//
// Steps 0-5 map to Prompts 1-6 in the spec.
// Step 0 is the AI reply to the user's first message.
const INTERVIEW_STEPS = [
  {
    id: "goal",
    aiMessage: "Sure. What would you like this email to accomplish?",
  },
  {
    id: "concepts",
    aiMessage: "What scientific or clinical concepts should this email communicate?",
  },
  {
    id: "claims",
    aiMessage:
      "This helps. Could you please specify which approved claims from the repository I should use as the basis for this email?",
  },
  {
    id: "references",
    aiMessage:
      "Yes, that helps. Are there any specific references you would like to prioritize or place greater emphasis on?",
  },
];

// Final AI message before kicking off generation
const FINAL_AI_MESSAGE =
  "Thank you. I have all the information I need. Please wait while I generate the first draft of the storyboard.";

// Non-Orserdu / non-SFMC unsupported message
const UNSUPPORTED_MESSAGE =
  "I'm sorry — right now this system only supports Orserdu SFMC emailers. We will be expanding to other products and email types in the future.";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Lightweight check: does the text mention a competitor / non-Orserdu product?
 *  You can extend this list or swap in your real detectSlots logic. */
function detectUnsupportedProduct(text: string): boolean {
  const lower = text.toLowerCase();
  // If user explicitly mentions orserdu that's fine — only flag non-orserdu products
  const competitorHints = [
    "ibrance", "kisqali", "verzenio", "piqray", "afinitor",
    "xeloda", "exemestane", "letrozole",
    "anastrozole", "tamoxifen", "paloma", "monarch", "monarcHER",
  ];
  return competitorHints.some((hint) => lower.includes(hint));
}

/** Lightweight check: does the text mention a non-SFMC channel? */
function detectUnsupportedType(text: string): boolean {
  const lower = text.toLowerCase();
  const unsupportedTypes = ["banner", "print", "msl", "webinar", "social", "linkedin", "twitter"];
  return unsupportedTypes.some((t) => lower.includes(t));
}

export default function Wsb() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ from: "ai", text: INTRO }]);
  const [busy, setBusy] = useState(false);
  const [traceLines, setTraceLines] = useState<TraceLine[]>([]);
  const [result, setResult] = useState<WsbResult | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [draftPhases, setDraftPhases] = useState<WsbDraftPhase[]>([]);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [preparing, setPreparing] = useState(false);

  // ── Interview state ──────────────────────────────────────────────────────────
  // null  = not in interview mode (initial state / reset)
  // 0..4  = waiting for user answer to INTERVIEW_STEPS[interviewStep]
  // 5     = all answers collected, generation in progress
  const [interviewStep, setInterviewStep] = useState<number | null>(null);
  const interviewAnswers = useRef<Record<string, string>>({}); // { goal, concepts, claims, references, images }

  // ── Legacy slot-filling fallback (only used when product/type can't be detected
  //    from the initial prompt at all and we need explicit picker UI) ──────────
  const [pendingClarification, setPendingClarification] = useState<Clarification | null>(null);

  const contextRef = useRef<string[]>([]);
  const resolvedRef = useRef<{
    product: WsbSlotOption | null;
    type: WsbSlotOption | null;
    topic: string | null;
  }>({ product: null, type: null, topic: null });
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Warm up embedding engine ────────────────────────────────────────────────
  useEffect(() => {
    import("@/lib/wsb/embeddingEngine")
      .then(({ warmUp }) => {
        const allPhrases = [
          ...PRODUCTS.flatMap((p) => p.referencePhrases),
          ...TYPES.flatMap((t) => t.referencePhrases),
          ...DOCUMENTS.flatMap((d) => d.referencePrompts),
        ];
        return warmUp(allPhrases);
      })
      .then(() => setModelReady(true))
      .catch(() => setModelReady(true));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, traceLines, result, pendingClarification, interviewStep]);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  async function pushTrace(text: string, tone: TraceLine["tone"] = "neutral", delay = 260) {
    await sleep(delay);
    setTraceLines((prev) => [...prev, { text, tone }]);
  }

  function addAiMessage(text: string) {
    setMessages((prev) => [...prev, { from: "ai", text }]);
  }

  function addUserMessage(text: string) {
    setMessages((prev) => [...prev, { from: "user", text }]);
  }

  /** Check text for unsupported products/types and show error if needed.
   *  Returns true if unsupported (caller should stop). */
  function checkAndWarnUnsupported(text: string): boolean {
    if (detectUnsupportedProduct(text)) {
      addAiMessage(UNSUPPORTED_MESSAGE);
      setBusy(false);
      setPendingClarification(null);
      setInterviewStep(null);
      return true;
    }
    if (detectUnsupportedType(text)) {
      addAiMessage(UNSUPPORTED_MESSAGE);
      setBusy(false);
      setPendingClarification(null);
      setInterviewStep(null);
      return true;
    }
    return false;
  }

  // ─── Core document resolution (unchanged from original) ─────────────────────
  async function resolveDocument() {
    const resolvedProduct = resolvedRef.current.product;
    const resolvedType = resolvedRef.current.type;

    if (!resolvedProduct || !resolvedType) return;

    await pushTrace("both slots resolved, generating draft…", "neutral", 320);
    const { document, confidence } = await matchDocument(
      contextRef.current.join(". "),
      resolvedProduct.id,
      resolvedType.id
    );
    await sleep(1000);

    const draft = buildMockWsbDraft({
      product: resolvedProduct,
      type: resolvedType,
      topic: resolvedRef.current.topic,
      prompt: contextRef.current.join(". "),
      // Pass interview answers so the generator can enrich the draft
      interviewAnswers: interviewAnswers.current,
    });

    const fallbackDocument = {
      id: "mock-wsb",
      label: draft.title,
      file: document?.file || DOCUMENTS[0]?.file || "/documents/WSB_placeholder.txt",
      product: resolvedProduct.id,
      type: resolvedType.id,
      referencePrompts: [],
      generatedDraft: draft,
    } as WsbDocument;

    const resolvedDocument = document
      ? { ...document, label: draft.title, generatedDraft: draft }
      : fallbackDocument;

    setDraftPhases(draft.phases || []);
    setPhaseIndex(0);
    addAiMessage(`Here's the WSB draft for ${draft.topic}.`);

    for (let i = 0; i < (draft.phases || []).length; i += 1) {
      await sleep(i * 1100);
      setPhaseIndex(i + 1);
    }

    setPreparing(true);
    await pushTrace("preparing WSB…", "neutral", 180);
    await sleep(10000);

    setPreparing(false);
    await pushTrace(`draft ready: ${draft.title}`, "match", 120);
    setResult({ document: resolvedDocument, confidence });
    setBusy(false);
  }

  // ─── Interview flow handler ──────────────────────────────────────────────────
  // Called when the user submits a reply during the structured interview.
  async function handleInterviewAnswer(text: string) {
    const trimmed = text.trim();
    if (!trimmed || interviewStep === null) return;

    addUserMessage(trimmed);

    // ── Guard: check for unsupported product/type at every step ─────────────
    if (checkAndWarnUnsupported(trimmed)) return;

    // Store the answer for the current step
    const currentStepDef = INTERVIEW_STEPS[interviewStep];
    interviewAnswers.current[currentStepDef.id] = trimmed;
    contextRef.current.push(trimmed);

    // Derive topic from the first answer (goal) if not yet set
    if (currentStepDef.id === "goal" && !resolvedRef.current.topic) {
      resolvedRef.current.topic = trimmed;
    }

    const nextStep = interviewStep + 1;

    if (nextStep < INTERVIEW_STEPS.length) {
      // More interview questions remain — ask the next one
      await sleep(1000);
      addAiMessage(INTERVIEW_STEPS[nextStep].aiMessage);
      setInterviewStep(nextStep);
    } else {
      // All interview questions answered — kick off generation
      setInterviewStep(null); // hide the interview input
      setBusy(true);
      setTraceLines([]);
      await sleep(400);
      addAiMessage(FINAL_AI_MESSAGE);
      await sleep(600);

      await pushTrace(
        `product: ${resolvedRef.current.product?.label ?? "Orserdu"} (confirmed)`,
        "match",
        400
      );
      await pushTrace(
        `type: ${resolvedRef.current.type?.label ?? "SFMC emailer"} (confirmed)`,
        "match",
        400
      );
      await pushTrace(`topic: ${resolvedRef.current.topic}`, "match", 400);

      await resolveDocument();
    }
  }

  // ─── Initial submit (first user message) ────────────────────────────────────
  async function handleSubmit(text: string) {
    addUserMessage(text);
    setPendingClarification(null);
    setBusy(true);
    setTraceLines([]);
    setResult(null);
    setDraftPhases([]);
    setPhaseIndex(0);
    setInterviewStep(null);
    interviewAnswers.current = {};

    // Fresh context every submission
    resolvedRef.current = { product: null, type: null, topic: null };
    contextRef.current = [text];

    // ── Guard: check unsupported before any slot detection ───────────────────
    if (checkAndWarnUnsupported(text)) return;

    await pushTrace("parsing prompt…", "neutral", 150);

    const { product, type, topic } = await detectSlots(text);
    if (product) resolvedRef.current.product = product;
    if (type) resolvedRef.current.type = type;
    if (topic) resolvedRef.current.topic = topic;

    await pushTrace(
      resolvedRef.current.product
        ? `product: ${resolvedRef.current.product.label} (${((resolvedRef.current.product.confidence ?? 0) * 100).toFixed(0)}%)`
        : "product: not specified",
      resolvedRef.current.product ? "match" : "miss"
    );
    await pushTrace(
      resolvedRef.current.type
        ? `type: ${resolvedRef.current.type.label} (${((resolvedRef.current.type.confidence ?? 0) * 100).toFixed(0)}%)`
        : "type: not specified",
      resolvedRef.current.type ? "match" : "miss"
    );
    await pushTrace(
      resolvedRef.current.topic
        ? `topic: ${resolvedRef.current.topic}`
        : "topic: not specified",
      resolvedRef.current.topic ? "match" : "miss"
    );

    // ── If product/type still missing → show legacy option pickers first ──────
    // (This handles edge cases like a completely unrelated first message)
    const resolvedProduct = resolvedRef.current.product;
    const resolvedType = resolvedRef.current.type;

    if (!resolvedProduct && !resolvedType) {
      await pushTrace("awaiting clarification…", "miss", 200);
      await sleep(300);
      addAiMessage("I need a couple of details to get started.");
      setPendingClarification({ slot: "product", options: PRODUCTS });
      setBusy(false);
      return;
    }

    if (!resolvedProduct) {
      await pushTrace("awaiting clarification…", "miss", 200);
      await sleep(300);
      setPendingClarification({ slot: "product", options: PRODUCTS });
      setBusy(false);
      return;
    }

    if (!resolvedType) {
      await pushTrace("awaiting clarification…", "miss", 200);
      await sleep(300);
      setPendingClarification({ slot: "type", options: TYPES });
      setBusy(false);
      return;
    }

    // ── Both product & type resolved → start the interview sequence ──────────
    await sleep(300);
    setBusy(false); // unlock input for interview
    addAiMessage(INTERVIEW_STEPS[0].aiMessage);
    setInterviewStep(0);
  }

  // ─── Legacy option-picker handler (slot clarification) ─────────────────────
  async function handleOptionPick(slot: "product" | "type", option: WsbSlotOption) {
    addUserMessage(option.label);
    setPendingClarification(null);
    contextRef.current.push(option.label);

    const selected = { ...option, confidence: 1.0 };
    resolvedRef.current[slot] = selected;

    // Guard: unsupported product selected
    if (slot === "product" && selected.id !== "orserdu") {
      addAiMessage(UNSUPPORTED_MESSAGE);
      setBusy(false);
      return;
    }

    if (slot === "type" && selected.id !== "sfmc") {
      addAiMessage(UNSUPPORTED_MESSAGE);
      setBusy(false);
      return;
    }

    const otherSlot = slot === "product" ? "type" : "product";
    const otherOptions = slot === "product" ? TYPES : PRODUCTS;

    if (!resolvedRef.current[otherSlot]) {
      // Still need the other slot
      setPendingClarification({ slot: otherSlot, options: otherOptions });
    } else {
      // Both slots resolved via pickers — start interview
      setBusy(false);
      addAiMessage(INTERVIEW_STEPS[0].aiMessage);
      setInterviewStep(0);
    }
  }

  // ─── Reset ───────────────────────────────────────────────────────────────────
  function handleReset() {
    setMessages([{ from: "ai", text: INTRO }]);
    setTraceLines([]);
    setResult(null);
    setPendingClarification(null);
    setDraftPhases([]);
    setPhaseIndex(0);
    setInterviewStep(null);
    interviewAnswers.current = {};
    contextRef.current = [];
    resolvedRef.current = { product: null, type: null, topic: null };
  }

  // ─── Derived UI state ────────────────────────────────────────────────────────
  // The bottom input is in "interview" mode when interviewStep is a number
  const isInterviewing = interviewStep !== null;
  // Disable input when busy OR model not ready OR waiting for an option picker
  const inputDisabled =
    busy || !modelReady || (!!pendingClarification && !isInterviewing);

  return (
    <div className="flex min-h-screen flex-col bg-paper pt-10">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
        <div className="flex-1 space-y-3 pb-24">
          {/* ── Messages ── */}
          {messages.map((m, i) => (
            <MessageBubble key={i} from={m.from}>
              {m.text}
            </MessageBubble>
          ))}

          {/* ── Trace log ── */}
          {traceLines.length > 0 && (
            <div className="pt-1">
              <TraceLog lines={traceLines} />
            </div>
          )}

          {/* ── Legacy slot option picker (product / type) ── */}
          {pendingClarification && !busy && (
            <OptionPicker
              question={SLOT_QUESTIONS[pendingClarification.slot]}
              options={pendingClarification.options}
              onPick={(opt) => handleOptionPick(pendingClarification.slot, opt)}
            />
          )}

          {/* ── Draft phases reveal ── */}
          {draftPhases.length > 0 && (
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-signal">
                Draft phases
              </p>
              <div className="mt-3 space-y-2">
                {draftPhases.slice(0, phaseIndex).map((phase) => (
                  <div key={phase.title} className="rounded-lg border border-line bg-paper p-3">
                    <p className="font-mono text-[10.5px] uppercase tracking-wider text-signal">
                      {phase.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-6 text-slate-muted">{phase.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Preparing spinner ── */}
          {preparing && (
            <div className="rounded-xl border border-line bg-white p-6">
              <LoadingSpinner message="Preparing WSB…" size="lg" />
            </div>
          )}

          {/* ── Result card ── */}
          {result && !preparing && (
            <ResultCard
              document={result.document}
              confidence={result.confidence}
              onReset={handleReset}
            />
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* ── Sticky bottom input ── */}
      <div className="sticky bottom-0 z-10 mx-auto mt-4 w-full max-w-3xl rounded-2xl border border-line/80 bg-paper/95 px-3 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        {isInterviewing ? (
          // ── Interview step input ───────────────────────────────────────────
          <div className="space-y-2">
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-signal">
              Step {interviewStep + 1} of {INTERVIEW_STEPS.length}
            </p>
            <PromptForm
              onSubmit={handleInterviewAnswer}
              disabled={busy || !modelReady}
              placeholder={getInterviewPlaceholder(interviewStep)}
              autoFocus
            />
          </div>
        ) : (
          // ── Default / initial prompt input ───────────────────────────────
          <PromptForm
            onSubmit={handleSubmit}
            disabled={inputDisabled}
            placeholder={
              !modelReady
                ? "Loading model…"
                : pendingClarification
                ? "Choose an option above…"
                : "Create WSB for an emailer…"
            }
          />
        )}
      </div>
    </div>
  );
}

// ─── Placeholder helpers ──────────────────────────────────────────────────────
function getInterviewPlaceholder(step: number): string {
  const placeholders = [
    "Describe the goal of this email…",
    "Describe the scientific or clinical concepts…",
    "List the approved claims to use…",
    "List the references to prioritize…",
    "Specify which images to include…",
  ];
  return placeholders[step] ?? "Type your answer…";
}
