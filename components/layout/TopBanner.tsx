"use client";

import { Fragment, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { siteConfig } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const emailAddress = siteConfig.contact.email;

const renderMessageWithEmail = (message: string, linkClassName: string): ReactNode => {
  if (!message.includes(emailAddress)) {
    return message;
  }
  const parts = message.split(emailAddress);
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={`${part}-${index}`}>
          {part}
          {index < parts.length - 1 ? (
            <a href={`mailto:${emailAddress}`} className={linkClassName} rel="noreferrer">
              {emailAddress}
            </a>
          ) : null}
        </Fragment>
      ))}
    </>
  );
};

export function TopBanner({ banner }: { banner: Dictionary["banner"] }) {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  return (
    <div className="relative bg-[#123A26] py-3 text-xs text-[rgb(var(--primary-foreground))] sm:text-sm">
      <div className="container relative flex flex-col gap-1 text-center font-medium tracking-wide pr-10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-2 sm:pr-0">
        <span className="font-semibold">{banner.freeShipping}</span>
        <span>{banner.shippingIntro}</span>
        <span className="text-[0.8rem] sm:text-inherit">
          {renderMessageWithEmail(
            banner.shippingContact,
            "font-semibold underline decoration-white/70 underline-offset-4 hover:decoration-white",
          )}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label={banner.dismissLabel}
        className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-1 text-xs text-white/80 transition hover:bg-white/20 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
