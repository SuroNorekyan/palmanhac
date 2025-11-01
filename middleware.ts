import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/config/site";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    return handleAdmin(request);
  }

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

const buildLoginRedirect = (request: NextRequest) => {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = `/${defaultLocale}/account`;
  loginUrl.searchParams.set(
    "callbackUrl",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return loginUrl;
};

const SESSION_COOKIE_NAMES = [
  "__Host-palmanhac.session-token",
  "palmanhac.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

const hasSessionCookie = (request: NextRequest) => {
  return SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));
};

const ADMIN_ALLOWED_PATHS = ["/admin/2fa/setup", "/admin/2fa/challenge"];

const handleAdmin = (request: NextRequest) => {
  if (
    !hasSessionCookie(request) &&
    !ADMIN_ALLOWED_PATHS.some((path) => request.nextUrl.pathname.startsWith(path))
  ) {
    const loginUrl = buildLoginRedirect(request);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/:path*"],
};
