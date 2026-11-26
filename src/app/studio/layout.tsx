/**
 * Studio layout — bypasses the global Header/Footer/Providers wrapper.
 * The Studio is a full-screen application that manages its own layout,
 * locking mobile viewport scaling to 1:1 so scrolling and inline edits never trigger browser zoom jumps.
 */
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Cuzmify Studio — Visual Website Editor',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
  viewportFit: 'cover',
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
