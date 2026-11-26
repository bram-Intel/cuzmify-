'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import type { EditorService } from './EditorService';
import type { ThemeName } from '@/core/project-schema';

import type { BusinessBlueprint, CurrencyCode } from '@/core/blueprint-schema';
import { resolveTemplateEngineId, TEMPLATE_ENGINES, type TemplateEngineId } from '@/core/template-engines';
import { resolveNicheBlueprint } from '@/core/niche-blueprints';
import { readStudioLocalSnapshot } from './blueprint-persistence';

export type Breakpoint = 'desktop' | 'tablet' | 'mobile';
export type SaveState = 'saved' | 'saving' | 'unsaved' | 'error';
export type PanelTab = 'add' | 'pages' | 'modules' | 'assets' | 'media' | 'ai';
export type ModuleModalType = 'whatsapp' | 'services' | 'products' | 'media' | 'profile' | 'cart' | 'payments' | null;

export interface SelectedComponent {
  type: string | null;
  traits: Record<string, string>;
}

export interface TargetElementContext {
  id?: string;
  tagName: string;
  type?: string;
  text?: string;
  classes?: string;
  htmlSnippet?: string;
}

interface EditorContextValue {
  // Service reference
  service: EditorService | null;
  setService: (s: EditorService | null) => void;

  // Blueprint & Module Config Modal
  blueprint: BusinessBlueprint | null;
  activeModuleModal: ModuleModalType;
  setActiveModuleModal: (m: ModuleModalType) => void;

  // UI State
  breakpoint: Breakpoint;
  setBreakpoint: (b: Breakpoint) => void;

  saveState: SaveState;
  setSaveState: (s: SaveState) => void;

  theme: ThemeName;
  setTheme: (t: ThemeName) => void;

  selectedComponent: SelectedComponent;
  setSelectedComponent: (c: SelectedComponent) => void;

  targetElement: TargetElementContext | null;
  setTargetElement: (el: TargetElementContext | null) => void;

  isAiChatOpen: boolean;
  setIsAiChatOpen: (v: boolean) => void;

  leftPanelTab: PanelTab;
  setLeftPanelTab: (t: PanelTab) => void;

  isLeftPanelOpen: boolean;
  setIsLeftPanelOpen: (v: boolean) => void;

  isPreviewMode: boolean;
  setIsPreviewMode: (v: boolean) => void;

  isHydratingSite: boolean;
  setIsHydratingSite: (v: boolean) => void;

  canUndo: boolean;
  setCanUndo: (v: boolean) => void;

  canRedo: boolean;
  setCanRedo: (v: boolean) => void;

  businessName: string;
  setBusinessName: (n: string) => void;

  activeModules: string[];
  setActiveModules: (m: string[]) => void;

  projectId: string;
  saveToast: string | null;
  setSaveToast: (msg: string | null) => void;

  // Template & Niche Engine
  templateId: TemplateEngineId;
  nicheId: string;
  handleTemplateSwitch: (tplId: TemplateEngineId) => void;
  handleNicheSwitch: (nicheId: string) => void;

  // Actions
  attachSelectedToChat: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  handleSave: (isAuto?: boolean) => Promise<void>;
  handleThemeChange: (t: ThemeName) => void;
  handleDeviceChange: (b: Breakpoint) => void;
  handlePreviewToggle: () => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({
  children,
  initialBusinessName,
  initialTheme,
  projectId,
  initialCurrency,
  initialCategory,
  initialNicheId,
  initialWhatsapp,
  initialInstagram,
  initialTemplate,
}: {
  children: React.ReactNode;
  initialBusinessName: string;
  initialTheme: ThemeName;
  projectId: string;
  initialCurrency?: CurrencyCode;
  initialCategory?: string;
  initialNicheId?: string;
  initialWhatsapp?: string;
  initialInstagram?: string;
  initialTemplate?: string;
}) {
  const [service, setService] = useState<EditorService | null>(null);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [theme, setTheme] = useState<ThemeName>(initialTheme);
  const [templateId, setTemplateId] = useState<TemplateEngineId>(resolveTemplateEngineId(initialTemplate));
  const [nicheId, setNicheId] = useState<string>(initialNicheId || resolveNicheBlueprint(initialCategory).id);
  const [selectedComponent, setSelectedComponent] = useState<SelectedComponent>({ type: null, traits: {} });
  const [leftPanelTab, setLeftPanelTab] = useState<PanelTab>('add');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [activeModules, setActiveModules] = useState<string[]>(['BOOKING', 'CATALOG']);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [targetElement, setTargetElement] = useState<TargetElementContext | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [activeModuleModal, setActiveModuleModal] = useState<ModuleModalType>(null);

  const { data: session } = useSession();
  const currentUserId = session?.user?.id || session?.user?.email || 'guest';

  // Synchronously warm-hydrate cached blueprint before async GrapesJS loads so mobile & inspector never flash boilerplate on reload
  const initialCachedSnapshot = React.useMemo(() => {
    if (typeof window === 'undefined') return null;
    const snap = readStudioLocalSnapshot(window.localStorage, projectId, currentUserId);
    if (!snap || snap.mediaStrippedForQuota) return null;
    return snap.blueprint;
  }, [currentUserId, projectId]);

  const [blueprint, setBlueprint] = useState<BusinessBlueprint | null>(initialCachedSnapshot);
  const [isHydratingSite, setIsHydratingSite] = useState<boolean>(() => !initialCachedSnapshot);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (initialCachedSnapshot) {
      setBlueprint((prev) => prev || initialCachedSnapshot);
      if (initialCachedSnapshot.templateId) setTemplateId(resolveTemplateEngineId(initialCachedSnapshot.templateId));
      if (initialCachedSnapshot.nicheId) setNicheId(initialCachedSnapshot.nicheId);
      if (initialCachedSnapshot.profile?.name && initialCachedSnapshot.profile.name !== 'Gmakeup Studio') {
        setBusinessName(initialCachedSnapshot.profile.name);
      }
      setIsHydratingSite(false);
    }
  }, [initialCachedSnapshot]);

  // Synchronize reactive history state (Undo / Redo buttons) and Blueprint
  React.useEffect(() => {
    if (!service) return;

    const currentProf = service.getBlueprint()?.profile;
    const profilePatch: Record<string, any> = {};
    if (initialInstagram && !currentProf?.instagramHandle) profilePatch.instagramHandle = initialInstagram;
    if (initialCurrency && !currentProf?.currency) profilePatch.currency = initialCurrency;
    if (initialWhatsapp && !currentProf?.whatsapp) profilePatch.whatsapp = initialWhatsapp;
    if (initialCategory && !currentProf?.category) profilePatch.category = initialCategory;
    if (Object.keys(profilePatch).length > 0) {
      service.updateProfile(profilePatch);
    }
    if (initialWhatsapp && !service.getWhatsAppConfig()?.phoneNumber) {
      service.updateWhatsAppConfig({ phoneNumber: initialWhatsapp });
    }

    const initialBp = service.getBlueprint();
    setBlueprint(initialBp);
    if (initialBp?.profile?.name && initialBp.profile.name !== 'Gmakeup Studio') {
      setBusinessName(initialBp.profile.name);
    }

    const unsubHistory = service.onHistoryChange((state) => {
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    });

    const unsubBlueprint = service.onBlueprintChange((bp) => {
      setBlueprint({ ...bp });
      if (bp.templateId) setTemplateId(resolveTemplateEngineId(bp.templateId));
      if (bp.nicheId) setNicheId(bp.nicheId);
      if (bp.profile?.name && bp.profile.name !== 'Gmakeup Studio') {
        setBusinessName(bp.profile.name);
      }
    });

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isSynced = urlParams.get('synced') === 'instagram';
      if (isSynced) {
        setSaveToast('✨ Instagram Connected & Assets Synced to Studio!');
        setTimeout(() => setSaveToast(null), 4000);
      }
    }

    return () => {
      unsubHistory();
      unsubBlueprint();
    };
  }, [service]);

  const handleUndo = useCallback(() => {
    service?.undo();
    setCanUndo(service?.canUndo() ?? false);
    setCanRedo(service?.canRedo() ?? false);
  }, [service]);

  const handleRedo = useCallback(() => {
    service?.redo();
    setCanUndo(service?.canUndo() ?? false);
    setCanRedo(service?.canRedo() ?? false);
  }, [service]);

  const handleSave = useCallback(async (isAuto = false) => {
    if (!service) return;
    setSaveState('saving');
    try {
      service.saveToLocalStorage(projectId, theme, currentUserId);
      const ok = await service.saveToDatabase(projectId, { businessName, theme });
      if (ok) {
        service.saveToLocalStorage(projectId, theme, currentUserId);
        setSaveState('saved');
        if (!isAuto) {
          setSaveToast('✓ Project saved to Database!');
          setTimeout(() => setSaveToast(null), 3000);
        }
      } else {
        setSaveState('error');
        if (!isAuto) {
          setSaveToast('⚠️ Cloud save failed — saved locally on device');
          setTimeout(() => setSaveToast(null), 3500);
        }
      }
    } catch {
      setSaveState('error');
      setSaveToast('⚠️ Could not save to cloud');
      setTimeout(() => setSaveToast(null), 3000);
    }
  }, [service, projectId, theme, businessName, currentUserId]);

  const handleThemeChange = useCallback((t: ThemeName) => {
    setTheme(t);
    service?.applyTheme(t);
    setSaveState('unsaved');

    // Autosave after theme change
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      service?.saveToLocalStorage(projectId, t, currentUserId);
      setSaveState('saved');
    }, 1500);
  }, [service, projectId, currentUserId]);

  const handleTemplateSwitch = useCallback((tplId: TemplateEngineId) => {
    setTemplateId(tplId);
    service?.switchTemplate(tplId, projectId);
    service?.saveToLocalStorage(projectId, theme, currentUserId);
    setSaveToast(`✨ Switched look to "${TEMPLATE_ENGINES[tplId].name}" — all your content stayed intact!`);
    setTimeout(() => setSaveToast(null), 3000);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!service) return;
      service.saveToLocalStorage(projectId, theme, currentUserId);
      const ok = await service.saveToDatabase(projectId, { businessName, theme });
      setSaveState(ok ? 'saved' : 'error');
    }, 600);
  }, [service, projectId, theme, businessName, currentUserId]);

  const handleNicheSwitch = useCallback((nextNicheId: string) => {
    const resolved = resolveNicheBlueprint(nextNicheId);
    setNicheId(resolved.id);
    service?.switchNiche(resolved.id, projectId);
    setSaveToast(`✦ Updated niche to "${resolved.shortLabel}"`);
    setTimeout(() => setSaveToast(null), 2500);
  }, [service, projectId]);

  const handleDeviceChange = useCallback((b: Breakpoint) => {
    setBreakpoint(b);
    service?.setDevice(b);
  }, [service]);

  const handlePreviewToggle = useCallback(() => {
    if (isPreviewMode) {
      service?.disablePreview();
      setIsPreviewMode(false);
    } else {
      service?.enablePreview();
      setIsPreviewMode(true);
    }
  }, [service, isPreviewMode]);

  const attachSelectedToChat = useCallback(() => {
    if (!service) return;
    const details = service.getSelectedElementDetails();
    if (details) {
      setTargetElement(details);
      setLeftPanelTab('add');
      setIsLeftPanelOpen(true);
      setSaveToast(`🎯 Attached <${details.tagName}> #${details.id} to AI Chat`);
      setTimeout(() => setSaveToast(null), 2500);
    }
  }, [service]);

  const value: EditorContextValue = {
    service, setService,
    blueprint,
    activeModuleModal, setActiveModuleModal,
    breakpoint, setBreakpoint,
    saveState, setSaveState,
    theme, setTheme,
    selectedComponent, setSelectedComponent,
    targetElement, setTargetElement,
    isAiChatOpen, setIsAiChatOpen,
    leftPanelTab, setLeftPanelTab,
    isLeftPanelOpen, setIsLeftPanelOpen,
    isPreviewMode, setIsPreviewMode,
    isHydratingSite, setIsHydratingSite,
    canUndo, setCanUndo,
    canRedo, setCanRedo,
    businessName, setBusinessName,
    activeModules, setActiveModules,
    projectId,
    saveToast, setSaveToast,
    templateId,
    nicheId,
    handleTemplateSwitch,
    handleNicheSwitch,
    attachSelectedToChat,
    handleUndo, handleRedo, handleSave,
    handleThemeChange, handleDeviceChange, handlePreviewToggle,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}
