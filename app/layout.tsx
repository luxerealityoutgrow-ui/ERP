// app/layout.tsx
import { ReactNode } from 'react';
import './styles/globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased h-screen overflow-hidden">
        <AppShell>{children}</AppShell>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
