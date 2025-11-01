import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { withLocale } from "@/lib/utils/locale";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);
  const session = await auth();

  if (!session?.user) {
    redirect(
      withLocale(
        locale,
        `/account?callbackUrl=${encodeURIComponent(withLocale(locale, "/checkout"))}`,
      ),
    );
  }

  return <CheckoutView dictionary={dictionary} locale={locale} />;
}
