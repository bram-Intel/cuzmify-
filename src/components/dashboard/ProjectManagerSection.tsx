'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Globe, Plus, Clock, ExternalLink, Trash2, Loader2, Sparkles, X, Check } from 'lucide-react';
import type { SiteRecord } from '@/app/dashboard/page';

interface ProjectManagerSectionProps {
  sites: SiteRecord[];
}

export function ProjectManagerSection({ sites: initialSites }: ProjectManagerSectionProps) {
  const router = useRouter();
  const [sites, setSites] = useState<SiteRecord[]>(initialSites);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newCategory, setNewCategory] = useState('Beauty & Wellness');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          category: newCategory,
        }),
      });
      const data = await res.json();
      if (data.success && data.site) {
        setShowNewModal(false);
        router.push(`/studio?projectId=${data.site.id}`);
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (siteId: string, siteName: string) => {
    if (!confirm(`Are you sure you want to delete "${siteName}"? This cannot be undone.`)) return;

    setDeletingId(siteId);
    try {
      const res = await fetch(`/api/sites?siteId=${siteId}`, { method: 'DELETE' });
      if (res.ok) {
        setSites((prev) => prev.filter((s) => s.id !== siteId));
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to delete site:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1A202C] font-display flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#0D5771]" />
          <span>Your Websites ({sites.length})</span>
        </h2>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((site) => {
          const cleanSubdomain = (site.subdomain || site.name.toLowerCase().replace(/[^a-z0-9]/g, '')).slice(0, 30);
          const isLive = site.status === 'live';
          const displayUrl = `${cleanSubdomain}.cuzmify.com`;

          return (
            <div
              key={site.id}
              className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#0D5771]/30 transition-all space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase">
                  {site.category}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isLive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isLive ? 'LIVE' : 'DRAFT'}
                  </span>
                  <button
                    onClick={() => handleDeleteProject(site.id, site.name)}
                    disabled={deletingId === site.id}
                    className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Delete website"
                  >
                    {deletingId === site.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#1A202C]">{site.name}</h3>
                <p className="text-[11px] text-[#0D5771] font-mono truncate mt-0.5">
                  {displayUrl}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] font-mono">
                <Clock className="w-3 h-3" />
                <span>Updated {new Date(site.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#F1F5F9]">
                <Link
                  href={`/studio?projectId=${site.id}`}
                  className="flex-1 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#0D5771]/10 text-[#0D5771] font-bold text-xs text-center border border-[#E2E8F0] transition-colors"
                >
                  Edit in Studio
                </Link>
                <Link
                  href={`/s/${cleanSubdomain}`}
                  target="_blank"
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#0D5771] transition-colors"
                  title="Visit Website"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0D5771]/10 flex items-center justify-center text-[#0D5771]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A202C]">Create New Brand / Project</h3>
                  <p className="text-[11px] text-[#64748B]">Spins up an independent business profile &amp; subdomain.</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[#1A202C] block mb-1">
                  Business / Brand Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lash Queen Studio"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#0D5771]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#1A202C] block mb-1">
                  Category / Niche
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs bg-white focus:outline-none focus:border-[#0D5771]"
                >
                  <option value="Beauty & Wellness">Beauty &amp; Wellness</option>
                  <option value="Music & Audio Studio">Music &amp; Audio Studio</option>
                  <option value="Fashion & Apparel">Fashion &amp; Apparel</option>
                  <option value="Creative Agency">Creative Agency</option>
                  <option value="General">General Business</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newProjectName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Create Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
