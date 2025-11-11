import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NavConfig } from "@/config/nav";
import type { Locale, SiteConfig } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { buildAnswerSegments } from "@/lib/utils/faq";
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
  const faqCategories = dictionary.about.faq.categories;

  return (
    <footer className="mt-16 border-t border-[rgb(var(--border))] bg-white/80 backdrop-blur">
      <div className="container grid gap-12 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Palmanhac
            </h3>
            <p className="mt-3 max-w-md text-sm text-[rgb(var(--muted-foreground))]">
              {site.description}
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
        <div className="space-y-6 rounded-3xl border border-[rgb(var(--border))] bg-white/90 p-6 shadow-sm md:col-span-3 md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
                {dictionary.about.faq.title}
              </p>
              <h4 className="mt-3 text-xl font-semibold text-neutral-900">
                {dictionary.about.faq.subtitle}
              </h4>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {faqCategories.map((category) => (
              <div key={category.id} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--primary))]">
                  {category.title}
                </p>
                <div className="space-y-2">
                  {category.items.map((item) => {
                    const segments = buildAnswerSegments(item.answer);

                    return (
                      <details
                        key={item.question}
                        className="group rounded-xl border border-[rgb(var(--border))] bg-white p-4 text-sm text-neutral-700 transition hover:border-[rgb(var(--primary))]"
                      >
                        <summary className="flex cursor-pointer items-center justify-between gap-4 text-left font-medium text-neutral-900 outline-none [&::-webkit-details-marker]:hidden">
                          <span>{item.question}</span>
                          <span className="text-xs text-neutral-400 transition-transform duration-200 group-open:rotate-180">
                            ▾
                          </span>
                        </summary>
                        <div className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-600">
                          {segments.map((segment, segmentIndex) => {
                            if (segment.type === "text") {
                              return <p key={segmentIndex}>{segment.content}</p>;
                            }

                            return (
                              <ul key={segmentIndex} className="space-y-1.5 pl-4">
                                {segment.content.map((value) => (
                                  <li
                                    key={value}
                                    className="list-disc marker:text-[rgb(var(--primary))]"
                                  >
                                    {value}
                                  </li>
                                ))}
                              </ul>
                            );
                          })}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6 rounded-3xl border border-[rgb(var(--border))] bg-white/90 p-6 shadow-sm md:col-span-3 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                {dictionary.footer.addressHeading}
              </p>
              <p className="text-sm leading-relaxed text-neutral-600">
                {dictionary.footer.logisticsBlurb}
              </p>
            </div>
            <div className="space-y-2 text-sm text-neutral-700 md:text-right">
              {dictionary.footer.addressLines.map((line, index) => {
                const emailMatch = line.match(
                  /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/,
                );
                const websiteMatch = line.match(/(www\.[^\s]+)/i);

                if (emailMatch) {
                  const email = emailMatch[1] ?? "";
                  const prefix = line.replace(email, "").trim();
                  return (
                    <p key={`${line}-${index}`}>
                      {prefix ? `${prefix} ` : null}
                      <Link href={`mailto:${email}`} className="hover:underline">
                        {email}
                      </Link>
                    </p>
                  );
                }

                if (websiteMatch) {
                  const siteLabel = websiteMatch[1] ?? "";
                  const prefix = line.replace(siteLabel, "").trim();
                  return (
                    <p key={`${line}-${index}`}>
                      {prefix ? `${prefix} ` : null}
                      <Link
                        href={`https://${siteLabel}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {siteLabel}
                      </Link>
                    </p>
                  );
                }

                return <p key={`${line}-${index}`}>{line}</p>;
              })}
              <Link
                href="https://www.livroreclamacoes.pt"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--primary))] hover:underline md:self-end"
              >
                {dictionary.footer.complaintsBook}
              </Link>
            </div>
          </div>
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
