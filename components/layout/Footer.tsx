import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NavConfig } from "@/config/nav";
import type { Locale, SiteConfig } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { withLocale } from "@/lib/utils/locale";

export function Footer({
  nav,
  site,
  dictionary,
  locale,
}: {
  nav: NavConfig;
  site: SiteConfig;
  dictionary: Dictionary;
  locale: Locale;
}) {
  return (
    <footer className="mt-16 border-t border-[rgb(var(--border))] bg-white/80 backdrop-blur">
      <div className="container grid gap-12 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Palmanhac
            </h3>
            <p className="mt-3 max-w-md text-sm text-[rgb(var(--muted-foreground))]">
              {site.description}
            </p>
          </div>
          <div className="space-y-2 text-sm text-neutral-600">
            <p>{site.contact.address}</p>
            <p>
              <Link href={`mailto:${site.contact.email}`} className="hover:underline">
                {site.contact.email}
              </Link>
            </p>
            <p>
              <Link href={`tel:${site.contact.phone}`} className="hover:underline">
                {site.contact.phone}
              </Link>
            </p>
          </div>
          <div className="flex gap-4 text-sm font-medium text-neutral-700">
            <Link href={site.social.instagram} target="_blank" rel="noreferrer">
              Instagram
            </Link>
            <Link href={site.social.facebook} target="_blank" rel="noreferrer">
              Facebook
            </Link>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Explore
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-neutral-700">
            {nav.main.map((item) => (
              <li key={item.href}>
                <Link
                  href={withLocale(locale, item.href)}
                  className="hover:text-neutral-900"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {dictionary.footer.newsletterTitle}
          </h4>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            {dictionary.footer.newsletterDescription}
          </p>
          <form className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder={dictionary.footer.emailPlaceholder}
              required
              className="sm:flex-1"
            />
            <Button type="submit" className="sm:w-auto">
              {dictionary.footer.submit}
            </Button>
          </form>
        </div>
      </div>
      <div className="border-t border-[rgb(var(--border))] bg-white/60 py-6">
        <div className="container flex flex-col gap-4 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between">
          <p>{dictionary.footer.rights}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={withLocale(locale, "/privacy")}
              className="hover:text-neutral-800"
            >
              {dictionary.footer.legalLinks.privacy}
            </Link>
            <Link href={withLocale(locale, "/terms")} className="hover:text-neutral-800">
              {dictionary.footer.legalLinks.terms}
            </Link>
            <Link
              href={withLocale(locale, "/cookies")}
              className="hover:text-neutral-800"
            >
              {dictionary.footer.legalLinks.cookies}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
