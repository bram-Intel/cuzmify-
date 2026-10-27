'use client';

import React from 'react';

/**
 * MobileGuard previously blocked mobile screens (<1024px) from accessing the Studio.
 * Cuzmify Studio is now Mobile-First with a dedicated thumb-friendly dock and responsive drawers,
 * allowing creators on iPhone and Android to build, sync Instagram, manage catalog, and publish on the go.
 */
export function MobileGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

