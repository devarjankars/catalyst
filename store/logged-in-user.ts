import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

// ---- Store ----
interface LoggedInUserStore {
  userEmail: string | null;
  userId: string | null;
  userRole: string | null;
  userPermissions: string[] | null;
  loginUser: (email: string, id: string, role: string, permissions: string[]) => void;
  logoutUser: () => void;
  tasksAssigned: string[] | null;
  setTasksAssigned: (tasks: string[]) => void;
  recentTask: object | null;
  setRecentTask: (task: object) => void;
}

export const useLoggedInUserStore = create<LoggedInUserStore>()(
  devtools(
    persist(
        (set,get) => ({
            userEmail: null,
            userId: null,
            userRole: null,
            userPermissions: null,
            tasksAssigned: null,
            recentTask: null,

            loginUser: (email, id, role, permissions) => set(() => ({
                userEmail: email,
                userId: id,
                userRole: role,
                userPermissions: permissions,
            })),
            logoutUser: () => set(() => ({
                userEmail: null,
                userId: null,
                userRole: null,
                userPermissions: null,
            })),
            setTasksAssigned: (tasks) => set(() => ({
                tasksAssigned: tasks,
            })),
            setRecentTask: (task) => set(() => ({
                recentTask: task,
            })),
        }
    ),
        {
             name: "logged-in-user-storage" 
        }
    )
)
)      