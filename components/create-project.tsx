"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const  clients = [
  {
    label : "oresedu"
  },
  {
    label : "Elozarus"
  }
]
type Props = {
  onOpen : boolean,
  onClose : () => void
}
export default function CreateProjectDialog({ onOpen , onClose } : Props) {
  

  return (
    <Dialog open={onOpen} onOpenChange={onClose}>
       <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          {/* <DialogDescription>
            Choose which users should have <b>Write</b>, <b>Modify</b>, or{" "}
            <b>Asset Library</b> access for this template.
          </DialogDescription> */}
        </DialogHeader>
        <Separator />

      <Input className="w-[240px] mt-4" type="text" placeholder="Project name" />
      <Input className="w-[240px]" type="text" placeholder="Project Id" />
          <Select>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Select a Client" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Clients</SelectLabel>
          {clients.map((client) => <SelectItem key={client.label} value={client.label}>{client.label}</SelectItem>)}
          
        </SelectGroup>
      </SelectContent>
      
    </Select>
        <DialogFooter>
          <Button variant="outline">
            Cancel
          </Button>
          <Button>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
