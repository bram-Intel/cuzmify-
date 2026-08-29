'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Phone,
  Scissors,
  ShoppingBag,
  Store,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Globe,
  Image as ImageIcon,
  Upload,
  Copy,
  Check,
  Maximize2,
} from 'lucide-react';
import { useEditor } from '../engine/EditorContext';
import { SUPPORTED_CURRENCIES, type CurrencyCode, type ServiceItem, type ProductItem, type MediaVaultAsset } from '@/core/blueprint-schema';

export function ModuleConfigModal() {
  const { activeModuleModal, setActiveModuleModal, service, blueprint, setSaveToast } = useEditor();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<'whatsapp' | 'services' | 'products' | 'profile' | 'payments' | 'media'>(
    (activeModuleModal as any) || 'whatsapp'
  );

  useEffect(() => {
    if (activeModuleModal) {
      setActiveTab(activeModuleModal as any);
    }
  }, [activeModuleModal]);

  // Media Vault State
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageName, setNewImageName] = useState('');
  const [newImageType, setNewImageType] = useState<'hero' | 'gallery' | 'service' | 'product'>('gallery');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Service Form State
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('150');
  const [newServiceDuration, setNewServiceDuration] = useState('60');
  const [newServiceTag, setNewServiceTag] = useState('SIGNATURE');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [showAddService, setShowAddService] = useState(false);

  // New Product Form State
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('35');
  const [newProductCategory, setNewProductCategory] = useState('Lashes');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);

  if (!mounted || !activeModuleModal || !service) return null;

  const currentBlueprint = service.getBlueprint();
  const profile = currentBlueprint.profile;
  const whatsapp = currentBlueprint.modules.whatsapp;
  const services = currentBlueprint.modules.services.items;
  const products = currentBlueprint.modules.products.items;
  const mediaVault = currentBlueprint.mediaVault || [];
  const currency = profile.currency || 'USD';
  const currencySymbol = SUPPORTED_CURRENCIES[currency]?.symbol || '$';
  const selectedCompType = service.getSelectedComponentType();

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    service.addServiceItem({
      name: newServiceName.trim(),
      price: parseFloat(newServicePrice) || 50,
      durationMinutes: parseInt(newServiceDuration, 10) || 60,
      locationType: 'in_studio',
      description: newServiceDesc.trim() || 'Professional luxury artistry service.',
      tag: newServiceTag,
      enabled: true,
    });
    setNewServiceName('');
    setNewServiceDesc('');
    setShowAddService(false);
    setSaveToast(`✦ Added Service: ${newServiceName}`);
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    service.addProductItem({
      name: newProductName.trim(),
      price: parseFloat(newProductPrice) || 20,
      category: newProductCategory,
      description: newProductDesc.trim() || 'Premium beauty care product.',
      inStock: true,
      enabled: true,
    });
    setNewProductName('');
    setNewProductDesc('');
    setShowAddProduct(false);
    setSaveToast(`✦ Added Product: ${newProductName}`);
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleUploadLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const newAsset = service.addMediaAsset({
        url: dataUrl,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: newImageType,
        source: 'upload',
      });

      // If an image or element is active on canvas, apply immediately
      const applied = service.applyImageToSelected(dataUrl, newAsset.name);
      if (applied) {
        setSaveToast(`✦ Applied "${newAsset.name}" to selected element!`);
      } else {
        setSaveToast(`✦ Uploaded "${newAsset.name}" to Media Vault!`);
      }
      setTimeout(() => setSaveToast(null), 3000);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;

    const name = newImageName.trim() || 'Curated Asset';
    const newAsset = service.addMediaAsset({
      url: newImageUrl.trim(),
      name,
      type: newImageType,
      source: 'upload',
    });

    const applied = service.applyImageToSelected(newImageUrl.trim(), name);
    if (applied) {
      setSaveToast(`✦ Applied "${name}" to selected element!`);
    } else {
      setSaveToast(`✦ Added "${name}" to Media Vault!`);
    }
    setNewImageUrl('');
    setNewImageName('');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleApplyMediaToCanvas = (asset: MediaVaultAsset) => {
    const applied = service.applyImageToSelected(asset.url, asset.name);
    if (applied) {
      setSaveToast(`✦ Applied "${asset.name}" to canvas!`);
      setTimeout(() => setSaveToast(null), 2500);
    } else {
      setSaveToast(`⚠️ Click on an image or section on the canvas first to select it.`);
      setTimeout(() => setSaveToast(null), 3500);
    }
  };

  const handleDeleteMedia = (id: string, name: string) => {
    service.deleteMediaAsset(id);
    setSaveToast(`Removed ${name} from Media Vault`);
    setTimeout(() => setSaveToast(null), 2000);
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const testWhatsAppUrl = service.generateWhatsAppLink({ type: 'booking' });

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden relative z-50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0D5771]/10 flex items-center justify-center text-[#0D5771]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-sans text-slate-900">Attached Business Infrastructure</h2>
              <p className="text-[11px] text-slate-500 font-mono">Centralized data engine for WhatsApp, services, products & checkout</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModuleModal(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-white overflow-x-auto py-2">
          {[
            { id: 'media' as const, label: `Media Vault (${mediaVault.length})`, icon: <ImageIcon className="w-3.5 h-3.5" /> },
            { id: 'whatsapp' as const, label: 'WhatsApp Engine', icon: <Phone className="w-3.5 h-3.5" /> },
            { id: 'services' as const, label: `Services (${services.length})`, icon: <Scissors className="w-3.5 h-3.5" /> },
            { id: 'products' as const, label: `Products (${products.length})`, icon: <ShoppingBag className="w-3.5 h-3.5" /> },
            { id: 'profile' as const, label: 'Business Profile', icon: <Store className="w-3.5 h-3.5" /> },
            { id: 'payments' as const, label: 'Payments & Checkout', icon: <CreditCard className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#0D5771] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40 font-sans">
          {/* ── 0. MEDIA VAULT & ASSETS TAB ── */}
          {activeTab === 'media' && (
            <div className="space-y-5">
              {/* Selected Element Notice */}
              {selectedCompType && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span>Selected Canvas Element: &lt;{selectedCompType}&gt;</span>
                  </div>
                  <span className="text-[11px] font-medium text-amber-700">
                    Click any photo below to instantly replace it!
                  </span>
                </div>
              )}

              {/* Upload & Add Asset Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                      Upload Photos from Device or URL
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Add photography, portfolio shots, and branding banners to your project media vault.
                    </p>
                  </div>

                  {/* Hidden file input triggered by button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadLocalFile}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] text-white font-bold text-xs flex items-center gap-2 hover:opacity-95 shadow-sm transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from Computer</span>
                  </button>
                </div>

                {/* Direct Image URL Form */}
                <form onSubmit={handleAddImageUrl} className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or image URL"
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                  />
                  <input
                    type="text"
                    value={newImageName}
                    onChange={(e) => setNewImageName(e.target.value)}
                    placeholder="Photo Title (optional)"
                    className="w-full sm:w-44 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                  />
                  <button
                    type="submit"
                    disabled={!newImageUrl.trim()}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Add URL
                  </button>
                </form>
              </div>

              {/* Media Vault Gallery Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                      Project Media Assets ({mediaVault.length})
                    </h3>
                    {profile.instagramHandle && (
                      <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-bold">
                        @{profile.instagramHandle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {profile.instagramHandle && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setSaveToast('🔄 Syncing latest Instagram posts...');
                            const res = await fetch('/api/auth/instagram/sync', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ handle: profile.instagramHandle }),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              if (data.mediaVault && data.mediaVault.length > 0) {
                                service.injectInstagramMediaToCanvas(data.mediaVault);
                                setSaveToast(`✓ Synced ${data.mediaCount} Instagram posts!`);
                              } else {
                                setSaveToast('✓ Instagram feed is up to date.');
                              }
                            }
                          } catch {
                            setSaveToast('Could not sync Instagram feed.');
                          }
                          setTimeout(() => setSaveToast(null), 3000);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Sync Instagram Posts</span>
                      </button>
                    )}
                    <span className="text-[11px] text-slate-400">
                      Hover card to apply
                    </span>
                  </div>
                </div>

                {mediaVault.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">No media uploaded yet</p>
                    <p className="text-[11px] text-slate-400">
                      Upload your high-res photos or import from Instagram to build your media catalog.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {mediaVault.map((asset) => {
                      const isCopied = copiedId === asset.id;
                      return (
                        <div
                          key={asset.id}
                          className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                        >
                          <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                            <img
                              src={asset.url}
                              alt={asset.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />

                            {/* Badge */}
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono uppercase">
                              {asset.source === 'instagram' ? 'Instagram' : asset.type}
                            </span>

                            {/* Hover Overlay with Action Buttons */}
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleApplyMediaToCanvas(asset)}
                                className="w-full py-1.5 px-2.5 rounded-lg bg-[#0D5771] hover:bg-[#083D50] text-white text-[11px] font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Check className="w-3 h-3" />
                                <span>Apply to Canvas</span>
                              </button>

                              <div className="flex items-center gap-1.5 w-full">
                                <button
                                  type="button"
                                  onClick={() => handleCopyUrl(asset.url, asset.id)}
                                  className="flex-1 py-1 px-2 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                  {isCopied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMedia(asset.id, asset.name)}
                                  className="p-1 rounded-lg bg-red-500/80 hover:bg-red-600 text-white text-[10px] transition-all cursor-pointer"
                                  title="Delete asset"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="p-2 bg-white">
                            <p className="text-[11px] font-bold text-slate-800 truncate" title={asset.name}>
                              {asset.name}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 1. WHATSAPP ENGINE TAB ── */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Direct Booking & Conversion Formula</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Changing your phone number or message formulas here updates all booking buttons across the entire website instantly.
                  </p>
                </div>
                <a
                  href={testWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">WhatsApp Phone Number (International)</label>
                  <input
                    type="text"
                    value={whatsapp.phoneNumber}
                    onChange={(e) => service.updateWhatsAppConfig({ phoneNumber: e.target.value })}
                    placeholder="e.g. 18005554526 or 2348012345678"
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                  />
                  <span className="text-[10px] text-slate-400">Include country code without &apos;+&apos; or spaces.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Floating WhatsApp Widget</label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whatsapp.floatingWidgetEnabled}
                        onChange={(e) => service.updateWhatsAppConfig({ floatingWidgetEnabled: e.target.checked })}
                        className="w-4 h-4 rounded text-[#0D5771] accent-[#0D5771]"
                      />
                      <span>Enable Floating Widget on Live Site</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700">
                  Default Booking Message Formula <span className="text-slate-400 font-normal">({'{businessName}'}, {'{serviceName}'}, {'{price}'})</span>
                </label>
                <textarea
                  rows={3}
                  value={whatsapp.defaultBookingTemplate}
                  onChange={(e) => service.updateWhatsAppConfig({ defaultBookingTemplate: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  Product Order Message Formula <span className="text-slate-400 font-normal">({'{businessName}'}, {'{productName}'}, {'{price}'})</span>
                </label>
                <textarea
                  rows={2}
                  value={whatsapp.defaultProductOrderTemplate}
                  onChange={(e) => service.updateWhatsAppConfig({ defaultProductOrderTemplate: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                />
              </div>
            </div>
          )}

          {/* ── 2. SERVICES CATALOG TAB ── */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase font-mono">Active Service Catalog</h3>
                  <p className="text-[11px] text-slate-500">Service items can be attached to booking buttons, cards, and AI prompts.</p>
                </div>
                <button
                  onClick={() => setShowAddService(!showAddService)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D5771] text-white text-xs font-bold hover:bg-[#0D5771]/90 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Service</span>
                </button>
              </div>

              {/* Add Service Form */}
              {showAddService && (
                <form onSubmit={handleAddService} className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Service Name</label>
                      <input
                        type="text"
                        required
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="e.g. Bridal Glam Consultation"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Price ({currencySymbol})</label>
                      <input
                        type="number"
                        required
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Duration (Minutes)</label>
                      <input
                        type="number"
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Badge Tag</label>
                      <select
                        value={newServiceTag}
                        onChange={(e) => setNewServiceTag(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                      >
                        <option value="SIGNATURE">SIGNATURE</option>
                        <option value="BRIDAL">BRIDAL</option>
                        <option value="VIP">VIP</option>
                        <option value="POPULAR">POPULAR</option>
                        <option value="NEW">NEW</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Description</label>
                      <input
                        type="text"
                        value={newServiceDesc}
                        onChange={(e) => setNewServiceDesc(e.target.value)}
                        placeholder="Short summary of what's included"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddService(false)}
                      className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold bg-[#0D5771] text-white rounded-lg hover:bg-[#0D5771]/90 cursor-pointer"
                    >
                      Save Service
                    </button>
                  </div>
                </form>
              )}

              {/* Service Cards List */}
              <div className="grid grid-cols-1 gap-2.5">
                {services.map((srv) => (
                  <div key={srv.id} className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="space-y-1 max-w-[70%]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{srv.name}</span>
                        {srv.tag && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {srv.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{srv.description}</p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                        {srv.durationMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{srv.durationMinutes} mins</span>
                          </span>
                        )}
                        <span>•</span>
                        <span className="capitalize">{srv.locationType.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono font-bold text-[#0D5771]">
                        {currencySymbol}{srv.price}
                      </span>
                      <button
                        onClick={() => service.deleteServiceItem(srv.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Delete Service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 3. PRODUCTS CATALOG TAB ── */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase font-mono">Physical & Digital Product Catalog</h3>
                  <p className="text-[11px] text-slate-500">Products connect to Shopping Cart, WhatsApp Orders, and Online Payments.</p>
                </div>
                <button
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D5771] text-white text-xs font-bold hover:bg-[#0D5771]/90 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Add Product Form */}
              {showAddProduct && (
                <form onSubmit={handleAddProduct} className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Product Name</label>
                      <input
                        type="text"
                        required
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        placeholder="e.g. Silk Lashes or Glow Mist"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Price ({currencySymbol})</label>
                      <input
                        type="number"
                        required
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Category</label>
                      <input
                        type="text"
                        value={newProductCategory}
                        onChange={(e) => setNewProductCategory(e.target.value)}
                        placeholder="e.g. Skincare, Lashes"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600">Description</label>
                    <input
                      type="text"
                      value={newProductDesc}
                      onChange={(e) => setNewProductDesc(e.target.value)}
                      placeholder="Short product features summary"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddProduct(false)}
                      className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold bg-[#0D5771] text-white rounded-lg hover:bg-[#0D5771]/90 cursor-pointer"
                    >
                      Save Product
                    </button>
                  </div>
                </form>
              )}

              {/* Product Cards List */}
              <div className="grid grid-cols-1 gap-2.5">
                {products.map((prd) => (
                  <div key={prd.id} className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="space-y-1 max-w-[70%]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{prd.name}</span>
                        {prd.category && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-700">
                            {prd.category}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1 rounded">In Stock</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{prd.description}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono font-bold text-[#0D5771]">
                        {currencySymbol}{prd.price}
                      </span>
                      <button
                        onClick={() => service.deleteProductItem(prd.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 4. BUSINESS PROFILE & CURRENCY TAB ── */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Business Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => service.updateProfile({ name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Primary Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => service.updateProfile({ currency: e.target.value as CurrencyCode })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771] font-mono"
                  >
                    {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tagline / Mission</label>
                <input
                  type="text"
                  value={profile.tagline}
                  onChange={(e) => service.updateProfile({ tagline: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => service.updateProfile({ email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">City / Location</label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => service.updateProfile({ city: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── 5. PAYMENTS & CHECKOUT TAB ── */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Secure Payment Gateways (Paystack, Flutterwave & Stripe)</span>
                </div>
                <p className="text-[11px] text-indigo-700">
                  Connect online checkout to accept automated credit cards, Apple Pay, and mobile bank transfers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Payment Gateway Mode</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    Live Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  WhatsApp checkout is currently enabled as primary. Online automated payments can be connected with your API public key.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/80">
          <span className="text-[11px] text-slate-500 font-mono">
            ✦ All updates save automatically to your project blueprint
          </span>
          <button
            onClick={() => setActiveModuleModal(null)}
            className="px-5 py-1.5 rounded-xl bg-[#0D5771] text-white text-xs font-bold hover:bg-[#0D5771]/90 transition-all cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
