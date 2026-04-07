import { cn } from "@/lib/utils";

interface SectionDividerProps {
  className?: string;
}

export function SectionDivider({ className }: SectionDividerProps) {
  return (
    <div className={cn("py-2", className)} role="presentation">
      <div className="h-px w-full bg-mb-border-hair" />
    </div>
  );
}
