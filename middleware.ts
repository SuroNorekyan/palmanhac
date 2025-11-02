// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { defaultLocale, locales } from "@/config/site";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Bypass for assets and API (except we DO protect /admin in this file)
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // ---- ADMIN GATE ----
  if (pathname.startsWith("/admin")) {
    const session = await auth();

    // Not signed in -> send to localized account with callback
    if (!session?.user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${defaultLocale}/account`;
      url.searchParams.set("callbackUrl", pathname + (search || ""));
      return NextResponse.redirect(url);
    }

    // Not admin -> send home (or /403 if you add one)
    if (session.user.role !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = `/${defaultLocale}`;
      url.search = "";
      return NextResponse.redirect(url);
    }

    // 2FA required but not verified -> force challenge (unless already there)
    if (
      session.user.twoFAEnabled &&
      !(session as any).twoFAVerified &&
      !pathname.startsWith("/admin/2fa")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/2fa/challenge";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // ---- LOCALE REDIRECT FOR NON-ADMIN PAGES ----
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (!hasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Match everything except static assets and API (admin is handled explicitly)
export const config = {
  matcher: ["/:path*"],
};
