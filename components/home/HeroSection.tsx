"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const HERO_IMAGES = [
  "/assets/mainCarousel/1.JPG",
  "/assets/mainCarousel/2.JPG",
  "/assets/mainCarousel/3.JPG",
  "/assets/mainCarousel/4.JPG",
  "/assets/mainCarousel/5.JPG",
] as const;

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
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRotation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(
      () => setActiveIndex((prev) => (prev + 1) % HERO_IMAGES.length),
      6000,
    );
  }, []);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setIsVisible(true));
    startRotation();
    return () => {
      cancelAnimationFrame(handle);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startRotation]);

  const goToIndex = useCallback(
    (index: number) => {
      const normalized =
        ((index % HERO_IMAGES.length) + HERO_IMAGES.length) % HERO_IMAGES.length;
      setActiveIndex((prev) => (normalized === prev ? prev : normalized));
      startRotation();
    },
    [startRotation],
  );

  const handlePrev = useCallback(
    () => goToIndex(activeIndex - 1),
    [activeIndex, goToIndex],
  );

  const handleNext = useCallback(
    () => goToIndex(activeIndex + 1),
    [activeIndex, goToIndex],
  );

  const handleScroll = () => {
    const target = document.getElementById(scrollTargetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[3rem] bg-neutral-950 text-white shadow-[0px_40px_90px_rgba(15,23,42,0.45)]">
      <div className="relative min-h-[380px] max-h-[680px] h-[calc(100vh-14rem)] sm:h-[calc(100vh-14rem)] md:h-[calc(100vh-12rem)] lg:h-[calc(100vh-12rem)] xl:h-[calc(100vh-11rem)]">
        {HERO_IMAGES.map((src, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={src}
              className={`absolute inset-0 transition-[opacity,transform] duration-[1200ms] ease-out ${
                isActive
                  ? "opacity-100 scale-100"
                  : "pointer-events-none opacity-0 scale-105"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                priority={index === 0}
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/70 to-black/40" />
            </div>
          );
        })}

        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8 px-8 py-16 text-center sm:px-12 lg:px-20">
          <div
            className={[
              "max-w-3xl space-y-6 transition-all duration-700 ease-out",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
            ].join(" ")}
          >
            <span className="mx-auto inline-flex w-fit rounded-full bg-white/15 px-5 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              {eyebrow}
            </span>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              {heading}
            </h1>
            <p className="mx-auto max-w-2xl text-base text-white/80 sm:text-lg lg:text-xl">
              {subheading}
            </p>
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
              variant="outlineInverted"
              className="px-8 py-6 text-base sm:text-lg"
              onClick={handleScroll}
            >
              {ctaLabel}
            </Button>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex items-center justify-center gap-2 sm:bottom-10">
          {HERO_IMAGES.map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => goToIndex(index)}
                className={`pointer-events-auto h-2 w-10 rounded-full transition-all ${
                  isActive ? "bg-white" : "bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            );
          })}
        </div>

        <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-4 sm:pl-8">
          <button
            type="button"
            onClick={handlePrev}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 z-10 flex items-center pr-4 sm:pr-8">
          <button
            type="button"
            onClick={handleNext}
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
