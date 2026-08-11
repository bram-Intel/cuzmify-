import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#041017] border-t border-[#1E3A4A] pt-16 pb-12 px-6 text-slate-400">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#72B9F3]" />
            <span className="text-xl font-extrabold text-white tracking-tight font-display">CUZMIFY</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            A composable digital-business marketplace, AI customization engine & deployment platform. Turn any business idea into a live digital business.
          </p>
          <div className="text-xs text-[#72B9F3] flex items-center gap-2 font-mono">
            <Cpu className="w-3.5 h-3.5 text-[#3498E3]" />
            Powered by Bram Intel OS (Cinematic Architecture)
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-display">Mantra</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><span className="text-amber-400 font-bold">1.</span> Choose It</li>
            <li className="flex items-center gap-2"><span className="text-[#72B9F3] font-bold">2.</span> Import It</li>
            <li className="flex items-center gap-2"><span className="text-[#3498E3] font-bold">3.</span> Cuzmify It</li>
            <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">4.</span> Launch It</li>
            <li className="flex items-center gap-2"><span className="text-indigo-400 font-bold">5.</span> Extend It</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-display">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
            <li><Link href="/importer" className="hover:text-white transition-colors">Website Revamp Importer</Link></li>
            <li><Link href="/editor" className="hover:text-white transition-colors">AI Customization Engine</Link></li>
            <li><Link href="/dashboard" className="hover:text-white transition-colors">Module Manager</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-display">Security & Licensing</h4>
          <div className="space-y-3 text-xs leading-relaxed">
            <div className="flex items-start gap-2 bg-[#0D2A38] p-3 rounded-xl border border-[#1E3A4A]">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Signed RSA License Verification protects developer IP and guarantees authentic deployments.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[#1E3A4A]/60 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div>© 2026 Cuzmify. Bram Intel. All rights reserved. Version 3.0</div>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-slate-400">Privacy Policy</Link>
          <Link href="#" className="hover:text-slate-400">Terms of Service</Link>
          <Link href="#" className="hover:text-slate-400">Infrastructure SLA</Link>
        </div>
      </div>
    </footer>
  );
};
