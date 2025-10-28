"use client";

import type { ComponentPropsWithoutRef, HTMLAttributes } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/format";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;
const SheetOverlay = DialogPrimitive.Overlay;

const SheetOverlayStyled = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof SheetOverlay>) => (
  <SheetOverlay
    className={cn("fixed inset-0 z-50 bg-black/40 backdrop-blur-sm", className)}
    {...props}
  />
);
SheetOverlayStyled.displayName = SheetOverlay.displayName;

const SheetContent = ({
  className,
  children,
  side = "right",
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  side?: "left" | "right";
}) => (
  <SheetPortal>
    <SheetOverlayStyled />
    <DialogPrimitive.Content
      className={cn(
        "fixed top-0 z-50 flex h-full w-[min(340px,90vw)] flex-col bg-white p-8 shadow-2xl transition focus-visible:outline-none",
        side === "right" ? "right-0" : "left-0",
        className,
      )}
      {...props}
    >
      {children}
      <SheetClose className="absolute right-5 top-5 rounded-full p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800">
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </SheetClose>
    </DialogPrimitive.Content>
  </SheetPortal>
);
SheetContent.displayName = DialogPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1 text-left", className)} {...props} />
);

const SheetTitle = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    className={cn("text-xl font-semibold text-neutral-900", className)}
    {...props}
  />
);
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    className={cn("text-sm text-[rgb(var(--muted-foreground))]", className)}
    {...props}
  />
);
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};
