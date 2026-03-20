import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: "div" | "main" | "section";
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const maxWidthMap: Record<NonNullable<PageContainerProps["maxWidth"]>, string> = {
  sm: "max-w-[640px]",
  md: "max-w-[768px]",
  lg: "max-w-[1024px]",
  xl: "max-w-[1280px]",
};

export function PageContainer({
  as = "div",
  maxWidth = "xl",
  className,
  children,
  ...props
}: PageContainerProps) {
  const Tag = as;

  return (
    <Tag
      className={cn(
        "mx-auto w-full px-4 md:px-6 lg:px-8",
        maxWidthMap[maxWidth],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
