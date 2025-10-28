import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);

  return (
    <section className="mx-auto max-w-lg space-y-8 rounded-3xl border border-[rgb(var(--border))] bg-white p-8 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-neutral-900">
          {dictionary.account.heading}
        </h1>
        <p className="text-sm text-neutral-600">{dictionary.account.subheading}</p>
      </div>
      <form className="space-y-4">
        <div>
          <Label htmlFor="account-email">{dictionary.account.email}</Label>
          <Input id="account-email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="account-password">{dictionary.account.password}</Label>
          <Input id="account-password" name="password" type="password" required />
        </div>
        <Button type="submit" className="w-full">
          {dictionary.account.login}
        </Button>
      </form>
      <div className="text-center text-sm text-neutral-500">
        <Link href="#" className="font-medium text-neutral-800">
          {dictionary.account.createAccount}
        </Link>
      </div>
    </section>
  );
}
