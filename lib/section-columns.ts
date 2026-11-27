import type { EmailComponent } from "@/types/email-builder";

export function getSectionColumns(section: EmailComponent): EmailComponent[] {
  const children = (section.children ?? []).filter(Boolean);
  return !section.isColumn && children.length && children.every(child => child.isColumn)
    ? children
    : [section];
}

export function newSectionColumn(section: EmailComponent, children: EmailComponent[] = []): EmailComponent {
  return {
    id: globalThis.crypto?.randomUUID?.() ??
      `section-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    type: "section",
    category: section.category,
    logoA: section.logoA,
    logoB: section.logoB,
    isColumn: true,
    children,
  };
}

export function resizeSectionColumns(section: EmailComponent, count: number): Partial<EmailComponent> {
  const existing = getSectionColumns(section);
  if (!Number.isInteger(count) || count < 1 || count > 6 || existing.length === count) return {};
  const columns = existing[0] === section
    ? [{
      ...newSectionColumn(section, (section.children ?? []).filter(Boolean)),
      columnWidth: section.columnWidth,
      columnAlignment: section.columnAlignment,
      columnVerticalAlignment: section.columnVerticalAlignment,
    }]
    : existing;

  const retained = columns.slice(0, count);
  const last = retained[retained.length - 1];
  if (last && columns.length > count) {
    retained[retained.length - 1] = {
      ...last,
      children: [...(last.children ?? []), ...columns.slice(count).flatMap(column => column.children ?? [])],
    };
  }
  while (retained.length < count) retained.push(newSectionColumn(section));

  const equalBefore = columns.every(column => {
    const width = column.columnWidth?.trim().toLowerCase();
    return !width || width === "auto" ||
      (width.endsWith("%") && Math.abs(Number.parseFloat(width) - 100 / columns.length) < 0.1);
  });
  return {
    columns: count,
    direction: existing[0] === section ? "row" : section.direction ?? "row",
    children: equalBefore ? retained.map(column => ({ ...column, columnWidth: "" })) : retained,
  };
}
