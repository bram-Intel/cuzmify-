import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';

// Sanitize malformed NEXTAUTH_URL / AUTH_URL placeholders if present
if (typeof process !== 'undefined' && process.env) {
  if (
    process.env.NEXTAUTH_URL &&
    (process.env.NEXTAUTH_URL.includes('<') ||
      process.env.NEXTAUTH_URL.includes('>') ||
      !process.env.NEXTAUTH_URL.startsWith('http') ||
      (Boolean(process.env.NEXT_PUBLIC_ROOT_DOMAIN) && process.env.NEXTAUTH_URL.includes('.vercel.app')))
  ) {
    delete process.env.NEXTAUTH_URL;
  }
  if (
    process.env.AUTH_URL &&
    (process.env.AUTH_URL.includes('<') ||
      process.env.AUTH_URL.includes('>') ||
      !process.env.AUTH_URL.startsWith('http'))
  ) {
    delete process.env.AUTH_URL;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
            authorization: {
              params: {
                prompt: 'select_account',
                access_type: 'offline',
                response_type: 'code',
              },
            },
          }),
        ]
      : []),
    Credentials({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.trim().toLowerCase();
        const password = (credentials?.password as string) || '';
        const nameInput = (credentials?.name as string)?.trim();

        if (!email || !email.includes('@') || password.length < 6) {
          return null;
        }

        const existing = await prisma.user.findUnique({
          where: { email },
          include: {
            accounts: { select: { provider: true } },
            _count: { select: { sites: true } },
          },
        });

        if (existing) {
          if (existing.passwordHash) {
            const valid = verifyPassword(password, existing.passwordHash);
            if (!valid) return null;
            return {
              id: existing.id,
              name: existing.name,
              email: existing.email,
              image: existing.image,
            };
          }

          // Existing OAuth account or account with sites cannot be claimed via password without an existing hash
          if (existing.accounts.length > 0 || existing._count.sites > 0) {
            return null;
          }

          const updated = await prisma.user.update({
            where: { id: existing.id },
            data: {
              passwordHash: hashPassword(password),
              ...(nameInput ? { name: nameInput } : {}),
            },
          });

          return {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            image: updated.image,
          };
        }

        // Brand-new account registration
        const created = await prisma.user.create({
          data: {
            email,
            name: nameInput || email.split('@')[0],
            passwordHash: hashPassword(password),
            onboardingDone: true,
          },
        });

        return {
          id: created.id,
          name: created.name,
          email: created.email,
          image: created.image,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
