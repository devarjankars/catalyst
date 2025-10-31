"use client";

import { useEffect, useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  projectName: z.string().min(2, { message: "Project name is required" }),
  client: z.string().nonempty({ message: "Please select a client" }),
  type: z.string().nonempty({ message: "Please select a type" }),
  category: z.string().nonempty({ message: "Please select a category" }),
  template: z.string().nonempty({ message: "Please select a template" }),
  resource: z
    .array(z.string())
    .nonempty({ message: "Please select atleast 1 resource" }),
});

type FormValues = z.infer<typeof formSchema>;
const clients = [
  {
    label: "oresedu",
  },
  {
    label: "Elozarus",
  },
];
type Props = {
  onOpen: boolean;
  onClose: () => void;
};
const allResources = [
  {
    category: "Development",
    employees: ["Darshan", "Bharath", "Abhishek"],
  },
  {
    category: "Asset Library",
    employees: ["Arun", "Sunil", "Rahul"],
  },
];
export default function CreateProjectDialog({ onOpen, onClose }: Props) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const selectedResources = watch("resource") ?? [];

  const onSubmit = (data: FormValues) => {
    console.log("Form Data:", data);
  };

  return (
    <Dialog open={onOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] bg-[#F6F6F6] text-[#404040]">
        <DialogHeader>
          <DialogTitle>Create new emailer</DialogTitle>
        </DialogHeader>
        <Separator />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col mt-4 justify-center"
        >
          {/* Project Name */}
          <div className="formConatiner grid grid-cols-2 gap-4 items-start">
            <div className="grid gap-2">
              <Label htmlFor="projectName">Emailer Name</Label>
              <Input
                id="projectName"
                placeholder="Enter project name"
                {...register("projectName")}
              />
              {errors.projectName && (
                <p className="text-red-500 text-xs">
                  {errors.projectName.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Client</Label>
              <Select onValueChange={(val) => setValue("client", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Brand</SelectLabel>
                    {clients.map((client) => (
                      <SelectItem key={client.label} value={client.label}>
                        {client.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.client && (
                <p className="text-red-500 text-xs">{errors.client.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Type</Label>
              <Select onValueChange={(val) => setValue("type", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Type</SelectLabel>
                    <SelectItem value="branded">Branded</SelectItem>
                    <SelectItem value="unbranded">Unbranded</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-red-500 text-xs">{errors.type.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Category</Label>
              <Select onValueChange={(val) => setValue("category", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Choose category</SelectLabel>
                    <SelectItem value="rte">RTE</SelectItem>
                    <SelectItem value="sfmc">SFMC</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="nonpromotional">
                      Non promotional
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-red-500 text-xs">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* <div className="grid gap-2">
              <Label>Choose Template</Label>
              <Input
                id="template"
                placeholder="choose template"
                {...register("template")}
              />
              {errors.template && (
                <p className="text-red-500 text-xs">
                  {errors.template.message}
                </p>
              )}
            </div> */}
            <div className="grid gap-2">
              <Controller
                name="resource"
                control={control}
                render={({ field }) => (
                  <GroupedSearchableMultiSelect
                    fieldValue={Array.isArray(field.value) ? field.value : []}
                    onChange={(next: string[]) => field.onChange(next)}
                    allResources={allResources}
                    errorMessage={
                      errors.resource?.message as string | undefined
                    }
                    placeholder="Select employees..."
                  />
                )}
              />
            </div>
          </div>
          <DialogFooter className="mt-4 flex justify-center sm:justify-center items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="text-[#BC2030] bg-white rounded-full w-1/4"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#BC2030] text-white rounded-full w-1/4"
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GroupedSearchableMultiSelect(props: {
  fieldValue: string[];
  onChange: (next: string[]) => void;
  allResources: { category: string; employees: string[] }[];
  errorMessage?: string;
  placeholder?: string;
}) {
  const { fieldValue, onChange, allResources, errorMessage, placeholder } =
    props;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Toggle employee in the selected array
  const toggleEmployee = (emp: string) => {
    const selected = Array.isArray(fieldValue) ? fieldValue : [];
    if (selected.includes(emp)) {
      onChange(selected.filter((s) => s !== emp));
    } else {
      onChange([...selected, emp]);
    }
  };

  // Filter employees by search term (case-insensitive)
  const filteredGroups = allResources
    .map((g) => ({
      category: g.category,
      employees: g.employees.filter((e) =>
        e.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((g) => g.employees.length > 0);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block mb-1 font-medium text-sm">Select Resources</label>

      {/* Control button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left border rounded px-3 py-2 flex items-center justify-between text-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          {fieldValue.length === 0 ? (
            <span className="text-gray-400">{placeholder ?? "Choose..."}</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {fieldValue.map((res) => (
                <span
                  key={res}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-2 text-sm"
                >
                  {res}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="ml-3 text-gray-500 text-sm">
          {fieldValue.length} selected
        </div>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute bottom-14 left-0 right-0 z-50 mt-2 bg-white border rounded shadow-lg p-3 max-h-72 overflow-auto">
          {/* Search input */}
          <div className="mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Groups */}
          {filteredGroups.length === 0 ? (
            <div className="text-sm text-gray-500 p-2">No employees found</div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.category} className="mb-2">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {group.category}
                </div>
                <div className="flex flex-col gap-1">
                  {group.employees.map((emp) => {
                    const checked =
                      Array.isArray(fieldValue) && fieldValue.includes(emp);
                    return (
                      <label
                        key={emp}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        title={emp}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEmployee(emp)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{emp}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Footer: Done + Clear */}
          <div className="mt-3 flex gap-2 justify-end pt-2 border-t">
            <button
              type="button"
              onClick={() => {
                // clear all
                onChange([]);
              }}
              className="px-3 py-1 rounded border text-sm"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Chips shown below (with delete X) */}
      <div className="flex flex-wrap gap-2 mt-3">
        {(Array.isArray(fieldValue) ? fieldValue : []).map((res) => (
          <div
            key={res}
            className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
          >
            <span className="text-sm">{res}</span>
            <button
              type="button"
              onClick={() => onChange(fieldValue.filter((r) => r !== res))}
              className="text-sm px-1 leading-none"
              aria-label={`Remove ${res}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* validation error */}
      {errorMessage && (
        <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
      )}
    </div>
  );
}
