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
        right: parts[1] || "0",
        bottom: parts[2] || "0",
        left: parts[3] || "0",
      });
    }
  }, [value]);

  const handleChange = ({ side, newValue }: { side: string; newValue: number }) => {
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

  const sides = [
    { key: "top", label: "Top" },
    { key: "right", label: "Right" },
    { key: "bottom", label: "Bottom" },
    { key: "left", label: "Left" },
  ] as const;

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {sides.map(({ key, label }) => (
        <label key={key} className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            {label}
          </span>
          <Input
            type="number"
            value={padding[key]}
            onChange={e => handleChange({ side: key, newValue: Number(e.target.value) })}
            className="h-9 w-full rounded-md px-0 text-center"
          />
        </label>
      ))}
    </div>
  );
};

export default PaddingInput;
