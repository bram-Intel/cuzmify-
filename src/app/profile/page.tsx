import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { CuzmifyLogo } from '@/components/ui/CuzmifyLogo';
import Link from 'next/link';
import { Globe, Layers, Sliders, LogOut, ShieldCheck, Calendar, Cpu } from 'lucide-react';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  const user = session.user;
  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Profile Header */}
        <div className="bg-[#F7FAFC] rounded-3xl border border-[#E2E8F0] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name ?? 'Profile'}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-[#E2E8F0] shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0D5771] to-[#3498E3] flex items-center justify-center text-white font-extrabold text-2xl font-display shadow-md">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-1.5 -right-1.5">
                <CuzmifyLogo className="w-7 h-7 rounded-lg shadow-sm" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <h1 className="text-xl font-extrabold text-[#1A202C] font-display">
                {user.name ?? 'Cuzmify User'}
              </h1>
              <p className="text-sm text-[#64748B]">{user.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Account
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#0D5771]/10 text-[#0D5771] font-mono text-[10px] font-bold border border-[#0D5771]/20">
                  Bram Intel OS
                </span>
              </div>
            </div>

            {/* Sign Out */}
            <form action="/api/auth/signout" method="POST" className="flex-shrink-0">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#64748B] hover:text-red-600 hover:border-red-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: '/dashboard', icon: Layers, label: 'My Dashboard', desc: 'Manage your sites' },
            { href: '/studio', icon: Sliders, label: 'Visual Studio', desc: 'Edit & customize' },
            { href: '/marketplace', icon: Globe, label: 'Marketplace', desc: 'Browse templates' },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-2xl p-4 hover:border-[#0D5771]/30 hover:shadow-sm transition-all group space-y-2"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0D5771]/10 flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-[#0D5771]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1A202C] font-display group-hover:text-[#0D5771] transition-colors">{label}</p>
                <p className="text-xs text-[#64748B]">{desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Account Details */}
        <div className="bg-[#F7FAFC] rounded-3xl border border-[#E2E8F0] p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-[#1A202C] font-display uppercase tracking-wider">
            Account Details
          </h2>
          <div className="space-y-3 text-xs">
            {[
              { label: 'Full Name', value: user.name ?? '—' },
              { label: 'Email Address', value: user.email ?? '—' },
              { label: 'Auth Provider', value: 'Google' },
              { label: 'Account ID', value: user.id ? `${user.id.slice(0, 8)}...` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[#E2E8F0] last:border-0">
                <span className="font-mono font-bold text-[#64748B] uppercase tracking-wider text-[10px]">{label}</span>
                <span className="font-semibold text-[#1A202C]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust / Security note */}
        <div className="flex items-center gap-2 justify-center text-[11px] text-[#64748B]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Your account is secured by Google OAuth. Cuzmify never stores your password.</span>
        </div>
      </div>
    </div>
  );
}
