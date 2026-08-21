'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
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
  Save,
  Check,
  Image as ImageIcon,
  Film,
  Instagram,
  UploadCloud,
  Copy,
} from 'lucide-react';
import { useEditor } from '../engine/EditorContext';
import { SUPPORTED_CURRENCIES, type CurrencyCode, type ServiceItem, type ProductItem, type MediaVaultAsset } from '@/core/blueprint-schema';

export function StudioInfrastructureHub({
  onClose,
  initialTab = 'whatsapp',
}: {
  onClose: () => void;
  initialTab?: 'whatsapp' | 'services' | 'products' | 'media' | 'profile' | 'payments';
}) {
  const { service, setSaveToast, handleSave } = useEditor();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<'whatsapp' | 'services' | 'products' | 'media' | 'profile' | 'payments'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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

  // Media Vault State
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaName, setNewMediaName] = useState('');
  const [newMediaType, setNewMediaType] = useState<'hero' | 'gallery' | 'service' | 'product' | 'general' | 'video' | 'testimonial'>('gallery');
  const [newMediaSource, setNewMediaSource] = useState<'instagram' | 'upload' | 'unsplash' | 'template'>('upload');
  const [newMediaCaption, setNewMediaCaption] = useState('');
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'instagram' | 'upload' | 'video' | 'service'>('all');
  const [mediaUploadMode, setMediaUploadMode] = useState<'file' | 'url'>('file');
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB. Please choose a smaller image or compressed video clip.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedFilePreview(dataUrl);
      setNewMediaUrl(dataUrl);
      const isVideo = file.type.startsWith('video/');
      if (!newMediaName) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setNewMediaName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
      if (isVideo) {
        setNewMediaType('video');
      }
      setNewMediaSource('upload');
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  if (!mounted || !service) return null;

  const currentBlueprint = service.getBlueprint();
  const profile = currentBlueprint.profile;
  const whatsapp = currentBlueprint.modules.whatsapp;
  const services = currentBlueprint.modules.services.items;
  const products = currentBlueprint.modules.products.items;
  const mediaVault = currentBlueprint.mediaVault || [];
  const currency = profile.currency || 'USD';
  const currencySymbol = SUPPORTED_CURRENCIES[currency]?.symbol || '$';

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

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl.trim()) return;
    service.addMediaAsset({
      url: newMediaUrl.trim(),
      name: newMediaName.trim() || 'Visual Asset',
      type: newMediaType,
      source: newMediaSource,
      caption: newMediaCaption.trim(),
    });
    setNewMediaUrl('');
    setNewMediaName('');
    setNewMediaCaption('');
    setShowAddMedia(false);
    setSaveToast(`✦ Added Media: ${newMediaName || 'Asset'}`);
    setTimeout(() => setSaveToast(null), 2500);
  };

  const testWhatsAppUrl = service.generateWhatsAppLink({ type: 'booking' });

  const handleCloseAndSync = () => {
    service.syncCanvasWithBlueprint();
    handleSave(true);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100000] bg-[#F8FAFC] flex flex-col text-slate-900 font-sans animate-in fade-in duration-200">
      {/* ── Top Bar ── */}
      <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCloseAndSync}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#0D5771]" />
            <span>Back to Visual Canvas</span>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">{profile.name || 'Studio'}</span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                Live Edge Infrastructure
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">Centralized Commerce, Booking &amp; Business Blueprint Core</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCloseAndSync}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>Done &amp; Return to Studio</span>
          </button>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 space-y-1 shrink-0 overflow-y-auto">
          <div className="px-3 py-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              Business Modules
            </span>
          </div>

          {[
            { id: 'whatsapp' as const, label: 'WhatsApp Booking Engine', desc: 'Pre-filled format & phone routing', icon: <Phone className="w-4 h-4" /> },
            { id: 'services' as const, label: `Services Catalog (${services.length})`, desc: 'Durations, pricing & booking tiers', icon: <Scissors className="w-4 h-4" /> },
            { id: 'products' as const, label: `Products Catalog (${products.length})`, desc: 'E-commerce items & stock tracking', icon: <ShoppingBag className="w-4 h-4" /> },
            { id: 'media' as const, label: `Media Vault (${mediaVault.length})`, desc: 'Instagram imports, uploads & videos', icon: <ImageIcon className="w-4 h-4" /> },
            { id: 'profile' as const, label: 'Business Profile & Currency', desc: 'Identity, contacts & currency symbol', icon: <Store className="w-4 h-4" /> },
            { id: 'payments' as const, label: 'Online Payments & Checkout', desc: 'Paystack, Flutterwave & Stripe', icon: <CreditCard className="w-4 h-4" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 ${
                  isActive
                    ? 'bg-[#0D5771] text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {tab.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{tab.label}</p>
                  <p className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{tab.desc}</p>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 max-w-5xl">
          {/* ── 1. WHATSAPP TAB ── */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-950 font-display">
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                    <span>WhatsApp Conversational Booking &amp; Order Engine</span>
                  </div>
                  <p className="text-xs text-emerald-800 max-w-2xl leading-relaxed">
                    Changing your phone number or message formulas here updates all booking buttons across your website automatically.
                  </p>
                </div>

                <a
                  href={testWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shrink-0"
                >
                  <span>Test WhatsApp Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">
                    WhatsApp Phone Number (International)
                  </label>
                  <input
                    type="text"
                    value={whatsapp.phoneNumber}
                    onChange={(e) => service.updateWhatsAppConfig({ phoneNumber: e.target.value })}
                    placeholder="e.g. 18005554526 or 2348012345678"
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                  />
                  <p className="text-[11px] text-slate-400">Include country code without &apos;+&apos; or spaces.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">
                    Floating Widget Setting
                  </label>
                  <div className="pt-2">
                    <label className="flex items-center gap-3 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whatsapp.floatingWidgetEnabled}
                        onChange={(e) => service.updateWhatsAppConfig({ floatingWidgetEnabled: e.target.checked })}
                        className="w-4 h-4 rounded text-[#0D5771] accent-[#0D5771]"
                      />
                      <span>Enable Floating WhatsApp Chat Widget on Live Site</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900">
                    Automated Booking Message Template
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Available variables: <span className="font-mono text-[#0D5771] font-bold">{'{businessName}'}</span>,{' '}
                    <span className="font-mono text-[#0D5771] font-bold">{'{serviceName}'}</span>,{' '}
                    <span className="font-mono text-[#0D5771] font-bold">{'{price}'}</span>
                  </p>
                </div>
                <textarea
                  rows={3}
                  value={whatsapp.defaultBookingTemplate}
                  onChange={(e) => service.updateWhatsAppConfig({ defaultBookingTemplate: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771] font-sans"
                />
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900">
                    Product Order Message Template
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Available variables: <span className="font-mono text-[#0D5771] font-bold">{'{businessName}'}</span>,{' '}
                    <span className="font-mono text-[#0D5771] font-bold">{'{productName}'}</span>,{' '}
                    <span className="font-mono text-[#0D5771] font-bold">{'{price}'}</span>
                  </p>
                </div>
                <textarea
                  rows={2}
                  value={whatsapp.defaultProductOrderTemplate}
                  onChange={(e) => service.updateWhatsAppConfig({ defaultProductOrderTemplate: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771] font-sans"
                />
              </div>
            </div>
          )}

          {/* ── 2. SERVICES TAB ── */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 font-display">Services &amp; Pricing Catalog</h2>
                  <p className="text-xs text-slate-500 font-mono">Manage luxury packages, appointments, pricing, and duration tiers</p>
                </div>
                <button
                  onClick={() => setShowAddService(!showAddService)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D5771] text-white text-xs font-bold hover:bg-[#083D50] transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Service</span>
                </button>
              </div>

              {/* Add Service Form */}
              {showAddService && (
                <form onSubmit={handleAddService} className="p-6 rounded-2xl bg-white border border-[#0D5771]/30 shadow-md space-y-4 animate-in fade-in">
                  <h3 className="text-xs font-bold font-mono text-[#0D5771] uppercase tracking-wider">Create New Service</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Service Name</label>
                      <input
                        type="text"
                        required
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="e.g. Royal Bridal Suite"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Price ({currencySymbol})</label>
                      <input
                        type="number"
                        required
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Duration (Minutes)</label>
                      <input
                        type="number"
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Badge Tag</label>
                      <select
                        value={newServiceTag}
                        onChange={(e) => setNewServiceTag(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                      >
                        <option value="SIGNATURE">SIGNATURE</option>
                        <option value="BRIDAL">BRIDAL</option>
                        <option value="VIP">VIP</option>
                        <option value="POPULAR">POPULAR</option>
                        <option value="NEW">NEW</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Description</label>
                      <input
                        type="text"
                        value={newServiceDesc}
                        onChange={(e) => setNewServiceDesc(e.target.value)}
                        placeholder="Short summary of what is included"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddService(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold bg-[#0D5771] text-white rounded-xl hover:bg-[#083D50]"
                    >
                      Save Service
                    </button>
                  </div>
                </form>
              )}

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 gap-3">
                {services.map((srv) => (
                  <div key={srv.id} className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs hover:shadow-sm transition-all">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-slate-900 font-display">{srv.name}</span>
                        {srv.tag && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {srv.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{srv.description}</p>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                        {srv.durationMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{srv.durationMinutes} mins</span>
                          </span>
                        )}
                        <span>•</span>
                        <span className="capitalize">{srv.locationType.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className="text-base font-mono font-extrabold text-[#0D5771]">
                        {currencySymbol}{srv.price}
                      </span>
                      <button
                        onClick={() => service.deleteServiceItem(srv.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Delete Service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 3. PRODUCTS TAB ── */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 font-display">Physical &amp; Digital Products</h2>
                  <p className="text-xs text-slate-500 font-mono">Manage beauty products, inventory, prices, and e-commerce goods</p>
                </div>
                <button
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D5771] text-white text-xs font-bold hover:bg-[#083D50] transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Add Product Form */}
              {showAddProduct && (
                <form onSubmit={handleAddProduct} className="p-6 rounded-2xl bg-white border border-[#0D5771]/30 shadow-md space-y-4 animate-in fade-in">
                  <h3 className="text-xs font-bold font-mono text-[#0D5771] uppercase tracking-wider">Create New Product</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Product Name</label>
                      <input
                        type="text"
                        required
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        placeholder="e.g. Haute Silk Lashes"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Price ({currencySymbol})</label>
                      <input
                        type="number"
                        required
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Category</label>
                      <input
                        type="text"
                        value={newProductCategory}
                        onChange={(e) => setNewProductCategory(e.target.value)}
                        placeholder="e.g. Lashes, Skincare"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Description</label>
                    <input
                      type="text"
                      value={newProductDesc}
                      onChange={(e) => setNewProductDesc(e.target.value)}
                      placeholder="Short product feature summary"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddProduct(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold bg-[#0D5771] text-white rounded-xl hover:bg-[#083D50]"
                    >
                      Save Product
                    </button>
                  </div>
                </form>
              )}

              {/* Product Cards List */}
              <div className="grid grid-cols-1 gap-3">
                {products.map((prd) => (
                  <div key={prd.id} className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs hover:shadow-sm transition-all">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-slate-900 font-display">{prd.name}</span>
                        {prd.category && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-100 text-slate-700">
                            {prd.category}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                          In Stock
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{prd.description}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className="text-base font-mono font-extrabold text-[#0D5771]">
                        {currencySymbol}{prd.price}
                      </span>
                      <button
                        onClick={() => service.deleteProductItem(prd.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 4. MEDIA VAULT & EXTRACTED ASSETS TAB ── */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 font-display">Media Vault &amp; Asset Library</h2>
                  <p className="text-xs text-slate-500 font-mono">Instagram media, uploaded visuals, videos &amp; brand photography</p>
                </div>
                <button
                  onClick={() => setShowAddMedia(!showAddMedia)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D5771] text-white text-xs font-bold hover:bg-[#083D50] transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Media</span>
                </button>
              </div>

              {/* Context Banner */}
              <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <span className="font-bold block">AI Visual Intelligence &amp; 1-Click Replacement</span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Assets stored here are automatically injected into Cuzmify AI prompts as your business&apos;s authentic media. The AI prioritizes your real client photography and product shots, but can also generate supporting SVGs, icons, and curated graphics where needed.
                  </p>
                </div>
              </div>

              {/* Add Media Form */}
              {showAddMedia && (
                <form onSubmit={handleAddMedia} className="p-6 rounded-2xl bg-white border border-[#0D5771]/30 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold font-mono text-[#0D5771] uppercase tracking-wider">Add Media Asset</h3>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setMediaUploadMode('file')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                          mediaUploadMode === 'file' ? 'bg-white text-[#0D5771] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        ⬆️ Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setMediaUploadMode('url')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                          mediaUploadMode === 'url' ? 'bg-white text-[#0D5771] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        🔗 Web / Instagram URL
                      </button>
                    </div>
                  </div>

                  {/* Upload Dropzone */}
                  {mediaUploadMode === 'file' ? (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,video/*"
                        className="hidden"
                      />
                      {uploadedFilePreview ? (
                        <div className="relative rounded-xl border border-slate-200 p-3 bg-slate-50 flex items-center gap-4">
                          <div className="w-20 h-16 rounded-lg bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {newMediaType === 'video' ? (
                              <Film className="w-6 h-6 text-slate-600" />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={uploadedFilePreview} alt="Preview" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{newMediaName || 'Uploaded File'}</p>
                            <span className="text-[10px] font-mono text-emerald-600 font-bold">✓ Ready to save to vault</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
                          >
                            Change File
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-300 hover:border-[#0D5771] rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 group"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-[#0D5771] group-hover:scale-110 transition-transform">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {isUploading ? 'Reading file…' : 'Click to browse or drag image/video file here'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Supports JPG, PNG, WEBP, SVG, and MP4 video clips (up to 15MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Image or Video URL</label>
                      <input
                        type="url"
                        required
                        value={newMediaUrl}
                        onChange={(e) => setNewMediaUrl(e.target.value)}
                        placeholder="https://... (Instagram CDN or image URL)"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771] font-mono"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Asset Title / Name</label>
                      <input
                        type="text"
                        required
                        value={newMediaName}
                        onChange={(e) => setNewMediaName(e.target.value)}
                        placeholder="e.g. Bridal Glam Transformation"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Asset Category</label>
                      <select
                        value={newMediaType}
                        onChange={(e) => setNewMediaType(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                      >
                        <option value="hero">Hero Background / Banner</option>
                        <option value="gallery">Portfolio Gallery</option>
                        <option value="service">Service Showcase</option>
                        <option value="product">Product Photo</option>
                        <option value="video">Reel / Video</option>
                        <option value="testimonial">Client Review Photo</option>
                        <option value="logo">Brand Logo</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Source</label>
                      <select
                        value={newMediaSource}
                        onChange={(e) => setNewMediaSource(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                      >
                        <option value="upload">⬆️ Direct Device Upload</option>
                        <option value="instagram">📷 Instagram Import</option>
                        <option value="unsplash">✨ Curated Royalty-Free</option>
                        <option value="template">🎨 Starter Template</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Caption / Context / Post URL</label>
                      <input
                        type="text"
                        value={newMediaCaption}
                        onChange={(e) => setNewMediaCaption(e.target.value)}
                        placeholder="e.g. Flawless bride Sarah for her Malibu wedding #bridalglam"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddMedia(false);
                        setUploadedFilePreview(null);
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold bg-[#0D5771] text-white rounded-xl hover:bg-[#083D50]"
                    >
                      Save Media to Vault
                    </button>
                  </div>
                </form>
              )}

              {/* Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'all' as const, label: `All (${mediaVault.length})` },
                  { id: 'instagram' as const, label: `📷 Instagram (${mediaVault.filter((m) => m.source === 'instagram').length})` },
                  { id: 'upload' as const, label: `⬆️ Uploads (${mediaVault.filter((m) => m.source === 'upload').length})` },
                  { id: 'video' as const, label: `🎬 Videos (${mediaVault.filter((m) => m.type === 'video').length})` },
                  { id: 'service' as const, label: `💇 Services & Products (${mediaVault.filter((m) => m.type === 'service' || m.type === 'product').length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setMediaFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      mediaFilter === f.id
                        ? 'bg-[#0D5771] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Media Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {mediaVault
                  .filter((m) => {
                    if (mediaFilter === 'all') return true;
                    if (mediaFilter === 'instagram') return m.source === 'instagram';
                    if (mediaFilter === 'upload') return m.source === 'upload';
                    if (mediaFilter === 'video') return m.type === 'video';
                    if (mediaFilter === 'service') return m.type === 'service' || m.type === 'product';
                    return true;
                  })
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all group flex flex-col"
                    >
                      {/* Media Preview */}
                      <div className="relative aspect-video bg-slate-100 overflow-hidden">
                        {asset.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                            <Film className="w-8 h-8 text-white/80" />
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-black/60 text-white backdrop-blur-xs">
                          {asset.source === 'instagram' ? '📷 Instagram' : asset.source === 'upload' ? '⬆️ Upload' : '✨ Curated'}
                        </span>
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/90 text-slate-800 shadow-2xs capitalize">
                          {asset.type}
                        </span>
                      </div>

                      {/* Content Info */}
                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate font-display">{asset.name}</h4>
                          {asset.caption && (
                            <p className="text-[10px] text-slate-500 line-clamp-2 leading-snug font-sans">
                              {asset.caption}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              service.applyMediaToSelected(asset.url, asset.name);
                              setSaveToast(`✦ Applied "${asset.name}" to canvas`);
                              setTimeout(() => setSaveToast(null), 2500);
                            }}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-[#0D5771]/10 hover:bg-[#0D5771] text-[#0D5771] hover:text-white text-[10px] font-bold transition-all cursor-pointer text-center"
                          >
                            Apply to Canvas
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(asset.url);
                              setSaveToast('✦ Copied URL to clipboard');
                              setTimeout(() => setSaveToast(null), 2000);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all cursor-pointer"
                            title="Copy URL"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => service.deleteMediaAsset(asset.id)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-400 transition-all cursor-pointer"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── 5. PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 font-display">Business Profile &amp; Currency</h2>
                <p className="text-xs text-slate-500 font-mono">Central identity, contact channels &amp; localization settings</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">Business Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => service.updateProfile({ name: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">Primary Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => service.updateProfile({ currency: e.target.value as CurrencyCode })}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771] font-mono"
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
                  <label className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">Tagline / Mission</label>
                  <input
                    type="text"
                    value={profile.tagline}
                    onChange={(e) => service.updateProfile({ tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => service.updateProfile({ email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">City / Location</label>
                    <input
                      type="text"
                      value={profile.city}
                      onChange={(e) => service.updateProfile({ city: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 5. PAYMENTS TAB ── */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 font-display">Online Payments &amp; Direct Checkout</h2>
                <p className="text-xs text-slate-500 font-mono">Automated card payments, mobile bank transfers &amp; deposits</p>
              </div>

              <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-200/80 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-950 font-display">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>PCI-DSS Compliant Payment Gateways</span>
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed max-w-2xl">
                  Connect Paystack, Flutterwave, or Stripe to collect online payments, bridal deposits, or instant product purchases.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">Active Mode</span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ WhatsApp Hybrid Checkout Active
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Customers can review their orders or booking details and complete the checkout directly on WhatsApp or connect automated payment webhooks.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>,
    document.body
  );
}
