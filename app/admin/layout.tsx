// app/admin/layout.tsx
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Providers } from "@/components/layout/Providers";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-[#F6F7F9] pb-16">
        <div className="mx-auto w-full max-w-6xl px-6">
          <AdminNav />
          <main className="py-8">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
