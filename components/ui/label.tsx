"use client";

import * as React from "react";
import { cn } from "@/lib/utils/format";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  requiredIndicator?: boolean;
};

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, requiredIndicator, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "mb-1.5 inline-flex items-center gap-1 text-sm font-medium text-neutral-700",
        className,
      )}
      {...props}
    >
      {children}
      {requiredIndicator ? (
        <span className="text-xs font-normal text-red-500">*</span>
      ) : null}
    </label>
  ),
);

Label.displayName = "Label";

export { Label };
