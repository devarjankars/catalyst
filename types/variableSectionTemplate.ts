const sfmc = [
  {
    heading: "[Variable Subject Line]",
    options: [""],
    structure: "normal",
    listText: "Option",
  },
  {
    heading: "[Variable Preheader]",
    options: [""],
    structure: "normal",
    listText: "Option",
  },
  {
    heading: "[Variable Friendly from and from email address]",
    options: [
      {
        fromEmail: "noreply@clinicalupdates.stemline.com",
        friendlyNames: [
          "Stemline Clinical Insights",
          "Stemline Clinical Updates",
          "Clinical Updates by Stemline",
          "Stemline Info",
          "Stemline Therapeutics",
        ],
      },
      {
        fromEmail: "noreply@hcpupdates.stemline.com",
        friendlyNames: [
          "Stemline Healthcare Professional Updates",
          "HCP Updates by Stemline",
          "HCP Insights from Stemline",
          "Stemline Info",
          "Stemline Therapeutics",
        ],
      },
      {
        fromEmail: "noreply@updates.stemline.com",
        friendlyNames: [
          "Stemline Updates",
          "Latest from Stemline",
          "Insights by Stemline",
          "Stemline Info",
          "Stemline Therapeutics",
        ],
      },
    ],
    structure: "table",
    listText: null,
  },
  {
    heading: "[Variable Header image]",
    options: [""],
    structure: "normal",
    listText: "Option",
  },
];

const RTE = [
  {
    heading: "[Variable Subject Line]",
    options: [""],
    structure: "normal",
    listText: "Option",
  },
  {
    heading: "[Variable Preheader]",
    options: [""],
    structure: "normal",
    listText: "Option",
  },
  {
    heading: "[Variable Title]",
    options: ["Dr.", "Mr.", "Mrs.", "Ms.", "Mx."],
    structure: "normal",
    listText: "TITLE",
  },
  {
    heading: "[Variable Introduction Options]",
    options: [
      "I'm sorry I missed you.",
      "Thank you for the opportunity to discuss ORSERDU(R).",
      "Iˇm glad we can follow up on our last conversation.",
      "I have the information you requested.",
      "I've been trying to reach you.",
      "Iˇve been looking forward to our conversation.",
      "I hope you are doing well. I am your ORSERDU(R) representative.",
    ],
    structure: "normal",
    listText: "INTRODUCTION",
  },
  {
    heading: "[Variable Meeting Invite]",
    options: [
      "Can we schedule a time to discuss how ORSERDU(R) can help your patients?",
      "I can provide more information about ORSERDU(R) when youˇre available.",
      "Iˇd appreciate the opportunity to discuss more about ORSERDU(R).",
      "Iˇm looking forward to speaking with you again.",
      "When would be a good time to continue our discussion?",
      "Please let me know your availability for a follow-up call.",
      "I look forward to discussing how ORSERDU(R) can help your patients.",
      "[No message]",
    ],
    structure: "normal",
     listText: "INVITE",
  },
  {
    heading: "[Variable Closing]",
    options: ["Regards,", "Sincerely,", "Thank you,", "Best,"],
    structure: "normal",
    listText: "CLOSING",
  },
];

const TPE = [
  {
    heading: "[Variable Subject Line]",
    options: [""],
    structure: "normal",
    listText: "Option",
  },
  {
    heading: "[Variable Preheader]",
    options: [""],
    structure: "normal",
    listText: "Option",
  },
  {
    heading: "extenal placeholder",
    options: [""],
    structure: "third-party-placeholder",
    listText: null,
  },
  {
    heading: "[Variable Header image]",
    options: [""],
    structure: "normal",
    listText: "Option",
  },
];

const categoryMap = { rte: RTE, sfmc: sfmc, tpe: TPE };

export function getVaribleCopyTemplate(emailCategory: string) {
  return categoryMap[emailCategory];
}
