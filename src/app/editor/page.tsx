'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LivePreview } from '@/components/editor/LivePreview';
import { VisualControls } from '@/components/editor/VisualControls';
import { AIThemeConfig, BusinessCategory } from '@/core/types';
import { AIService } from '@/services/ai/ai-service';
import { DeploymentOrchestrator, DeploymentStatus } from '@/services/deployment/deployment-orchestrator';
import { Sparkles, CheckCircle2, Rocket, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function EditorContent() {
  const searchParams = useSearchParams();
  const importName = searchParams.get('importName');
  const templateName = searchParams.get('template');

  const [businessName, setBusinessName] = React.useState(
    importName || (templateName ? `Glory Beauty (${templateName})` : 'Glory Beauty Studio')
  );
  const [category, setCategory] = React.useState<BusinessCategory>('Makeup Artist');
  const [activeModules, setActiveModules] = React.useState<string[]>(['CATALOG', 'BOOKING']);

  const [config, setConfig] = React.useState<AIThemeConfig>(() =>
    AIService.getDefaultCategoryTheme('Makeup Artist', businessName)
  );

  const [isDeploying, setIsDeploying] = React.useState(false);
  const [deploymentResult, setDeploymentResult] = React.useState<DeploymentStatus | null>(null);

  const handleToggleModule = (mType: string) => {
    if (activeModules.includes(mType)) {
      setActiveModules(activeModules.filter((m) => m !== mType));
    } else {
      setActiveModules([...activeModules, mType]);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const domain = `${slug || 'glorybeauty'}.cuzmify.com`;
      const status = await DeploymentOrchestrator.triggerDeployment('proj_1', domain);
      setDeploymentResult(status);
    } catch {
      // error
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-[#131A29] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white font-display">Cuzmify AI Visual Editor</h1>
            <p className="text-xs text-slate-400">Live composition & structured AI customization engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Infrastructure Abstracted
          </span>
        </div>
      </div>

      {/* Main Grid Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visual Controls Panel */}
        <div className="lg:col-span-5">
          <VisualControls
            config={config}
            onChangeConfig={setConfig}
            businessName={businessName}
            onChangeBusinessName={setBusinessName}
            category={category}
            onChangeCategory={setCategory}
            activeModules={activeModules}
            onToggleModule={handleToggleModule}
            onDeploy={handleDeploy}
            isDeploying={isDeploying}
          />
        </div>

        {/* Live Renderer Panel */}
        <div className="lg:col-span-7 h-[85vh]">
          <LivePreview
            config={config}
            businessName={businessName}
            category={category}
            activeModules={activeModules}
          />
        </div>
      </div>

      {/* Deployment Modal */}
      {deploymentResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0B0F17] p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <Rocket className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white font-display">Your Digital Business Is Live!</h2>
              <p className="text-xs text-slate-400">Deployed to Cuzmify Cloud CDN with automated SSL & health checks.</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs text-slate-300">
              <div className="text-slate-400 font-sans font-semibold mb-1">Deployment Logs:</div>
              {deploymentResult.logs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{log}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <a
                href={deploymentResult.targetUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"
              >
                <span>Visit Live Project</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <Link
                href="/dashboard"
                className="block text-center w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800"
              >
                Go To My Business Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading Cuzmify AI Visual Editor...</div>}>
      <EditorContent />
    </Suspense>
  );
}
