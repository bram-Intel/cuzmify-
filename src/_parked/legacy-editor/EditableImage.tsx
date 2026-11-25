'use client';

import React, { useState } from 'react';
import { Camera, Check, X, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

interface EditableImageProps {
  src: string;
  alt: string;
  onChangeImage: (newUrl: string) => void;
  className?: string;
}

const PRESET_BEAUTY_IMAGES = [
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&auto=format&fit=crop&q=80',
];

export const EditableImage: React.FC<EditableImageProps> = ({
  src,
  alt,
  onChangeImage,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState(src);

  const handleSelectPreset = (url: string) => {
    setCustomUrl(url);
    onChangeImage(url);
    setIsOpen(false);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onChangeImage(customUrl);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative group cursor-pointer inline-block w-full h-full">
      <img src={src} alt={alt} className={className} />

      {/* Edit Image Overlay */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1.5 backdrop-blur-xs z-10"
        title="Click to replace image"
      >
        <div className="p-2 rounded-full bg-emerald-500 text-white shadow-lg">
          <Camera className="w-5 h-5" />
        </div>
        <span className="text-xs font-bold font-mono">Replace Image</span>
      </button>

      {/* Image Replacer Modal */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg bg-[#0B0F17] p-6 rounded-3xl border border-slate-700 shadow-2xl text-left space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold font-display">Replace Image</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom URL Input */}
            <form onSubmit={handleSaveCustom} className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Paste Custom Image URL / Instagram Photo</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-white shadow"
                >
                  Apply
                </button>
              </div>
            </form>

            {/* High-Res Presets */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Or Pick High-Res Curated Beauty Photo
              </span>
              <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                {PRESET_BEAUTY_IMAGES.map((imgUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectPreset(imgUrl)}
                    className="relative rounded-xl overflow-hidden border border-slate-700 hover:border-emerald-400 group aspect-video"
                  >
                    <img src={imgUrl} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    {src === imgUrl && (
                      <div className="absolute inset-0 bg-emerald-500/40 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
