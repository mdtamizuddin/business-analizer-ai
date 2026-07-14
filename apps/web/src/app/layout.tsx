import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ABAP - AI Business Audit Platform',
  description: 'AI-powered business intelligence platform for digital presence analysis',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
