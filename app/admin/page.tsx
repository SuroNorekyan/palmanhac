import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminOrdersManager } from "@/components/admin/AdminOrdersManager";
import { AdminProductManager } from "@/components/admin/AdminProductManager";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  if (session.user.twoFAEnabled && !session.twoFAVerified) {
    redirect("/admin/2fa/challenge");
  }

  const dictionaryEn = getDictionary("en");
  const dictionaryPt = getDictionary("pt");

  return (
    <div className="space-y-10">
      <section className="space-y-3 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900">
              Admin Dashboard / Painel de Administração
            </h1>
            <p className="text-sm text-neutral-600">
              {dictionaryEn.account.dashboard.manageAccount}
              <br />
              {dictionaryPt.account.dashboard.manageAccount}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/2fa/setup">2FA Setup / Configuração 2FA</Link>
          </Button>
        </header>
        <div className="grid gap-4 text-sm text-neutral-700 sm:grid-cols-3">
          <div>
            <p className="text-neutral-500">Two-Factor Status / Estado 2FA</p>
            <p className="font-semibold text-neutral-900">
              {session.user.twoFAEnabled ? "Enabled / Ativa" : "Disabled / Desativada"}
            </p>
          </div>
          <div>
            <p className="text-neutral-500">Session</p>
            <p className="font-semibold text-neutral-900">
              {session.user.email ?? session.user.id}
            </p>
          </div>
          <div>
            <p className="text-neutral-500">Security Docs / Documentação</p>
            <code className="rounded bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-900">
              docs/admin-2fa-setup.md
            </code>
          </div>
        </div>
      </section>
      <AdminProductManager />
      <AdminOrdersManager />
    </div>
  );
}
