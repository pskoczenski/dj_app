import { RootLineDivider } from "@/components/decorative/root-line-divider";
import { cn } from "@/lib/utils";

interface SectionDividerProps {
  className?: string;
}

export function SectionDivider({ className }: SectionDividerProps) {
  return (
    <div className={cn("py-2", className)}>
      <RootLineDivider />
    </div>
  );
}
