import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "../ui/button";

export function ReorderButtons<T>({
  items, index, label, onChange, disabled = false,
}: {
  items: T[];
  index: number;
  label: string;
  onChange: (items: T[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {([-1, 1] as const).map(offset => {
        const target = index + offset;
        const Icon = offset < 0 ? ArrowUp : ArrowDown;
        return (
          <Button key={offset} type="button" size="icon" variant="ghost"
            aria-label={`Move ${label} ${index + 1} ${offset < 0 ? "up" : "down"}`}
            disabled={disabled || target < 0 || target >= items.length}
            onClick={() => {
              const reordered = [...items];
              [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
              onChange(reordered);
            }}>
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
