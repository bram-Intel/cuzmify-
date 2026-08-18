import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

// Ensure NEXTAUTH_URL and AUTH_URL are valid or omitted for trustHost
if (typeof process !== 'undefined' && process.env) {
  if (process.env.NEXTAUTH_URL && (process.env.NEXTAUTH_URL.includes('<') || process.env.NEXTAUTH_URL.includes('>') || !process.env.NEXTAUTH_URL.startsWith('http'))) {
    delete process.env.NEXTAUTH_URL;
  }
  if (process.env.AUTH_URL && (process.env.AUTH_URL.includes('<') || process.env.AUTH_URL.includes('>') || !process.env.AUTH_URL.startsWith('http'))) {
    delete process.env.AUTH_URL;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'cuzmify-bram-intel-secret-production-32-chars',
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
      name: 'Email or Fast Login',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        name: { label: 'Name', type: 'text', placeholder: 'Your Name' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.trim() || 'creator@cuzmify.local';
        const name = (credentials?.name as string)?.trim() || 'Cuzmify Creator';

        // Upsert user in database
        const user = await prisma.user.upsert({
          where: { email },
          update: { name },
          create: {
            email,
            name,
            onboardingDone: true,
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
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
