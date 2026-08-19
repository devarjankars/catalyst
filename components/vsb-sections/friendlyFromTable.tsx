import React from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { PlusCircle, Trash2 } from "lucide-react";

interface SenderRow {
  fromEmail: string;
  friendlyNames: string[];
}

interface Props {
  data: SenderRow[];
  onChange: (data: SenderRow[]) => void;

}

export default function SenderTable({ data, onChange}: Props) {
  // ── Email ──────────────────────────────────────────────────────────────────

  console.log(data);
  

  const updateEmail = (rowIndex: number, email: string) => {
    const updated = [...data];
    updated[rowIndex] = { ...updated[rowIndex], fromEmail: email };
    onChange(updated);
  };

  // ── Friendly name ──────────────────────────────────────────────────────────

  const updateFriendlyName = (rowIndex: number, nameIndex: number, value: string) => {
    const updated = [...data];
    const names = [...updated[rowIndex].friendlyNames];
    names[nameIndex] = value;
    updated[rowIndex] = { ...updated[rowIndex], friendlyNames: names };
    onChange(updated);
  };

  const addFriendlyName = (rowIndex: number) => {
    const updated = [...data];
    updated[rowIndex] = {
      ...updated[rowIndex],
      friendlyNames: [...updated[rowIndex].friendlyNames, ""],
    };
    onChange(updated);
  };

  const deleteFriendlyName = (rowIndex: number, nameIndex: number) => {
    const updated = [...data];
    updated[rowIndex] = {
      ...updated[rowIndex],
      friendlyNames: updated[rowIndex].friendlyNames.filter((_, i) => i !== nameIndex),
    };
    onChange(updated);
  };

  // ── Row ────────────────────────────────────────────────────────────────────

  const addRow = () => {
    onChange([...data, { fromEmail: "", friendlyNames: [""] }]);
  };

  const deleteRow = (rowIndex: number) => {
    onChange(data.filter((_, i) => i !== rowIndex));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-pink-600 w-1/2">
                Friendly From Name
              </th>
              <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-pink-600 w-1/2">
                From Email Address
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {data?.map((row, rowIndex) => (
              <tr key={rowIndex} className="align-top bg-white hover:bg-gray-50/50 transition-colors">
                {/* Friendly names */}
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    {row.friendlyNames.map((name, nameIndex) => (
                      <div key={nameIndex} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-5 shrink-0 text-right">
                          {nameIndex + 1}.
                        </span>
                        <Input
                          value={name}
                          placeholder="Friendly name"
                          onChange={(e) => updateFriendlyName(rowIndex, nameIndex, e.target.value)}
                          className="flex-1 h-8 text-sm bg-white"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteFriendlyName(rowIndex, nameIndex)}
                          title="Remove friendly name"
                          disabled={row.friendlyNames.length === 1}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    ))}

                    {/* Row actions */}
                    <div className="flex items-center gap-2 pt-1 pl-7">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                        onClick={() => addFriendlyName(rowIndex)}
                      >
                        <PlusCircle size={12} className="mr-1" /> Add name
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                        onClick={() => deleteRow(rowIndex)}
                        disabled={data.length === 1}
                      >
                        <Trash2 size={12} className="mr-1" /> Delete row
                      </Button>
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="px-4 py-3 align-middle text-center">
                  <Input
                    placeholder="noreply@example.com"
                    value={row.fromEmail}
                    onChange={(e) => updateEmail(rowIndex, e.target.value)}
                    className="bg-white text-sm text-center"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add sender */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
          onClick={addRow}
        >
          <PlusCircle size={15} className="mr-1" /> Add sender
        </Button>
      </div>
    </div>
  );
}
