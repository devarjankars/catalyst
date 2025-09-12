"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {useUserStore} from "@/store/user-store"

interface AdduserDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function AdduserDialog({ open, onConfirm, onCancel }: AdduserDialogProps) {
  const {teams , addUser , getTeams} = useUserStore();
  const allteams = getTeams();
console.log(teams);
console.log(allteams);
  

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            
            <div>
              <DialogTitle>Add new user to the Team</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <div className="infoContainer my-4">
             <Select>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Select a Team" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Teams</SelectLabel>
          {allteams.map((team) => <SelectItem key={team} value={team}>{team}</SelectItem>)}
          
        </SelectGroup>
      </SelectContent>
      <Input className="w-[240px] mt-4" type="text" placeholder="Employee Id" />
      <Input className="w-[240px] mt-4" type="text" placeholder="Name" />
    </Select>
        </div>
            
        

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onCancel} >
            Cancel
          </Button>
           <Button variant="outline" onClick={onConfirm} >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
