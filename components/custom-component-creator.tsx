"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import type { EmailComponent } from "@/types/email-builder";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { useEmailBuilderStore } from "@/store/email-builder-store";



export function CustomComponentCreator() {
  const [isOpen, setIsOpen] = useState(false);
  const [componentName, setComponentName] = useState("");
  const [componentType, setComponentType] = useState<
    "text" | "image" | "button" | "divider" | "custom"
  >("text");
  const [componentProps, setComponentProps] = useState<Partial<EmailComponent>>(
    {}
  );

  const {addCustomComponent} = useEmailBuilderStore()

  const handleCreate = () => {
    if (!componentName.trim()) return;

    if(componentType === "custom"){
      const html = componentProps?.html?.trim();

      console.log(html,"creating html");
      

      const isTableHTML =
    /^<table[\s\S]*<\/table>$/.test(html) ||
    (html?.startsWith("<tr") && html?.includes("</tr>"));

        if(html && !isTableHTML){
          toast.error("Enter valid code")
          setComponentName("");
          setComponentProps({});
          return 
        }
    }

    const newComponent: EmailComponent = {
      id: `custom-${Date.now()}`,
      type: componentType,
      name: componentName,
      isCustom: true,
      padding: "16px",
      ...componentProps,
    };

    // Set default props based on type
    switch (componentType) {
      case "text":
        newComponent.content = "Custom text component";
        newComponent.fontSize = "16px";
        newComponent.color = "#000000";
        break;
      case "image":
        newComponent.src =
          "/placeholder.svg?height=200&width=400&text=Custom Image";
        newComponent.alt = "Custom image";
        newComponent.width = "100%";
        break;
      case "button":
        newComponent.text = "Custom Button";
        newComponent.href = "#";
        newComponent.backgroundColor = "#007bff";
        newComponent.color = "#ffffff";
        break;
      case "divider":
        newComponent.height = "1px";
        newComponent.backgroundColor = "#e0e0e0";
        break;
    }


    addCustomComponent(newComponent)
    setIsOpen(false);
    setComponentName("");
    setComponentProps({});
  };

  const renderTypeSpecificFields = () => {
    switch (componentType) {
      case "text":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="content">Default Text</Label>
              <Input
                id="content"
                value={componentProps.content || ""}
                onChange={(e) =>
                  setComponentProps((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                placeholder="Enter default text"
              />
            </div>
            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                value={componentProps.fontSize || "16px"}
                onChange={(e) =>
                  setComponentProps((prev) => ({
                    ...prev,
                    fontSize: e.target.value,
                  }))
                }
                placeholder="16px"
              />
            </div>
          </div>
        );
      case "button":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="text">Button Text</Label>
              <Input
                id="text"
                value={componentProps.text || ""}
                onChange={(e) =>
                  setComponentProps((prev) => ({
                    ...prev,
                    text: e.target.value,
                  }))
                }
                placeholder="Button text"
              />
            </div>
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <Input
                id="backgroundColor"
                type="color"
                value={componentProps.backgroundColor || "#007bff"}
                onChange={(e) =>
                  setComponentProps((prev) => ({
                    ...prev,
                    backgroundColor: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        );
      case "image":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="src">Default Image URL</Label>
              <Input
                id="src"
                value={componentProps.src || ""}
                onChange={(e) =>
                  setComponentProps((prev) => ({
                    ...prev,
                    src: e.target.value,
                  }))
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        );
      case "custom":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="code">Enter code below</Label>
              <Textarea
                id="code"
                value={componentProps.html || ""}
                onChange={(e) =>
                  setComponentProps((prev) => ({
                    ...prev,
                    html: e.target.value,
                  }))
                }
                placeholder="<table>....</table>"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 bg-transparent"
        >
          <Plus className="w-4 h-4" />
          Create Custom Component
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Custom Component</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Component Name</Label>
            <Input
              id="name"
              value={componentName}
              onChange={(e) => setComponentName(e.target.value)}
              placeholder="My Custom Component"
            />
          </div>

          <div>
            <Label htmlFor="type">Base Type</Label>
            <Select
              value={componentType}
              onValueChange={(value: any) => setComponentType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="button">Button</SelectItem>
                <SelectItem value="divider">Divider</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderTypeSpecificFields()}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!componentName.trim()}
              className="flex-1"
            >
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
