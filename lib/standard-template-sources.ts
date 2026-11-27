import type { EmailTemplate } from "@/types/template";

const standardSources = [
  { category: "rte", name: "RTE Standard Template", source: "Creative_feedback_Test_Pratiksha (Copy)" },
  { category: "sfmc", name: "SFMC Standard Template", source: "MAT-US-ELA-00625-v4_SFMC-email_Heritage-Message_Demo_Ronald (Copy)" },
] as const;

export const STANDARD_SOURCE_ID_PREFIX = "standard-source-";

export function applyStandardTemplateSources(templates: EmailTemplate[]): EmailTemplate[] {
  let result = templates;

  for (const { category, name, source } of standardSources) {
    const matches = templates.filter(template => template.name.trim() === source);
    if (matches.length !== 1) continue;
    const [draft] = matches;
    if (!draft.brand || !draft.components?.some(Boolean)) continue;

    const replacement: EmailTemplate = {
      ...draft,
      id: STANDARD_SOURCE_ID_PREFIX + draft.id,
      name,
      category,
      isUserCreated: false,
    };
    const canonicalNames = new Set([name.toLowerCase(), `${draft.brand} ${category}`, `${draft.brand}_${category}`]);
    if (category === "rte") {
      canonicalNames.add("standard template");
      canonicalNames.add("standard templet");
    }
    result = [
      ...result.filter(template =>
        template.isUserCreated || template.brand !== draft.brand || template.category !== category ||
        !canonicalNames.has(template.name.trim().toLowerCase())),

      replacement,
    ];
  }

  return result;
}
