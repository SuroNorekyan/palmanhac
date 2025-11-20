"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { ProductListItem } from "@/types/product";
import { ProductCard } from "./ProductCard";

type FeaturedCarouselProps = {
  products: ProductListItem[];
  dictionary: Dictionary;
  locale: Locale;
};

export function FeaturedCarousel({
  products,
  dictionary,
  locale,
}: FeaturedCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "prev" | "next") => {
    const node = scrollerRef.current;
    if (!node) return;
    const amount = node.clientWidth * 0.8;
    node.scrollBy({
      left: direction === "prev" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="space-y-4">
      <div className="hidden justify-end gap-3 md:flex">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-full bg-white shadow-md hover:bg-neutral-900 hover:text-white"
          onClick={() => scroll("prev")}
          aria-label={dictionary.home.featuredPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-full bg-white shadow-md hover:bg-neutral-900 hover:text-white"
          onClick={() => scroll("next")}
          aria-label={dictionary.home.featuredNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={scrollerRef}
        className="flex gap-6 overflow-x-auto pb-6 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[88%] min-w-[300px] max-w-sm sm:w-[360px] xl:w-[380px]"
          >
            <ProductCard
              product={product}
              dictionary={dictionary}
              locale={locale}
              variant="featured"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
