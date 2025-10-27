'use client';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import CreateProjectDialog from "@/components/create-project";

export default function TasksLayout({ children}: { children: React.ReactNode }) {
 const [openCreate , setCreate] = useState(false);
  return (
    <div className="w-full bg-[#F6F6F6] grid grid-rows-[auto auto 1fr] p-8">
    <div className="p-2 h-auto flex items-center gap-4 justify-between">
        <div className="path flex-1">
        <h1>Tasks</h1>
        </div>
        <div className="createTask">
            <Button  className="flex items-center gap-2 rounded-full px-6 bg-[#BC2030]" onClick={() => setCreate(true)}>
                <Plus className="w-4 h-4" />
                Create New Task
            </Button>
        </div>
        
    </div>
    <main className="h-full w-full overflow-y-auto pb-2 mt-4">
        {children}
    </main>
     <CreateProjectDialog onOpen={openCreate} onClose={() => setCreate(false)}/>
    </div>
  );
}