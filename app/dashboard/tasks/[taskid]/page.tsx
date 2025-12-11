"use client";

import React, { use, useEffect, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator"; 
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, EyeIcon, Folder } from "lucide-react";
import { useParams } from "next/navigation";
import dummyTasks from "@/data/dummy-tasks.json";
import { useRouter } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Task = {
  task_id: string;
  taskname: string;
  task_owner: string;
  template_id: string;
  template_name: string;
  resources: string[];
  createdOn: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  type: string;
  status: string;
};

export default function Page({ params }: { params: { taskid: string } }) {
//   const initialTask: Task = {
//     task_id: params.taskid ?? "01",
//     taskname: "MAT-US_ELA-930456",
//     task_owner: "Karishma",
//     template_id: "123456",
//     template_name: "MAT-US_ELA-930456",
//     resources: ["Darshan", "Kavya"],
//     createdOn: "2024-10-02",
//     dueDate: "2024-10-30",
//     priority: "high",
//     type: "RTE",
//     status: "In progress",
//   };

  const router = useRouter();

  const [task, setTask] = useState<Task>({
    task_id: "",
    taskname: "",
    task_owner: "",
    template_id: "",
    template_name: "",
    resources: [],
    createdOn: "",
    dueDate: "",
    priority: "low",
    type: "",
    status: "",
  });
  const [message, setMessage] = useState<string | null>(null);

  const updateField = <K extends keyof Task>(key: K, value: Task[K]) => {
    setTask((prev) => ({ ...prev, [key]: value }));
  };

  const updateResource = (index: number, value: string) => {
    setTask((prev) => {
      const updated = [...prev.resources];
      updated[index] = value;
      return { ...prev, resources: updated };
    });
  };

  const addResource = () =>
    setTask((p) => ({ ...p, resources: [...p.resources, ""] }));

  const removeResource = (index: number) =>
    setTask((p) => ({
      ...p,
      resources: p.resources.filter((_, i) => i !== index),
    }));

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log("Saving task:", task);
    setMessage("✅ Saved successfully (mock).");
    setTimeout(() => setMessage(null), 2500);
  };

//   const handleReset = () => {
//     setTask(initialTask);
//     setMessage("Reset to initial values.");
//     setTimeout(() => setMessage(null), 2000);
//   };

  const handlePreview = () => {
    toast?.({
      title: "Preview Template",
      description: `Opening preview for ${task.template_name}`,
    });
    console.log("Preview template:", task.template_id);
  };


  useEffect(() => {
    // Fetch task details based on params.taskid
    // For now, we use the initialTask defined above
    const newtask  = dummyTasks.tasks.find(t => t.task_id === params.taskid);
    if(newtask){
        setTask(newtask as Task);
        return;
    }
    
  }, [params.taskid]);

  return (
    <main className="min-h-screen w-full bg-muted/10 p-8 flex flex-col">
      <header className="flex items-center justify-between border-b pb-4 mb-6">
        <h1
          className="text-2xl font-semibold flex items-center gap-2 cursor-pointer"
          onClick={() => router.back()}
        >
          <ArrowLeft /> Task Details — {task.task_id}
        </h1>
        {/* {message && (
          <p className="text-sm text-green-600 font-medium">{message}</p>
        )} */}
      </header>

      <div className="flex gap-4">
        <form
          onSubmit={handleSave}
          className=" overflow-y-auto space-y-8 max-w-6xl p-4  w-[80%] "
        >
          {/* Task Name / Owner */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Task Name</Label>
              <Input
                value={task.taskname}
                onChange={(e) => updateField("taskname", e.target.value)}
              />
            </div>
            <div>
              <Label>Owner</Label>
              <Input
                value={task.task_owner}
                onChange={(e) => updateField("task_owner", e.target.value)}
              />
            </div>
          </section>

          {/* Template Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Template ID</Label>
                <Input
                  value={task.template_id}
                  onChange={(e) => updateField("template_id", e.target.value)}
                />
              </div>
              <div>
                <Label>Template Name</Label>
                <Input
                  value={task.template_name}
                  onChange={(e) => updateField("template_name", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* <Separator /> */}

          {/* Resources */}
          <section>
            <Label>Resources</Label>
            <div className="flex flex-col gap-2 mt-3">
              {task.resources.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={r}
                    onChange={(e) => updateResource(i, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeResource(i)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addResource}
              >
                + Add Resource
              </Button>
            </div>
          </section>

          <Separator />

          {/* Dates */}
          <section className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Created On</Label>
              <Input
                type="date"
                value={task.createdOn}
                onChange={(e) => updateField("createdOn", e.target.value)}
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={task.dueDate}
                onChange={(e) => updateField("dueDate", e.target.value)}
              />
            </div>
          </section>

          {/* Priority / Type / Status */}
          <section className="grid md:grid-cols-3 gap-6">
            <div>
              <Label>Priority</Label>
              <Select
                value={task.priority}
                onValueChange={(v) =>
                  updateField("priority", v as Task["priority"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type</Label>
              <Input
                value={task.type}
                onChange={(e) => updateField("type", e.target.value)}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Input
                value={task.status}
                onChange={(e) => updateField("status", e.target.value)}
              />
            </div>
          </section>

          <footer className="flex flex-wrap gap-4 justify-end border-t pt-6 mt-8">
            <Button type="submit">Save</Button>
            <Button type="button" variant="outline">
              Reset
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(task, null, 2));
                setMessage("Copied JSON to clipboard!");
                setTimeout(() => setMessage(null), 2000);
              }}
            >
              Copy JSON
            </Button>
          </footer>
        </form>
        <section className="flex flex-col gap-6 w-[20%]   p-4">
          {/* Thumbnail + Preview */}
          <div className="flex flex-col items-center">
            {task.template_id && (
              <div className="relative w-[90%] h-[40vh] border rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                <img
                  src="/email_thumbnail.png"
                  alt="Template Thumbnail"
                  className="object-contain w-full h-full"
                />
              </div>
            )}
            {task.template_id ? (
              <Button
                type="button"
                size="sm"
                className="mt-2 rounded-full bg-red-600  hover:bg-red-700"
                onClick={handlePreview}
              >
                <EyeIcon /> Preview Template
              </Button>
            ) : (
              <Button className="rounded-full bg-red-600 hover:bg-red-800">
                Choose a template
              </Button>
            )}
          </div>
          {/* Asset folder */}
          <Accordion type="single" collapsible>
            <AccordionItem value="assets">
              <AccordionTrigger className="w-full text-left  hover:no-underline"><span className="flex gap-2"><Folder color="#decc54"/> Assets</span></AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Assets related to this task can be managed here. (Mock content)
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </main>
  );
}
