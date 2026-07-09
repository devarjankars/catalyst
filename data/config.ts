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
    file: "/wsb/MAT-US-ELA-00596-v2_SFMC_The ORSERDU patient (Dr Yan).docx",
    product: "orserdu",
    type: "sfmc",
    description : "This emailer features Dr. Fengting Yan’s perspective on identifying the eligible patients for ORSERDU following progression on ET + CDK4/6i.",
    referencePrompts: [
      "This email highlights Dr. Fengting Yan's approach to determining ORSERDU eligibility for patients who have experienced disease progression following ET + CDK4/6i treatment.",
      "In this communication, Dr. Fengting Yan shares clinical insights on selecting appropriate candidates for ORSERDU therapy after they have progressed on endocrine therapy and a CDK4/6 inhibitor.",
      "Read Dr. Fengting Yan’s viewpoint in this emailer, which details the criteria for identifying patients who qualify for ORSERDU subsequent to progression on ET plus CDK4/6i.",
      "This email features expert guidance from Dr. Fengting Yan on how to pinpoint the right patients for ORSERDU once their condition has advanced past ET + CDK4/6i regimens.",
      "This emailer features Dr. Fengting Yan’s perspective on identifying the eligible patients for ORSERDU following progression on ET + CDK4/6i."
    ],
  },
  {
    id: "doc-elzonris-rte",
    label: "Orserdu — SFMC Work Statement Brief",
    file: "/wsb/MAT-US-ELA-00597-v2_SFMC_email_Treatment-Algorithm.docx",
    product: "elzonris",
    type: "sfmc",
    description : "This emailer focuses on the treatment algorithm for ORSERDU and the NCCN Guidelines' recommendations on treatment options for patients with ESR1-mutated, ER+/HER2- mBC following progression on ET + CDK4/6i.",
    referencePrompts: [
      "This communication outlines the ORSERDU clinical pathway and highlights current NCCN Guidelines for managing ESR1-mutated, ER+/HER2- metastatic breast cancer after progression on endocrine therapy combined with a CDK4/6 inhibitor.",
      "Inside this emailer, discover how the NCCN Guidelines recommend structuring treatment choices and utilizing the ORSERDU therapeutic algorithm for patients with ER+/HER2-, ESR1-mutated mBC who have progressed past ET + CDK4/6i.",
      "This email breaks down the treatment protocol for ORSERDU, detailing the specific NCCN recommendations for choosing subsequent therapies in ER+/HER2- mBC patients harboring ESR1 mutations following an ET + CDK4/6i regimen.",
      "Review the established ORSERDU treatment algorithm and NCCN Guideline recommendations featured in this email, designed for treating ESR1-mutated, ER+/HER2- mBC when a patient's disease advances during or after ET + CDK4/6i therapy.",
      "This emailer focuses on the treatment algorithm for ORSERDU and the NCCN Guidelines' recommendations on treatment options for patients with ESR1-mutated, ER+/HER2- mBC following progression on ET + CDK4/6i."
    ],
  },
  {
    id: "doc-orserdu-other",
    label: "Orserdu — SFMC Work Statement Brief",
    file: "/wsb/MAT-US-ELA-00626-v2_SFMC_email_ORSERDU vs. Fulvestrant.docx",
    product: "orserdu",
    type: "sfmc",
    description : "This emailer highlights the efficacy of ORSERDU in the EMERALD trial compared with the investigator’s choice of endocrine therapy. It also discusses the MoD and the MoA of ORSERDU.",
    referencePrompts: [
      "This communication emphasizes ORSERDU’s effectiveness as demonstrated in the EMERALD clinical study when evaluated against investigator-selected endocrine treatments, while additionally detailing its mechanism of disease (MoD) and mechanism of action (MoA)",
      "Within this email, we examine the comparative efficacy of ORSERDU versus the investigator's choice of standard endocrine therapy from the EMERALD trial, alongside an overview of the drug's MoD and MoA.",
      "This emailer reviews the therapeutic performance of ORSERDU in the EMERALD trial relative to standard-of-care endocrine therapies, and further explores the fundamental MoD and MoA of the medication.",
      "Focusing on the EMERALD trial data, this message contrasts the clinical efficacy of ORSERDU with the investigator-chosen endocrine therapy, while also breaking down the treatment's underlying mechanisms (MoD and MoA).",
      "This emailer highlights the efficacy of ORSERDU in the EMERALD trial compared with the investigator’s choice of endocrine therapy. It also discusses the MoD and the MoA of ORSERDU."
    ],
  },
];

export const MIN_DOCUMENT_MATCH_CONFIDENCE = 0.4;
