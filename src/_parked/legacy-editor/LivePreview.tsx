'use client';

import React from 'react';
import { AIThemeConfig } from '@/core/types';
import { Smartphone, Monitor, Globe, Maximize2, Minimize2 } from 'lucide-react';
import { GmakeupBeautyTemplate } from '@/components/templates/GmakeupBeautyTemplate';

interface LivePreviewProps {
  config: AIThemeConfig;
  onChangeConfig?: (newConfig: AIThemeConfig) => void;
  businessName: string;
  onChangeBusinessName?: (newName: string) => void;
  category: string;
  activeModules: string[];
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  config,
  onChangeConfig,
  businessName,
  onChangeBusinessName,
  category,
  activeModules,
}) => {
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const [isExpanded, setIsExpanded] = React.useState(false);

  const isLight = config.style === 'bram-light' || config.style === 'minimal';
  const bgColor = isLight ? '#FFFFFF' : config.style === 'apple-luxury' ? '#0F172A' : (config.primaryColor || '#071A24');
  const cardBorder = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)';

  return (
    <div className={`flex flex-col h-full bg-[#071A24] rounded-2xl border border-[#1E3A4A] overflow-hidden shadow-2xl transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50 rounded-3xl ring-4 ring-[#0D5771]/50' : ''
    }`}>
      {/* Device Toolbar */}
      <div className="bg-[#0D2A38] px-6 py-3 border-b border-[#1E3A4A] flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-slate-200">
            {businessName ? businessName.toLowerCase().replace(/\s+/g, '') : 'glorybeauty'}.cuzmify.com
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] border border-emerald-500/30">
            SSL Verified
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#071A24] p-1 rounded-xl border border-[#1E3A4A]">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                device === 'desktop' ? 'bg-[#3498E3] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              suppressHydrationWarning
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                device === 'mobile' ? 'bg-[#3498E3] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              suppressHydrationWarning
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-[#071A24] hover:bg-[#1E3A4A] text-slate-200 border border-[#1E3A4A] text-xs font-semibold flex items-center gap-1.5 transition-all"
            title={isExpanded ? 'Exit Full Screen' : 'Full Width View'}
            suppressHydrationWarning
          >
            {isExpanded ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-[#3498E3]" />}
            <span className="hidden md:inline">{isExpanded ? 'Minimize' : 'Full Width'}</span>
          </button>
        </div>
      </div>

      {/* Live Preview Container */}
      <div className="flex-1 bg-[#041017] p-2 sm:p-4 overflow-y-auto flex justify-center items-start">
        <div
          className={`transition-all duration-500 shadow-2xl rounded-2xl overflow-hidden border ${
            device === 'mobile' ? 'w-[375px] min-h-[667px]' : 'w-full min-h-[650px]'
          }`}
          style={{
            backgroundColor: bgColor,
            borderColor: cardBorder,
            fontFamily: config.fontFamily || 'Outfit',
          }}
        >
          <GmakeupBeautyTemplate
            config={config}
            onChangeConfig={onChangeConfig}
            businessName={businessName}
            onChangeBusinessName={onChangeBusinessName}
            activeModules={activeModules}
          />
        </div>
      </div>
    </div>
  );
};
