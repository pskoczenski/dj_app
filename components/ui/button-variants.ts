import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-default border border-transparent bg-clip-padding px-4 text-sm font-medium whitespace-nowrap transition-all duration-150 ease-in-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border border-mb-turquoise-mid bg-primary text-primary-foreground hover:bg-mb-turquoise-mid hover:text-mb-text-primary active:bg-primary [a]:hover:bg-mb-turquoise-mid [a]:hover:text-mb-text-primary",
        outline:
          "border-border bg-card text-card-foreground hover:border-mb-border-soft hover:bg-mb-surface-2 hover:text-mb-text-primary aria-expanded:border-mb-border-soft aria-expanded:text-mb-text-primary",
        secondary:
          "bg-forest-shadow text-bone hover:bg-dark-moss hover:border-sage-edge border-root-line aria-expanded:bg-dark-moss aria-expanded:text-bone",
        ghost:
          "border-transparent bg-transparent text-stone hover:text-bone hover:bg-forest-shadow/50 aria-expanded:text-bone",
        destructive:
          "bg-dried-blood text-bone hover:bg-rust-mist active:bg-dried-blood/90 focus-visible:border-dried-blood focus-visible:ring-dried-blood/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-1.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 rounded-[min(var(--radius-md),12px)] px-4 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-1.5 px-4 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
