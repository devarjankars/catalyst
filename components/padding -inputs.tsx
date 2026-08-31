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

  useEffect(() => {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    const values = parts.length === 1
      ? [parts[0], parts[0], parts[0], parts[0]]
      : parts.length === 2
        ? [parts[0], parts[1], parts[0], parts[1]]
        : parts.length === 3
          ? [parts[0], parts[1], parts[2], parts[1]]
          : parts.slice(0, 4);

    setPadding({
      top: (values[0] || "0").replace(/px$/i, ""),
      right: (values[1] || "0").replace(/px$/i, ""),
      bottom: (values[2] || "0").replace(/px$/i, ""),
      left: (values[3] || "0").replace(/px$/i, ""),
    });
  }, [value]);

  const handleChange = ({ side, newValue }: { side: keyof typeof padding; newValue: string }) => {
    const newPadding = { ...padding, [side]: newValue };
    setPadding(newPadding);

    const { top, right, bottom, left } = newPadding;
    const aggregated = [top, right, bottom, left]
      .map(v => (v !== "" ? `${v}px` : "0px"))
      .join(" ");

    onChange(aggregated);
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
            onChange={e => handleChange({ side: key, newValue: e.target.value })}
            className="h-9 w-full rounded-md px-0 text-center"
          />
        </label>
      ))}
    </div>
  );
};

export default PaddingInput;
