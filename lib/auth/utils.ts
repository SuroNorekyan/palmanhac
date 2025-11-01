import type { NextRequest } from "next/server";

const SESSION_COOKIE_CANDIDATES = [
  "__Host-palmanhac.session-token",
  "palmanhac.session-token",
];

export const extractSessionToken = (request: NextRequest): string | null => {
  for (const name of SESSION_COOKIE_CANDIDATES) {
    const cookie = request.cookies.get(name);
    if (cookie?.value) {
      return cookie.value;
    }
  }
  return null;
};
