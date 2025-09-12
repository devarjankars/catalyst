"use client"

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, ShieldCheck, ShieldHalf, Users2, Settings2 , Plus } from "lucide-react";
import TeamPanel from "@/components/team-panel";
import { Button } from "@/components/ui/button";
import { AdduserDialog } from "@/components/add-user-dialog";

// -----------------------------
// Types
// -----------------------------

export type PermissionKey = "read" | "write" | "modify" | "pm" | "assetLibrary";

export type Employee = {
  id: string;
  name: string;
  permissions: Record<PermissionKey, boolean>;
};

export type TeamKey = "tech" | "creative" | "content" | "pm" | "admins";

export type Team = {
  key: TeamKey;
  label: string;
  employees: Employee[];
};


const initialTeams: Team[] = [
  {
    key: "tech",
    label: "Tech",
    employees: [
      { id: "Med-101", name: "Bharath kumar", permissions: { read: true, write: true, modify: true, pm: false, assetLibrary: false } },
      { id: "Med-102", name: "Darshan", permissions: { read: true, write: false, modify: false, pm: false, assetLibrary: false } },
      { id: "Med-103", name: "Abhishek", permissions: { read: true, write: true, modify: false, pm: false, assetLibrary: false } },
    ],
  },
  {
    key: "creative",
    label: "Creative",
    employees: [
      { id: "Med-201", name: "Arun H", permissions: { read: true, write: true, modify: true, pm: false, assetLibrary: true } },
      { id: "Med-202", name: "Sunil K", permissions: { read: true, write: true, modify: true, pm: false, assetLibrary: true } },
      { id: "Med-203", name: "Suresh W", permissions: { read: true, write: true, modify: true, pm: false, assetLibrary: true } },
    ],
  },
  {
    key: "content",
    label: "Content",
    employees: [
      { id: "Med-301", name: "Rajesh", permissions: { read: true, write: false, modify: true, pm: false, assetLibrary: false } },
      { id: "Med-302", name: "Shubha", permissions: { read: true, write: false, modify: true, pm: false, assetLibrary: false } },
      { id: "Med-303", name: "Maithri", permissions: { read: true, write: false, modify: true, pm: false, assetLibrary: false } },
    ],
  },
  {
    key: "pm",
    label: "PM",
    employees: [
      { id: "Med-401", name: "Karishma", permissions: { read: true, write: false, modify: false, pm: true, assetLibrary: true } },
      { id: "Med-402", name: "Vishwanath", permissions: { read: true, write: false, modify: false, pm: true, assetLibrary: true } },
    ],
  },
  {
    key: "admins",
    label: "Admins",
    employees: [
      { id: "Med-501", name: "Stalin B", permissions: { read: true, write: true, modify: true, pm: true, assetLibrary: true } },
      { id: "Med-502", name: "Shijin P", permissions: { read: true, write: false, modify: false, pm: true, assetLibrary: false } },
    ],
  },
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

// -----------------------------
// Main Dashboard
// -----------------------------

export default function AdminPermissionsDashboard() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [activeTab, setActiveTab] = useState<TeamKey>("tech");
  const [open , setOpen] = useState(false)
  
  function onConfirm() {

  }
  function onCancel(){
    setOpen(false)
  }
  const updateTeam = (updated: Team) => {
    setTeams((prev) => prev.map((t) => (t.key === updated.key ? updated : t)));
  };

  const applyTeam = (team: Team) => {
    // Replace with API call 
    toast.success(`${team.label} permissions saved`, { description: `${team.employees.length} records updated.` });
    console.log(teams)
  };

  return (
  <div className="h-full w-full bg-gray-50 grid grid-rows-[auto 1fr]">
  <header className="sticky top-0 z-0 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-slate-200 shadow-sm">
    <div className="mx-auto px-4 py-3 flex items-center justify-between gap-3">
      {/* <div className=""> */}
        <div className="flex items-center justify-start gap-2 ">
          <div className="h-9 w-9 rounded-2xl bg-indigo-100 flex place-items-center justify-center">
               <Settings2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="">
              <h1 className="text-lg font-semibold leading-tight text-slate-800">
            Admin Dashboard — Dragcraft
          </h1>
          <p className="text-xs text-slate-600">Manage permissions across teams.</p>
          </div>
           
        </div>
        <div>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>
      {/* </div> */}
    </div>
  </header>

  <main className="mx-auto w-full p-4 space-y-4">
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-800">Teams & Permissions</h2>
            <p className="text-sm text-slate-600 max-w-prose">
              Configure access for each employee.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 gap-1">
              <ShieldCheck className="h-3 w-3" /> Role-based
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>

    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TeamKey)} className="space-y-4">
      <TabsList className="grid w-full grid-cols-5 rounded-md border border-slate-200 bg-slate-100 p-1">
        {teams.map((t) => (
          <TabsTrigger
            key={t.key}
            value={t.key}
            className="gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
          >
            {iconForTeam(t.key)} {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {teams.map((t) => (
        <TabsContent key={t.key} value={t.key} className="space-y-4">
          <TeamPanel team={t} onApply={applyTeam} onUpdateTeam={updateTeam} />
        </TabsContent>
      ))}
    </Tabs>
  </main>
    <AdduserDialog open={open} onConfirm={onConfirm} onCancel={onCancel}/>
</div>

  );
}

