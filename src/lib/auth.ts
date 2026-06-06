import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { sendErrorAlert } from "@/lib/alert";
import { verifyLoginTicket } from "@/lib/login-ticket";
import { verifyPin } from "@/lib/pin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  // Use JWT for Credentials (PIN), database for Resend (magic link)
  // NextAuth v5 uses JWT by default when Credentials is present
  session: { strategy: "jwt" },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from:   process.env.RESEND_FROM ?? "noreply@razornez.net",
      name:   "PantauDesa",
    }),
    Credentials({
      id:   "pin",
      name: "PIN",
      credentials: {
        email: { type: "email" },
        pin: { type: "password" },
        loginToken: { type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = String(credentials.email).toLowerCase();
        const user = await db.user.findUnique({
          where:  { email },
          select: {
            id: true, email: true, nama: true, name: true,
            username: true,
            role: true, emailVerified: true,
          },
        });
        if (!user || !user.emailVerified) return null;

        const loginToken = typeof credentials.loginToken === "string" ? credentials.loginToken : "";
        const pin = typeof credentials.pin === "string" ? credentials.pin : "";

        if (loginToken) {
          if (!verifyLoginTicket(loginToken, user.id, user.email)) return null;
        } else if (pin) {
          const pinResult = await verifyPin(user.id, pin);
          if (!pinResult.ok) return null;
        } else {
          return null;
        }

        return {
          id:       user.id,
          email:    user.email,
          name:     user.nama ?? user.name ?? "",
          username: user.username ?? "",
          role:     user.role as string,
          // Avatar sengaja tidak masuk JWT agar cookie session tetap kecil.
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id       = user.id;
        const u        = user as Record<string, unknown>;
        token.username = (u.username as string | undefined) ?? "";
        token.role     = (u.role     as string | undefined) ?? "WARGA";
        // Tidak ada token.image; avatar di-fetch dari API saat dibutuhkan.
      }
      return token;
    },
    session({ session, token }) {
      session.user.id       = token.id as string;
      session.user.username = (token.username as string | undefined) ?? "";
      session.user.role     = (token.role     as string | undefined) ?? "WARGA";
      return session;
    },
  },
  events: {
    signIn(message) {
      console.log("[auth] signIn", JSON.stringify({ userId: message.user.id, isNew: message.isNewUser }));
    },
  },
  logger: {
    error(error) {
      const msg = error.message ?? String(error);
      // JWTSessionError / decryption failures = a session cookie that can't be
      // decoded (stale cookie from a rotated/different AUTH_SECRET, or expired).
      // Auth.js self-heals by clearing the session and treating the request as
      // logged-out, so this is benign + recoverable — log locally but do NOT page
      // Sentry/email, otherwise every request with a stale cookie spams alerts.
      const benign = error.name === "JWTSessionError" || /decryption operation failed|JWEDecryptionFailed/i.test(msg);
      if (benign) {
        console.warn("[auth] benign session error (stale/invalid cookie, ignored):", error.name, msg);
        return;
      }
      console.error("[auth] ERROR:", error.name, msg, (error as Error).stack ?? "");
      Sentry.captureException(error, { tags: { source: "next-auth" } });
      sendErrorAlert({
        subject:  `Auth Error: ${error.name}`,
        title:    error.name,
        body:     msg,
        metadata: { stack: (error as Error).stack?.split("\n")[1]?.trim() },
      });
    },
    warn(code)              { console.warn("[auth] WARN:", code); },
    debug(code, metadata)   { console.log("[auth] DEBUG:", code, JSON.stringify(metadata)); },
  },
  pages: {
    signIn:        "/login",
    verifyRequest: "/login/verify",
    newUser:       "/daftar",
    error:         "/login/auth-error",
  },
});
