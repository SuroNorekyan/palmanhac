"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type HeroSectionProps = {
  eyebrow: string;
  heading: string;
  subheading: string;
  ctaLabel: string;
  scrollTargetId: string;
};

export function HeroSection({
  eyebrow,
  heading,
  subheading,
  ctaLabel,
  scrollTargetId,
}: HeroSectionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  const handleScroll = () => {
    const target = document.getElementById(scrollTargetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-neutral-950 text-white shadow-[0px_30px_80px_rgba(15,23,42,0.45)]">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/videos/wine-animation.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/40" />
      <div className="relative z-10 flex min-h-[440px] flex-col justify-center gap-6 px-8 py-16 sm:px-12 lg:min-h-[520px] lg:px-16">
        <div
          className={[
            "max-w-2xl space-y-5 transition-all duration-700 ease-out",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          ].join(" ")}
        >
          <span className="inline-flex w-fit rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
            {eyebrow}
          </span>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            {heading}
          </h1>
          <p className="text-base text-white/80 sm:text-lg lg:text-xl">{subheading}</p>
        </div>
        <div
          className={[
            "transition-all duration-700 ease-out delay-150",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          ].join(" ")}
        >
          <Button
            type="button"
            size="lg"
            className="px-8 py-6 text-base sm:text-lg"
            onClick={handleScroll}
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
