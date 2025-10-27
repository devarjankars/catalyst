import Breadcrumb from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

export default function ProjectfoldersLayout({ children}: { children: React.ReactNode }) {
 
  return (
    <div className="w-full bg-[#F6F6F6] grid grid-rows-[auto auto 1fr]">
    <div className="pathHeader p-2 px-24 border-b h-auto flex items-center gap-4 justify-between">
        <div className="path flex-1">
       <Breadcrumb/>
        </div>
        <div className="createBtn">
            <Button  className="flex items-center gap-2 rounded-full px-6">
                <Plus className="w-4 h-4" />
                Create Project
            </Button>
        </div>
    </div>
    {/* <div className="back my-3 px-24">
       <Button className="bg-transparent text-black flex items-center p-0 hover:bg-transparent"><ChevronLeft className="w-4 place-items-center"/> Back</Button> 
    </div> */}
    <main className="h-full w-full overflow-y-auto pb-2 px-24 mt-3">
        {children}
    </main>
    </div>
  );
}