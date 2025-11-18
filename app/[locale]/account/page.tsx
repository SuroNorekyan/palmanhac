import { auth } from "@/auth";
import { AccountAuthPanel } from "@/components/account/AccountAuthPanel";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { withLocale } from "@/lib/utils/locale";

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ callbackUrl?: string; mode?: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);
  const resolvedSearch = (await searchParams) ?? {};
  const session = await auth();
  const callbackUrl = resolvedSearch.callbackUrl ?? withLocale(locale, "/account");
  const initialMode = resolvedSearch.mode === "register" ? "register" : "login";

  if (!session?.user) {
    return (
      <AccountAuthPanel
        dictionary={dictionary}
        locale={locale}
        callbackUrl={callbackUrl}
        initialMode={initialMode}
      />
    );
  }

  return (
    <AccountDashboard
      dictionary={dictionary}
      locale={locale}
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as { role?: string }).role,
      }}
    />
  );
}
