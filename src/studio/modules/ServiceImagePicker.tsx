'use client';

import React, { useRef, useState } from 'react';
import { Film, Image as ImageIcon, Link2, Loader2, Play, Trash2, UploadCloud } from 'lucide-react';
import type { MediaVaultAsset } from '@/core/blueprint-schema';
import {
  getAssetPosterUrl,
  getAssetRenderSource,
  isVideoMediaUrl,
  resolveAssetMediaKind,
} from '@/core/media-utils';
import { compressImageFileToWebP } from '@/lib/image-compress';

interface ServiceImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  mediaVault: MediaVaultAsset[];
  onUploadToVault?: (dataUrl: string, name: string, mediaKind?: 'image' | 'video', mimeType?: string) => void;
  label?: string;
}

/**
 * Reusable photo & video picker for Service Create & Edit forms:
 * supports device upload (images WebP-compressed or MP4/WebM/MOV videos saved to Media Vault),
 * direct https:// URL entry, and 1-tap selection from existing Media Vault assets.
 */
export function ServiceImagePicker({
  value,
  onChange,
  mediaVault,
  onUploadToVault,
  label = 'Service Photo or Video (optional)',
}: ServiceImagePickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('Media file exceeds 15MB. Please pick a smaller image or video.');
      return;
    }
    setUploading(true);
    try {
      const isVideo = file.type.startsWith('video/');
      const dataUrl = isVideo
        ? await new Promise<string>((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result as string);
            reader.onerror = rej;
            reader.readAsDataURL(file);
          })
        : await compressImageFileToWebP(file, 1200, 0.8);
      const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
      const defaultLabel = isVideo ? 'Service Video' : 'Service Photo';
      const cleanName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : defaultLabel;
      onChange(dataUrl);
      onUploadToVault?.(dataUrl, cleanName, isVideo ? 'video' : 'image', file.type || undefined);
    } catch {
      alert('Failed to process media file.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const applyDraftUrl = () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setUrlDraft('');
    setShowUrlInput(false);
  };

  const vaultAssets = mediaVault.filter((m) => Boolean(getAssetRenderSource(m)));
  const currentIsVideo = Boolean(value && isVideoMediaUrl(value));

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
          {currentIsVideo ? (
            <Film className="w-3.5 h-3.5 text-[#0D5771]" />
          ) : (
            <ImageIcon className="w-3.5 h-3.5 text-[#0D5771]" />
          )}
          <span>{label}</span>
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove media</span>
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shrink-0">
            {currentIsVideo ? (
              <video
                src={value}
                muted
                loop
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="Service preview" className="w-full h-full object-cover" />
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:border-[#0D5771] hover:bg-[#0D5771]/5 flex flex-col items-center justify-center text-slate-400 hover:text-[#0D5771] transition-all cursor-pointer shrink-0"
            title="Upload service photo or video"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            <span className="text-[9px] font-bold mt-0.5">{uploading ? '...' : 'Add'}</span>
          </button>
        )}

        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px]">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
            <span>{value ? 'Replace Upload' : 'Upload Photo / Video'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowUrlInput((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Paste URL</span>
          </button>
        </div>
      </div>

      {showUrlInput && (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyDraftUrl();
              }
            }}
            placeholder="https://example.com/service-photo.jpg"
            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
          />
          <button
            type="button"
            onClick={applyDraftUrl}
            disabled={!urlDraft.trim()}
            className="px-3 py-1.5 rounded-xl bg-[#0D5771] text-white text-[11px] font-bold disabled:opacity-50 cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}

      {vaultAssets.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Or pick from Media Vault ({vaultAssets.length})
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {vaultAssets.slice(0, 12).map((asset) => {
              const mediaSrc = getAssetRenderSource(asset);
              const poster = getAssetPosterUrl(asset);
              const kind = resolveAssetMediaKind(asset);
              const isSelected =
                value === mediaSrc ||
                value === asset.url ||
                (Boolean(poster) && value === poster);
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onChange(mediaSrc)}
                  title={asset.name}
                  className={`relative w-11 h-11 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-slate-900 ${
                    isSelected ? 'border-[#0D5771] ring-2 ring-[#0D5771]/30' : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {kind === 'video' ? (
                    poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={poster} alt={asset.name} className="w-full h-full object-cover opacity-85" />
                    ) : (
                      <video src={mediaSrc} muted playsInline preload="metadata" className="w-full h-full object-cover opacity-85" />
                    )
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaSrc} alt={asset.name} className="w-full h-full object-cover" />
                  )}
                  {kind === 'video' && (
                    <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/75 text-white flex items-center justify-center">
                      <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
