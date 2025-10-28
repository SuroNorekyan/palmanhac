import type { Dictionary } from "@/lib/i18n/dictionaries";

export function TopBanner({ banner }: { banner: Dictionary["banner"] }) {
  return (
    <div className="bg-[#123A26] py-2 text-sm text-[rgb(var(--primary-foreground))]">
      <div className="container flex items-center justify-center font-medium tracking-wide">
        {banner.freeShipping}
      </div>
    </div>
  );
}
