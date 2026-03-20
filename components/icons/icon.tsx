import { cn } from "@/lib/utils";
import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";

export type IconSize = "sm" | "md" | "lg";
export type IconTone = "default" | "active" | "primary" | "muted" | "accent";

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

export const toneClass: Record<IconTone, string> = {
  default: "text-stone",
  active: "text-bone",
  primary: "text-fern",
  muted: "text-fog",
  accent: "text-lichen-gold",
};

interface IconProps extends Omit<LucideProps, "size"> {
  icon: ComponentType<LucideProps>;
  size?: IconSize;
  tone?: IconTone;
  /** Override aria-hidden when the icon carries meaning */
  label?: string;
}

/**
 * Standardised icon wrapper enforcing design-system sizes (16/20/24),
 * semantic tone colors, and consistent stroke weight.
 *
 * Decorative by default (aria-hidden). Pass `label` to make it accessible.
 */
export function Icon({
  icon: IconComponent,
  size = "md",
  tone = "default",
  label,
  className,
  ...props
}: IconProps) {
  return (
    <IconComponent
      size={sizeMap[size]}
      strokeWidth={1.75}
      aria-hidden={!label}
      aria-label={label}
      role={label ? "img" : undefined}
      className={cn(toneClass[tone], className)}
      {...props}
    />
  );
}
