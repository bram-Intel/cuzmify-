'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import type { EditorService } from './EditorService';
import type { ThemeName } from '@/core/project-schema';

import type { BusinessBlueprint } from '@/core/blueprint-schema';

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
}: {
  children: React.ReactNode;
  initialBusinessName: string;
  initialTheme: ThemeName;
  projectId: string;
}) {
  const [service, setService] = useState<EditorService | null>(null);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [theme, setTheme] = useState<ThemeName>(initialTheme);
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
  const [blueprint, setBlueprint] = useState<BusinessBlueprint | null>(null);

  const { data: session } = useSession();
  const currentUserId = session?.user?.id || session?.user?.email || 'guest';
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize reactive history state (Undo / Redo buttons) and Blueprint
  React.useEffect(() => {
    if (!service) return;
    setBlueprint(service.getBlueprint());

    const unsubHistory = service.onHistoryChange((state) => {
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
    });

    const unsubBlueprint = service.onBlueprintChange((bp) => {
      setBlueprint({ ...bp });
    });

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
      await service.saveToDatabase(projectId, { businessName, theme });
      setSaveState('saved');
      if (!isAuto) {
        setSaveToast('✓ Project saved to Database!');
        setTimeout(() => setSaveToast(null), 3000);
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
    canUndo, setCanUndo,
    canRedo, setCanRedo,
    businessName, setBusinessName,
    activeModules, setActiveModules,
    projectId,
    saveToast, setSaveToast,
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
