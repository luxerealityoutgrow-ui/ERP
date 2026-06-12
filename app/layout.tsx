// app/layout.tsx
import { ReactNode } from 'react';
import './styles/globals.css';
import { AppShell } from '@/components/layout/AppShell';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased h-screen overflow-hidden">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
