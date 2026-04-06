import { cn } from "@/lib/utils";

type HeadingLevel = 1 | 2 | 3 | 4;

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  as?: HeadingLevel;
}

const levelStyles: Record<HeadingLevel, string> = {
  1: "heading-hero text-4xl font-bold md:text-5xl",
  2: "heading-section text-2xl font-semibold md:text-3xl",
  3: "heading-section text-xl font-semibold md:text-2xl",
  4: "heading-subtle text-lg font-medium",
};

/**
 * Semantic heading with Space Grotesk display scale classes.
 *
 * `level` controls visual style; `as` overrides the HTML tag when the
 * visual hierarchy differs from the document outline (e.g. a visually
 * large heading that should be an h3 for accessibility).
 */
export function Heading({
  level = 2,
  as,
  className,
  children,
  ...props
}: HeadingProps) {
  const Tag = `h${as ?? level}` as const;

  return (
    <Tag
      data-level={level}
      className={cn("text-bone", levelStyles[level], className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
