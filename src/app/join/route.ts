import { NextResponse, type NextRequest } from "next/server";
import { invitationSchema } from "@/lib/validation";

export function GET(request: NextRequest) {
  const token = invitationSchema.safeParse(request.nextUrl.searchParams.get("token"));
  const response = NextResponse.redirect(new URL(token.success ? "/couple" : "/login?notice=invitation", request.url));
  if (token.success) response.cookies.set("bu_invitation", token.data, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 48 * 3600 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
