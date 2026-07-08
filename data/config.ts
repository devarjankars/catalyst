// -----------------------------------------------------------------------
// This file is the single place that defines the "knowledge" behind the
// demo. Swap file paths, reference phrases, and prompts here — nothing
// else in the app needs to change.
// -----------------------------------------------------------------------

// Required slots. A prompt must resolve one option from each group before
// a document can be generated.
export const PRODUCTS = [
  {
    id: "orserdu",
    label: "Orserdu",
    referencePhrases: [
      "orserdu",
      "elacestrant",
      "ER-positive HER2-negative breast cancer treatment",
      "advanced breast cancer emailer",
    ],
  },
  {
    id: "elzonris",
    label: "Elzonris",
    referencePhrases: [
      "elzonris",
      "tagraxofusp",
      "BPDCN treatment",
      "blastic plasmacytoid dendritic cell neoplasm emailer",
    ],
  },
];

export const TYPES = [
  {
    id: "sfmc",
    label: "SFMC",
    referencePhrases: [
      "sfmc",
      "salesforce marketing cloud",
      "sfmc email template",
      "build in salesforce marketing cloud",
    ],
  },
  {
    id: "rte",
    label: "RTE",
    referencePhrases: [
      "rte",
      "real time email",
      "rich text email",
      "rte template",
    ],
  },
  {
    id: "other",
    label: "Other",
    referencePhrases: [
      "generic html email",
      "other email type",
      "standard email template",
      "non-sfmc non-rte template",
    ],
  },
];

// Minimum cosine similarity required to accept a slot match. Below this,
// the slot is treated as "not specified."
export const SLOT_CONFIDENCE_THRESHOLD = 0.42;

// The three static documents. Once product + type are both resolved, the
// prompt is matched against these reference prompts to pick a file.
// Swap `file` for real WSB documents in /public/documents when ready.
export const DOCUMENTS = [
  {
    id: "doc-orserdu-sfmc",
    label: "Orserdu — SFMC Work Statement Brief",
    file: "/documents/WSB_Orserdu_SFMC_placeholder.txt",
    product: "orserdu",
    type: "sfmc",
    description : "This emailer highlights the efficacy of ORSERDU in the EMERALD trial compared with the investigator’s choice of endocrine therapy. It also discusses the MoD and the MoA of ORSERDU",
    referencePrompts: [
      "create a wsb for an orserdu sfmc emailer",
      "orserdu email built in salesforce marketing cloud",
      "generate work statement brief orserdu sfmc",
    ],
  },
  {
    id: "doc-elzonris-rte",
    label: "Elzonris — RTE Work Statement Brief",
    file: "/documents/WSB_Elzonris_RTE_placeholder.txt",
    product: "elzonris",
    type: "rte",
    referencePrompts: [
      "create a wsb for an elzonris rte emailer",
      "elzonris real time email work statement",
      "generate work statement brief elzonris rte",
    ],
  },
  {
    id: "doc-orserdu-other",
    label: "Orserdu — Standard Work Statement Brief",
    file: "/documents/WSB_Orserdu_Other_placeholder.txt",
    product: "orserdu",
    type: "other",
    referencePrompts: [
      "create a wsb for a standard orserdu emailer",
      "orserdu generic html email work statement",
      "generate work statement brief orserdu other",
    ],
  },
];

export const MIN_DOCUMENT_MATCH_CONFIDENCE = 0.4;
