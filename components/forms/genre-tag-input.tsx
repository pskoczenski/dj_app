"use client";

import { useState, type KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface GenreTagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
  className?: string;
}

export function GenreTagInput({
  value,
  onChange,
  placeholder = "Add genre…",
  max = 10,
  className,
}: GenreTagInputProps) {
  const [input, setInput] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag || value.includes(tag) || value.length >= max) return;
    onChange([...value, tag]);
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => removeTag(tag)}
            className="ml-0.5 rounded-full hover:text-bone"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {value.length < max && (
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-8 w-auto min-w-[120px] flex-1 border-none bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
        />
      )}
    </div>
  );
}
