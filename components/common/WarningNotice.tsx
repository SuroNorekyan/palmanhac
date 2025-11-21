import { Fragment, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/format";

type WarningVariant = "amber" | "orange";

const variantStyles: Record<
  WarningVariant,
  { container: string; icon: string; text: string }
> = {
  amber: {
    container: "border-amber-200 bg-amber-50 text-amber-900",
    icon: "text-amber-600",
    text: "text-amber-900",
  },
  orange: {
    container: "border-orange-200 bg-orange-50 text-orange-900",
    icon: "text-orange-600",
    text: "text-orange-900",
  },
};

export type WarningNoticeProps = {
  title: ReactNode;
  message?: ReactNode;
  children?: ReactNode;
  variant?: WarningVariant;
  className?: string;
};

export function WarningNotice({
  title,
  message,
  children,
  variant = "amber",
  className,
}: WarningNoticeProps) {
  const styles = variantStyles[variant];
  const content = message ?? children;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 text-sm",
        styles.container,
        styles.text,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={cn("mt-0.5 h-4 w-4", styles.icon)} />
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          {typeof content === "string" ? <p>{content}</p> : content}
        </div>
      </div>
    </div>
  );
}

export const formatNoticeWithEmail = (
  message: string,
  email: string,
  linkClassName = "font-semibold underline underline-offset-2",
): ReactNode => {
  if (!email || !message.includes(email)) {
    return message;
  }

  const parts = message.split(email);
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={`${email}-${index}`}>
          {part}
          {index < parts.length - 1 ? (
            <a href={`mailto:${email}`} className={linkClassName}>
              {email}
            </a>
          ) : null}
        </Fragment>
      ))}
    </>
  );
};
