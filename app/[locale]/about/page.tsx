import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildAnswerSegments } from "@/lib/utils/faq";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);

  const { hero, pillars, faq, shippingReturns } = dictionary.about;
  const faqCategories = faq.categories;

  return (
    <section className="space-y-16">
      <div className="grid gap-10 overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-gradient-to-br from-amber-50 via-white to-white p-8 shadow-lg md:grid-cols-[1.4fr_0.9fr] md:p-12">
        <div className="space-y-6">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
            {hero.eyebrow}
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-neutral-900 md:text-5xl">
            {hero.heading}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-neutral-600">
            {hero.description}
          </p>
        </div>
        <div className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-inner backdrop-blur">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
            {dictionary.contact.heading}
          </h2>
          <div className="grid gap-4">
            {hero.contact.map((item) => (
              <div
                key={`${item.label}-${item.value}`}
                className="rounded-2xl bg-neutral-50/80 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {item.label}
                </p>
                {item.href ? (
                  <a
                    href={item.href}
                    className="mt-1 inline-flex text-base font-medium text-[rgb(var(--primary))] hover:underline"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="mt-1 text-base font-medium text-neutral-900">
                    {item.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {pillars.map((pillar) => (
          <article
            key={pillar.title}
            className="group h-full rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[rgb(var(--primary))] hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-neutral-900">{pillar.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              {pillar.description}
            </p>
          </article>
        ))}
      </div>

      <section className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold text-neutral-900">{faq.title}</h2>
          <p className="max-w-3xl text-neutral-600">{faq.subtitle}</p>
        </div>
        <div className="space-y-6">
          {faqCategories.map((category) => (
            <div
              key={category.id}
              id={category.id}
              className="space-y-6 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm md:p-8"
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-[rgb(var(--primary))]">
                  {category.title}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {category.items.map((item) => {
                  const segments = buildAnswerSegments(item.answer);

                  return (
                    <div
                      key={item.question}
                      className="flex h-full flex-col gap-3 rounded-2xl bg-neutral-50/60 p-5"
                    >
                      <h3 className="text-base font-semibold leading-snug text-neutral-900">
                        {item.question}
                      </h3>
                      <div className="space-y-3 text-sm leading-relaxed text-neutral-600">
                        {segments.map((segment, segmentIndex) => {
                          if (segment.type === "text") {
                            return <p key={segmentIndex}>{segment.content}</p>;
                          }

                          return (
                            <ul key={segmentIndex} className="space-y-1.5 pl-4">
                              {segment.content.map((value) => (
                                <li key={value} className="list-disc">
                                  {value}
                                </li>
                              ))}
                            </ul>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold text-neutral-900">
            {shippingReturns.title}
          </h2>
          <p className="max-w-3xl text-neutral-600">{shippingReturns.subtitle}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex h-full flex-col gap-5 rounded-3xl border border-[rgb(var(--border))] bg-gradient-to-br from-white to-neutral-50 p-6 shadow-sm md:p-8">
            <div>
              <h3 className="text-xl font-semibold text-neutral-900">
                {shippingReturns.shipping.title}
              </h3>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-neutral-600">
              {shippingReturns.shipping.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {shippingReturns.shipping.costsTitle}
              </p>
              <ul className="mt-2 space-y-2 text-sm text-neutral-700">
                {shippingReturns.shipping.costs.map((cost) => (
                  <li key={cost} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[rgb(var(--primary))]" />
                    <span>{cost}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2 text-sm leading-relaxed text-neutral-600">
              {shippingReturns.shipping.extraNotes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </div>
          <div className="flex h-full flex-col gap-5 rounded-3xl border border-[rgb(var(--border))] bg-gradient-to-br from-white to-rose-50/60 p-6 shadow-sm md:p-8">
            <div>
              <h3 className="text-xl font-semibold text-neutral-900">
                {shippingReturns.returns.title}
              </h3>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-neutral-600">
              {shippingReturns.returns.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {shippingReturns.returns.exceptionsTitle}
              </p>
              <ul className="mt-2 space-y-2 text-sm text-neutral-700">
                {shippingReturns.returns.exceptions.map((exception) => (
                  <li key={exception} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-rose-400" />
                    <span>{exception}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-neutral-600">
              <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {shippingReturns.returns.supportTitle}
              </p>
              <ul className="space-y-2">
                {shippingReturns.returns.supportDetails.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
