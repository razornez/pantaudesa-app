"use client";

/**
 * Thin wrapper around NextAuth useSession so the rest of the app
 * keeps using useAuth() without knowing about NextAuth internals.
 */

import { createContext, useContext, ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";

export type UserRole = "WARGA" | "DESA" | "ADMIN" | "INTERNAL_ADMIN";

export interface AuthUser {
  id:           string;
  nama:         string;
  username:     string;
  email:        string;
  role:         UserRole;
  avatarUrl?:   string;
  bio?:         string;
  joinedAt?:    Date;
  desaId?:      string;
  desaNama?:    string;
  /** true when user logged in but hasn't completed /daftar yet */
  isIncomplete: boolean;
}

interface AuthCtx {
  user:    AuthUser | null;
  logout:  () => void;
  loading: boolean;
}

const Ctx = createContext<AuthCtx>({ user: null, logout: () => {}, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const user: AuthUser | null = session?.user
    ? {
        id:           session.user.id,
        nama:         session.user.name ?? session.user.username ?? "",
        username:     session.user.username ?? "",
        email:        session.user.email ?? "",
        role:         (session.user.role as UserRole) ?? "WARGA",
        avatarUrl:    session.user.image ?? undefined,
        isIncomplete: !session.user.username,
      }
    : null;

  const logout = () => signOut({ callbackUrl: "/" });

  return (
    <Ctx.Provider value={{ user, logout, loading: status === "loading" }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
