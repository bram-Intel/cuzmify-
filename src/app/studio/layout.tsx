/**
 * Studio layout — bypasses the global Header/Footer/Providers wrapper.
 * The Studio is a full-screen application that manages its own layout.
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cuzmify Studio — Visual Website Editor',
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
