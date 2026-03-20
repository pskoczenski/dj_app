import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-10 border-[3px]",
};

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-fern border-t-transparent",
        sizes[size],
        className,
      )}
    />
  );
}
