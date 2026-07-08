"use client";

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const INTRO =
  "Tell me what you need — for example, \u201ccreate a WSB for an Orserdu SFMC emailer.\u201d";

// Question labels shown above the option pills
const SLOT_QUESTIONS = {
  product: "Which product is this for?",
  type: "What type of email is this?",
  topic: "What topic should the emailer focus on?",
};

export default function Wsb() {
  const [messages, setMessages] = useState([{ from: "ai", text: INTRO }]);
  const [busy, setBusy] = useState(false);
  const [traceLines, setTraceLines] = useState([]);
  const [result, setResult] = useState(null);
  const [modelReady, setModelReady] = useState(false);
  const [draftPhases, setDraftPhases] = useState([]);
  const [phaseIndex, setPhaseIndex] = useState(0);

  // When not null: { slot: "product"|"type"|"topic" } — renders either
  // the option picker or a freeform topic prompt.
  const [pendingClarification, setPendingClarification] = useState(null);

  const contextRef = useRef([]);
  const resolvedRef = useRef({ product: null, type: null, topic: null });
  const bottomRef = useRef(null);

  useEffect(() => {
    import("@/lib/wsb/embeddingEngine.ts")
      .then(({ warmUp }) => {
        const allPhrases = [
          ...PRODUCTS.flatMap((p) => p.referencePhrases),
          ...TYPES.flatMap((t) => t.referencePhrases),
          ...DOCUMENTS.flatMap((d) => d.description),
        ];
        return warmUp(allPhrases);
      })
      .then(() => setModelReady(true))
      .catch((err) => {
        console.error("Failed to initialize embedding engine:", err);
        setModelReady(true);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, traceLines, result, pendingClarification]);

  async function pushTrace(text, tone = "neutral", delay = 260) {
    await sleep(delay);
    setTraceLines((prev) => [...prev, { text, tone }]);
  }

  // ─── Core document resolution (called once both slots are filled) ──────────
  async function resolveDocument() {
    const resolvedProduct = resolvedRef.current.product;
    const resolvedType = resolvedRef.current.type;

    await pushTrace("both slots resolved, generating draft…", "neutral", 320);
    const { document, confidence } = await matchDocument(
      contextRef.current.join(". "),
      resolvedProduct.id,
      resolvedType.id
    );
    await sleep(600);

    const draft = buildMockWsbDraft({
      product: resolvedProduct,
      type: resolvedType,
      topic: resolvedRef.current.topic,
      prompt: contextRef.current.join(". "),
    });

    const fallbackDocument = {
      id: "mock-wsb",
      label: draft.title,
      file: document?.file || DOCUMENTS[0]?.file || "/documents/WSB_placeholder.txt",
      generatedDraft: draft,
    };

    const resolvedDocument = document
      ? { ...document, label: draft.title, generatedDraft: draft }
      : fallbackDocument;

    setDraftPhases(draft.phases || []);
    setPhaseIndex(0);
    setMessages((prev) => [
      ...prev,
      { from: "ai", text: `Here's the WSB draft for ${draft.topic}.` },
    ]);

    for (let i = 0; i < (draft.phases || []).length; i += 1) {
      await sleep(1100);
      setPhaseIndex(i + 1);
    }

    await pushTrace(`draft ready: ${draft.title}`, "match", 180);
    setResult({ document: resolvedDocument, confidence });
    setBusy(false);
  }

  // ─── Called when the user clicks an option pill ───────────────────────────
  async function handleOptionPick(slot, option) {
    // Record user's choice as a message
    setMessages((prev) => [...prev, { from: "user", text: option.label }]);
    setPendingClarification(null);

    // Push the chosen label into cumulative context so document matching
    // has the keyword available (important for the Jaccard fallback scorer)
    contextRef.current.push(option.label);

    // Store in resolved ref
    resolvedRef.current[slot] = { ...option, confidence: 1.0 };

    // Check if the other slot is still missing
    const otherSlot = slot === "product" ? "type" : "product";
    const otherOptions = slot === "product" ? TYPES : PRODUCTS;

    if (!resolvedRef.current[otherSlot]) {
      // Ask for the other slot via option picker
      setPendingClarification({ slot: otherSlot, options: otherOptions });
    } else if (!resolvedRef.current.topic) {
      setPendingClarification({ slot: "topic" });
    } else {
      // Both resolved — proceed to document match
      setBusy(true);
      setTraceLines([]);
      await pushTrace(
        `product: ${resolvedRef.current.product.label} (confirmed)`,
        "match",
        100
      );
      await pushTrace(
        `type: ${resolvedRef.current.type.label} (confirmed)`,
        "match",
        100
      );
      await resolveDocument();
    }
  }

  // ─── Main submit handler ──────────────────────────────────────────────────
  async function handleSubmit(text) {
    setMessages((prev) => [...prev, { from: "user", text }]);
    setPendingClarification(null);
    setBusy(true);
    setTraceLines([]);
    setResult(null);
    setDraftPhases([]);
    setPhaseIndex(0);

    // Always start fresh — slot-filling is now via button clicks, so every
    // text submission is a brand-new intent, not a multi-turn continuation.
    resolvedRef.current = { product: null, type: null, topic: null };
    contextRef.current = [text];
    const cumulativeText = text;

    await pushTrace("parsing prompt…", "neutral", 150);

    const { product, type, topic } = await detectSlots(cumulativeText);
    if (product && !resolvedRef.current.product) resolvedRef.current.product = product;
    if (type && !resolvedRef.current.type) resolvedRef.current.type = type;
    if (topic && !resolvedRef.current.topic) resolvedRef.current.topic = topic;

    const resolvedProduct = resolvedRef.current.product;
    const resolvedType = resolvedRef.current.type;

    await pushTrace(
      resolvedProduct
        ? `product: ${resolvedProduct.label} (${(resolvedProduct.confidence * 100).toFixed(0)}%)`
        : "product: not specified",
      resolvedProduct ? "match" : "miss"
    );
    await pushTrace(
      resolvedType
        ? `type: ${resolvedType.label} (${(resolvedType.confidence * 100).toFixed(0)}%)`
        : "type: not specified",
      resolvedType ? "match" : "miss"
    );
    await pushTrace(
      resolvedRef.current.topic
        ? `topic: ${resolvedRef.current.topic}`
        : "topic: not specified",
      resolvedRef.current.topic ? "match" : "miss"
    );

    // ── Both missing ─────────────────────────────────────────────────────────
    if (!resolvedProduct && !resolvedType) {
      await pushTrace("awaiting clarification…", "miss", 200);
      await sleep(300);
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: "I need a couple of details to get started." },
      ]);
      setPendingClarification({ slot: "product", options: PRODUCTS });
      setBusy(false);
      return;
    }

    // ── Only product missing ──────────────────────────────────────────────────
    if (!resolvedProduct) {
      await pushTrace("awaiting clarification…", "miss", 200);
      await sleep(300);
      setPendingClarification({ slot: "product", options: PRODUCTS });
      setBusy(false);
      return;
    }

    // ── Only type missing ─────────────────────────────────────────────────────
    if (!resolvedType) {
      await pushTrace("awaiting clarification…", "miss", 200);
      await sleep(300);
      setPendingClarification({ slot: "type", options: TYPES });
      setBusy(false);
      return;
    }

    // ── Topic missing — ask for it before generating ───────────────────────
    if (!resolvedRef.current.topic) {
      await pushTrace("awaiting topic clarification…", "miss", 200);
      await sleep(300);
      setPendingClarification({ slot: "topic" });
      setBusy(false);
      return;
    }

    // ── All resolved — match the document ────────────────────────────────────
    await resolveDocument();
  }

  async function handleTopicSubmit(topicText) {
    const trimmedTopic = topicText.trim();
    if (!trimmedTopic) return;

    setMessages((prev) => [...prev, { from: "user", text: trimmedTopic }]);
    setPendingClarification(null);
    setBusy(true);
    setTraceLines([]);
    contextRef.current.push(trimmedTopic);
    resolvedRef.current.topic = trimmedTopic;

    await pushTrace(`topic: ${trimmedTopic} (confirmed)`, "match", 120);
    await resolveDocument();
  }

  function handleReset() {
    setMessages([{ from: "ai", text: INTRO }]);
    setTraceLines([]);
    setResult(null);
    setPendingClarification(null);
    setDraftPhases([]);
    setPhaseIndex(0);
    contextRef.current = [];
    resolvedRef.current = { product: null, type: null, topic: null };
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
        <div className="flex-1 space-y-3 pb-24">
          {messages.map((m, i) => (
            <MessageBubble key={i} from={m.from}>
              {m.text}
            </MessageBubble>
          ))}

          {traceLines.length > 0 && (
            <div className="pt-1">
              <TraceLog lines={traceLines} />
            </div>
          )}

          {/* Interactive option picker — shown instead of text clarification */}
          {pendingClarification && !busy && pendingClarification.slot !== "topic" && (
            <OptionPicker
              question={SLOT_QUESTIONS[pendingClarification.slot]}
              options={pendingClarification.options}
              onPick={(opt) => handleOptionPick(pendingClarification.slot, opt)}
            />
          )}

        

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

          {result && (
            <ResultCard
              document={result.document}
              confidence={result.confidence}
              onReset={handleReset}
            />
          )}

          <div ref={bottomRef} />
        </div>

     
      </main>
        <div className="sticky bottom-0 z-10 mx-auto mt-4 w-full max-w-3xl rounded-2xl border border-line/80 bg-paper/95 px-3 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          {pendingClarification && pendingClarification.slot === "topic" ? (
            <div className="space-y-2">
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-signal">
                Please enter the topic for the emailer (e.g., "new patient education launch")
              </p>
              <PromptForm
                onSubmit={handleTopicSubmit}
                disabled={busy || !modelReady}
                placeholder="Type the topic here, for example: new patient education launch"
                autoFocus={true}
              />
            </div>
          ) : (
            <PromptForm
              onSubmit={handleSubmit}
              disabled={busy || !modelReady || !!pendingClarification}
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
