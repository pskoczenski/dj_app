import { cn } from "@/lib/utils";

interface FormLayoutProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export function FormLayout({ className, children, ...props }: FormLayoutProps) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      {children}
    </form>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  helperText?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  helperText,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-stone">
        {label}
      </label>
      {children}
      {helperText ? <p className="text-xs text-fog">{helperText}</p> : null}
    </div>
  );
}

export function FormActions({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("flex gap-3", className)}>{children}</div>;
}
