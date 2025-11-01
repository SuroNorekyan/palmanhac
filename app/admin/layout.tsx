import type { ReactNode } from "react";
import { Providers } from "@/components/layout/Providers";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-[#F6F7F9] py-12">
        <div className="mx-auto w-full max-w-6xl px-6">{children}</div>
      </div>
    </Providers>
  );
}
