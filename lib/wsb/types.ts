export type SlotKey = "product" | "type" | "topic";

export interface WsbSlotOption {
  id: string;
  label: string;
  referencePhrases?: string[];
  confidence?: number;
}

export interface SlotResolution {
  product: WsbSlotOption | null;
  type: WsbSlotOption | null;
  topic: string | null;
}

export interface WsbDocument {
  id: string;
  label: string;
  file: string;
  product: string;
  type: string;
  description?: string;
  referencePrompts: string[];
  generatedDraft?: WsbDraft;
}

export interface WsbDraftPhase {
  title: string;
  copy: string;
}

export interface WsbDraft {
  title: string;
  topic: string;
  summary: string;
  phases: WsbDraftPhase[];
}

export interface WsbDraftInput {
  product: WsbSlotOption | null;
  type: WsbSlotOption | null;
  topic: string | null;
  prompt?: string;
  interviewAnswers?: Record<string, string>;
}

export interface TraceLine {
  text: string;
  tone: "neutral" | "match" | "miss";
}

export interface ChatMessage {
  from: "ai" | "user";
  text: string;
}

export interface Clarification {
  slot: Exclude<SlotKey, "topic">;
  options: WsbSlotOption[];
}

export interface MatchResult {
  document: WsbDocument | null;
  confidence: number;
}

export interface WsbResult {
  document: WsbDocument;
  confidence: number;
}
