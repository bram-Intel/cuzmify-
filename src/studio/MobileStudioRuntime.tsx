'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useEditor } from './engine/EditorContext';
import { EditorService } from './engine/EditorService';
import { attachStudioRuntime } from './engine/studio-runtime';

/**
 * Ultra-lightweight Mobile Studio Runtime (<1024px):
 * Boots EditorService in pure headless blueprint mode with zero GrapesJS download,
 * zero iframe initialization, and instant 0ms UI hydration.
 */
export function MobileStudioRuntime() {
  const {
    setService,
    setSaveState,
    setCanUndo,
    setCanRedo,
    setIsHydratingSite,
    projectId,
    businessName,
    setBusinessName,
    theme,
    setTheme,
  } = useEditor();

  const { data: session } = useSession();
  const currentUserId = session?.user?.id || session?.user?.email || 'guest';

  const themeRef = useRef(theme);
  const businessNameRef = useRef(businessName);
  const userIdRef = useRef(currentUserId);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    businessNameRef.current = businessName;
  }, [businessName]);

  useEffect(() => {
    userIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    const service = new EditorService(null, businessNameRef.current);
    const cleanup = attachStudioRuntime(service, {
      projectId,
      userIdRef,
      businessNameRef,
      themeRef,
      isHeadless: true,
      setService,
      setSaveState,
      setCanUndo,
      setCanRedo,
      setBusinessName,
      setTheme,
      setIsHydratingSite,
    });

    if (typeof window !== 'undefined') {
      (window as any).__cuzmifyService = service;
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
