import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "src/utils";

const spinnerVariants = cva(
  // "flex items-center justify-center w-screen h-screen",
  "fixed left-[50%] top-[50%] z-50 grid w-screen max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
  {
    variants: {
      variant: {
        default: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {}

function Spinner({ className, variant, ...props }: SpinnerProps) {
  return (
    <div className={cn(spinnerVariants({ variant }), className)} {...props}>
      <Loader2 className={"h-12 w-12 animate-spin stroke-primary"} />
    </div>
  );
}

export { Spinner, spinnerVariants };
