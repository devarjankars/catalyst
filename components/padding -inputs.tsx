/**
 * PaddingInput — backwards-compatible wrapper around SpacingInput.
 * All existing callers continue to work unchanged.
 */
import React from "react";
import { SpacingInput } from "./spacing-input";

interface PaddingInputProps {
  value?: string;
  onChange: (value: string) => void;
}

const PaddingInput = ({ value = "0px 0px 0px 0px", onChange }: PaddingInputProps) => (
  <SpacingInput value={value} onChange={onChange} />
);

export default PaddingInput;
