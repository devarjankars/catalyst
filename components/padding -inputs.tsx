import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";

interface PaddingInputProps {
  value?: string; // e.g. "10px 15px 10px 15px"
  onChange: (value: string) => void;
}

const PaddingInput = ({ value = "0px 0px 0px 0px", onChange }: PaddingInputProps) => {
  const [padding, setPadding] = useState({
    top: "",
    right: "",
    bottom: "",
    left: "",
  });

  // Parse incoming value when prop changes
  useEffect(() => {
    if (value) {
      const parts = value.split(" ").map(v => v.replace("px", ""));
      setPadding({
        top: parts[0] || "0",
        right: parts[1]  || "0",
        bottom: parts[2]  || "0",
        left: parts[3] ||   "0",
      });
    }
  }, [value]);

  const handleChange = ({side, newValue}: {side : string , newValue: number}) => {
    const newPadding = { ...padding, [side]: newValue };
    setPadding(newPadding);

    const { top, right, bottom, left } = newPadding;
    const aggregated = [top, right, bottom, left]
      .map(v => (v !== "" ? `${v}px` : "0"))
      .join(" ");

    setTimeout(() => {
        onChange?.(aggregated);
    },100)  
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full p-4 border rounded-lg bg-white shadow-sm">
      <label className="flex flex-col text-sm font-medium text-gray-700">
        Top
        <Input
          type="number"
          value={padding.top}
          onChange={e => handleChange({ side: "top", newValue: Number(e.target.value) })}
           className="mt-1 w-10 h-10 rounded-md border-gray-300 shadow-sm  text-sm px-2 py-1"
        />
      </label>

      <label className="flex flex-col text-sm font-medium text-gray-700">
        Right
        <Input
          type="number"
          value={padding.right}
         onChange={e => handleChange({ side: "right", newValue: Number(e.target.value) })}
           className="mt-1 w-10 h-10 rounded-md border-gray-300 shadow-sm  text-sm px-2 py-1"
        />
      </label>

      <label className="flex flex-col text-sm font-medium text-gray-700">
        Bottom
        <Input
          type="number"
          value={padding.bottom}
          onChange={e => handleChange({ side: "bottom", newValue: Number(e.target.value) })}
          className="mt-1 w-10 h-10 rounded-md border-gray-300 shadow-sm  text-sm px-2 py-1"
        />
      </label>

      <label className="flex flex-col text-sm font-medium text-gray-700">
        Left
        <Input
          type="number"
          value={padding.left}
          onChange={e => handleChange({ side: "left", newValue: Number(e.target.value) })}
           className="mt-1 w-10 h-10 rounded-md border-gray-300 shadow-sm  text-sm px-2 py-1"
        />
      </label>
    </div>
  );
};

export default PaddingInput;
