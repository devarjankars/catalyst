"use client"

import React, { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Shield, ShieldCheck, ShieldHalf, Users2, Search, Settings2, Save, ListFilter, ChevronDown } from "lucide-react";
import type { PermissionKey , Employee , TeamKey , Team } from "@/types/team";

const PERMISSION_COLUMNS: { key: PermissionKey; label: string }[] = [
  { key: "read", label: "Read" },
  { key: "write", label: "Write" },
  { key: "modify", label: "Modify" },
  { key: "pm", label: "Project Magement" },
  { key: "assetLibrary", label: "Asset Library" },
];

const iconForTeam = (team: TeamKey) => {
  switch (team) {
    case "admins":
      return <Shield className="h-4 w-4" />;
    case "pm":
      return <ShieldHalf className="h-4 w-4" />;
    default:
      return <Users2 className="h-4 w-4" />;
  }
};

export default function TeamPanel({
  team,
  onApply,
  onUpdateTeam,
}: {
  team: Team;
  onApply: (team: Team) => void;
  onUpdateTeam: (team: Team) => void;
}) {
  const [query, setQuery] = useState("");
  const [localTeam, setLocalTeam] = useState<Team>(() => JSON.parse(JSON.stringify(team)));
  const [dirty, setDirty] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return localTeam.employees;
    return localTeam.employees.filter((e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));
  }, [localTeam.employees, query]);

  const toggleAll = (key: PermissionKey, value: boolean) => {
    setLocalTeam((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => ({ ...e, permissions: { ...e.permissions, [key]: value } })),
    }));
    setDirty(true);
  };

  const toggleRow = (id: string, key: PermissionKey, value: boolean) => {
    setLocalTeam((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => {
        if (e.id !== id) return e;
        const next = { ...e.permissions, [key]: value };
        // If Admin is toggled ON, enable everything; if toggled OFF, keep others as is.
        // if (key === "admin" && value) {
        //   PERMISSION_COLUMNS.forEach((c) => (next[c.key] = true));
        // }
        return { ...e, permissions: next };
      }),
    }));
    setDirty(true);
  };

  const allCheckedState = (key: PermissionKey): boolean | "indeterminate" => {
    const total = localTeam.employees.length;
    const checked = localTeam.employees.filter((e) => e.permissions[key]).length;
    if (checked === 0) return false;
    if (checked === total) return true;
    return "indeterminate";
  };

  const resetChanges = () => {
    setLocalTeam(JSON.parse(JSON.stringify(team)));
    setDirty(false);
  };

  const apply = () => {
    onUpdateTeam(localTeam);
    onApply(localTeam);
    setDirty(false);
  };

  return (
    <Card className="border border-slate-200 shadow-lg bg-white rounded-2xl">
  <CardHeader className="pb-2 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
          {iconForTeam(team.key)}
          {team.label} Team
          {dirty ? (
            <Badge className="ml-1 bg-amber-100 text-amber-700">Unsaved</Badge>
          ) : (
            <Badge variant="outline" className="ml-1 text-slate-600 border-slate-300">Up to date</Badge>
          )}
        </CardTitle>
        <CardDescription className="text-slate-600">
          Assign and manage permissions for this team.
        </CardDescription>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by ID or name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 w-[240px] border-slate-300 focus-visible:ring-indigo-500"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100">
              <ListFilter className="h-4 w-4" /> Quick actions <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200 shadow-lg">
            <DropdownMenuLabel className="text-slate-700">Bulk permissions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toggleAll("read", true)}>Grant Read to all</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleAll("write", true)}>Grant Write to all</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleAll("modify", true)}>Grant Modify to all</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleAll("assetLibrary", true)}>Grant Asset Library to all</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { resetChanges(); }} className="text-rose-600">
              Reset local changes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </CardHeader>

  <CardContent className="pt-4">
    <div className="rounded-2xl border border-slate-200 bg-white">
      {/* Header row */}
      <div className="grid grid-cols-[120px_1fr_repeat(5,120px)] items-center gap-3 px-3 py-3 border-b border-slate-200 sticky top-0 bg-slate-50 rounded-t-2xl z-10">
        <div className="text-[11px] uppercase tracking-wider text-slate-600">Emp ID</div>
        <div className="text-[11px] uppercase tracking-wider text-slate-600">Name</div>
        {PERMISSION_COLUMNS.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-600">{label}</div>
            <Checkbox
              checked={allCheckedState(key) === true}
              onCheckedChange={(v) => toggleAll(key, Boolean(v))}
              aria-label={`Toggle all ${label}`}
              ref={(el) => {
                if (el) {
                  const state = allCheckedState(key);
                  (el as unknown as HTMLInputElement).indeterminate = state === "indeterminate";
                }
              }}
              className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
          </div>
        ))}
      </div>

      {/* Body */}
      <ScrollArea className="min-h-[150px] max-h-[420px]">
        <div className="divide-y divide-slate-200">
          {filtered.map((emp) => (
            <EmployeeRow key={emp.id} employee={emp} onToggle={toggleRow} />
          ))}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-slate-600">No employees match your search.</div>
          )}
        </div>
      </ScrollArea>

      <Separator />

      <div className="flex items-center justify-end p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetChanges} className="border-slate-300 text-slate-700 hover:bg-slate-100">
            Reset
          </Button>
          <Button onClick={apply} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Save className="h-4 w-4" /> Apply Changes
          </Button>
        </div>
      </div>
    </div>
  </CardContent>
</Card>

  );
}

function EmployeeRow({
  employee,
  onToggle,
}: {
  employee: Employee;
  onToggle: (id: string, key: PermissionKey, value: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr_repeat(5,120px)] items-center gap-3 px-3 py-2 hover:bg-muted/40">
      <div className="text-xs text-gray-700">{employee.id}</div>
      <div className="text-sm font-medium truncate">{employee.name}</div>
      {PERMISSION_COLUMNS.map(({ key }) => (
        <div key={key} className="flex justify-center">
          <Checkbox
            checked={employee.permissions[key]}
            onCheckedChange={(v) => onToggle(employee.id, key, Boolean(v))}
            aria-label={`${key} for ${employee.name}`}
          />
        </div>
      ))}
    </div>
  );
}