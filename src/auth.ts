import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  providers: [
    CredentialsProvider({
      name: "Email и пароль",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        try {
          const email = credentials.email.trim().toLowerCase();
          const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
          if (!user || !(await compare(credentials.password, user.passwordHash))) return null;
          return { id: user.id, email: user.email, name: user.name };
        } catch (error) {
          console.error("Credentials authorization failed:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) token.sub = user.id; return token; },
    async session({ session, token }) { if (session.user && token.sub) session.user.id = token.sub; return session; },
  },
};
