import type { Team } from "@/types/team";

export const initialTeams: Team[] = [
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