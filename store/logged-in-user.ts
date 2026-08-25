import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

// ---- Store ----
interface LoggedInUserStore {
  userEmail: string | null;
  userpassword: string | null;
  userId: string | null;
  userRole: string | null;
  userPermissions: string[] | null;
  loginUser: (
    email: string,
    password: string,
    id: string,
    role: string,
    permissions: string[]
  ) => void;
  hydrate: (data: {
    userEmail: string | null;
    userpassword: string | null;
    userId?: string | null;
    userRole?: string | null;
    userPermissions?: string[] | null;
  }) => void;
  logoutUser: () => void;
  tasksAssigned: string[] | null;
  setTasksAssigned: (tasks: string[]) => void;
  recentTask: object | null;
  setRecentTask: (task: object) => void;
}

export const useLoggedInUserStore = create<LoggedInUserStore>()(
  devtools(
      (set, get) => ({
        userEmail: null,
        userpassword: null,
        userId: null,
        userRole: null,
        userPermissions: null,
        tasksAssigned: null,
        recentTask: null,

        loginUser: (email, password, id, role, permissions) =>
          set(() => ({
            userEmail: email,
            userpassword: password,
            userId: id,
            userRole: role,
            userPermissions: permissions,
          })),
        hydrate: ({
          userEmail,
          userpassword,
          userId,
          userRole,
          userPermissions,
        }) => set({ userEmail, userpassword, userId: userId ?? null, userRole: userRole ?? null, userPermissions: userPermissions ?? null }),
        logoutUser: () =>
          set(() => ({
            userEmail: null,
            userId: null,
            userRole: null,
            userPermissions: null,
            userpassword: null,
          })),
        setTasksAssigned: (tasks) =>
          set(() => ({
            tasksAssigned: tasks,
          })),
        setRecentTask: (task) =>
          set(() => ({
            recentTask: task,
          })),
      })
  )
);      