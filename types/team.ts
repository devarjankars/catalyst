export type PermissionKey = "read" | "write" | "modify" | "pm" | "assetLibrary";

export interface Employee {
  id: string;
  name: string;
  permissions: Record<PermissionKey, boolean>;
}

export type TeamKey = "tech" | "creative" | "content" | "pm" | "admins";

export interface Team {
  key: TeamKey;
  label: string;
  employees: Employee[];
}
