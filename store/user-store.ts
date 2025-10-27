import {create} from 'zustand'
import {devtools , persist} from 'zustand/middleware'
import type {Team , Employee , PermissionKey , TeamKey} from '@/app/dashboard/admin/page'
import {initialTeams} from '@/data/users'

type userData = {
    teams : Team[],
    addUser : (teamKey : string , user :Employee) => void,
    updatePermissions: (teamKey: string , employeeId: string , permissions : Record<PermissionKey, boolean>) => void,
    getTeams :() => TeamKey[]
}

export const useUserStore= create<userData>()(
    devtools(
        persist(
            (set , get) => ({
                teams : initialTeams,
                addUser : (teamKey:string , user:Employee) => set((state) => ({
                    teams : state.teams.map((team) => team.key === teamKey ? {...team , employees : [...team.employees , user]} : team)
                })),
                updatePermissions : (teamKey , employeeId , permission) => set((state) => ({
                  teams: state.teams.map((team) =>
                    team.key === teamKey
                      ? {
                          ...team,
                          employees: team.employees.map((emp) =>
                            emp.id === employeeId
                              ? { ...emp, permissions: { ...emp.permissions, ...permission } }
                              : emp
                          ),
                        }
                      : team
                  ),
                })),
                getTeams: () => get().teams.map((team) => team.key),
                
            }),
            {name : "users"}
        )
    )) 